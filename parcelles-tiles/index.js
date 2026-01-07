#!/usr/bin/env node

import 'dotenv/config'
import fs from 'node:fs/promises'
import { createWriteStream, createReadStream } from 'node:fs'
import { pipeline } from 'node:stream/promises'
import got from 'got'
import path from 'path'
import { spawn } from 'node:child_process'
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3'

const WORKDIR = process.env.WORKDIR
const DATA_URL = process.env.DATA_URL

const GEOJSON = path.join(WORKDIR, 'parcelles_france.geojsonseq')
const OUT_PM = path.join(WORKDIR, 'parcelles_france.pmtiles')

const S3_ENDPOINT = process.env.S3_ENDPOINT
const S3_REGION = process.env.S3_REGION || 'par'
const S3_BUCKET = process.env.S3_BUCKET
const S3_KEY = process.env.S3_KEY || '2024/parcelles_france.pmtiles'
const S3_ACCESS_KEY_ID = process.env.S3_ACCESS_KEY_ID
const S3_SECRET_ACCESS_KEY = process.env.S3_SECRET_ACCESS_KEY

await fs.mkdir(WORKDIR, { recursive: true })

// Téléchargement archive (mono ou multi-parties)
console.log('💾 Téléchargement RPG...')

const url = new URL(DATA_URL)
const fileName = path.basename(url.pathname)
let archiveToExtract = null

async function downloadPart(url, outputPath, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      await pipeline(
        got.stream(url, {
          timeout: { request: 60000 },
          headers: { 'user-agent': 'Mozilla/5.0' },
        }),
        createWriteStream(outputPath)
      )
      return
    } catch (err) {
      if (err.response?.statusCode === 404) {
        throw err
      }

      if (attempt === retries) {
        throw err
      }

      console.log(`⚠  Erreur réseau, retry ${attempt}/${retries}...`)
      await new Promise((r) => setTimeout(r, 2000))
    }
  }
}

// Si l'archive est en plusieurs parties
if (fileName.endsWith('.7z.001')) {
  console.log('ℹ Archive multi-parties détectée')

  const baseName = fileName.replace(/\.001$/, '')
  const basePath = path.dirname(url.pathname)
  let part = 1

  while (true) {
    const partSuffix = String(part).padStart(3, '0')
    const partName = `${baseName}.${partSuffix}`
    const partUrl = `${url.origin}${basePath}/${partName}`
    const partPath = path.join(WORKDIR, partName)

    try {
      await downloadPart(partUrl, partPath)

      if (part === 1) {
        archiveToExtract = partPath
      }

      console.log(`✔  Téléchargé ${partName}`)
      part++
    } catch (err) {
      if (err.response?.statusCode === 404) {
        console.log('ℹ Fin des parties détectée')
        break
      }
      throw err
    }
  }

  if (!archiveToExtract) {
    throw new Error('Aucune partie téléchargée')
  }
} else {
  console.log('ℹ Archive mono-fichier détectée')

  const archivePath = path.join(WORKDIR, fileName)

  await downloadPart(DATA_URL, archivePath)

  archiveToExtract = archivePath
}

// Décompression de l'archive
console.log('📦 Décompression...')

await new Promise((resolve, reject) => {
  let stderrData = ''
  const p = spawn('7z', ['x', archiveToExtract, `-o${WORKDIR}`])

  p.stdout.pipe(process.stdout)
  p.stderr.pipe(process.stderr)
  p.stderr.on('data', (chunk) => {
    stderrData += chunk.toString()
  })

  p.on('close', (c) => {
    if (c === 0) {
      resolve()
    } else {
      const message =
        `L'extraction de l'archive a échoué avec le code :  ${c}` +
        (stderrData ? `; erreur : ${stderrData}` : '')
      reject(new Error(message))
    }
  })
})

// Recherche du fichier GPKG
async function findParcelles(dir) {
  for (const e of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, e.name)

    if (e.isFile() && e.name === 'RPG_Parcelles.gpkg') {
      return p
    }

    if (e.isDirectory()) {
      const f = await findParcelles(p)

      if (f) {
        return f
      }
    }
  }

  return null
}

const GPKG = await findParcelles(WORKDIR)

if (!GPKG) {
  throw new Error('Aucun fichier RPG_Parcelles.gpkg trouvé')
}

console.log('ℹ GPKG trouvé :', GPKG)

// Conversion GPKG → GeoJSONSeq
console.log('🗺  Conversion en GeoJSONSeq...')

await new Promise((resolve, reject) => {
  let stderrData = ''
  const p = spawn('ogr2ogr', [
    '-f',
    'GeoJSONSeq',
    '-t_srs',
    'EPSG:4326',
    GEOJSON,
    GPKG,
    'RPG_Parcelles',
  ])

  p.stderr.on('data', (chunk) => {
    stderrData += chunk.toString()
  })
  p.stderr.pipe(process.stderr)

  p.on('close', (c) => {
    if (c === 0) {
      resolve()
    } else {
      const message =
        `La conversion ogr2ogr a échoué avec le code : ${c}` +
        (stderrData ? `; erreur : ${stderrData}` : '')
      reject(new Error(message))
    }
  })
})

// Conversion GeoJSON → PMTiles
console.log('🧱 Génération PMTiles...')

await new Promise((resolve, reject) => {
  let stderrData = ''
  const p = spawn('tippecanoe', [
    '-o',
    MBTILES,
    '--force',
    '--no-tile-compression',
    '--maximum-zoom=14',
    '--drop-densest-as-needed',
    '--extend-zooms-if-still-dropping',
    GEOJSON,
  ])

  p.stderr.on('data', (chunk) => {
    stderrData += chunk.toString()
  })
  p.stderr.pipe(process.stderr)

  p.on('close', (c) => {
    if (c === 0) {
      resolve()
    } else {
      const message =
        `La génération tippecanoe a échoué avec le code : ${c}` + (stderrData ? `; erreur : ${stderrData}` : '')
      reject(new Error(message))
    }
  })
})

console.log('✅ PMTiles généré dans', OUT_PM)

console.log('☁️ Upload vers S3...')

const s3Client = new S3Client({
  endpoint: S3_ENDPOINT,
  region: S3_REGION,
  credentials: {
    accessKeyId: S3_ACCESS_KEY_ID,
    secretAccessKey: S3_SECRET_ACCESS_KEY,
  },
})

const fileStream = createReadStream(OUT_PM)
const uploadParams = {
  Bucket: S3_BUCKET,
  Key: S3_KEY,
  Body: fileStream,
  ContentType: 'application/vnd.pmtiles',
}

try {
  await s3Client.send(new PutObjectCommand(uploadParams))
  console.log('✅ Fichier uploadé vers S3:', `s3://${S3_BUCKET}/${S3_KEY}`)
} catch (error) {
  console.error("❌ Erreur lors de l'upload S3:", error)
  throw error
}
