#!/usr/bin/env node

/**
 * Orchestrator — Script unifié pour traiter les données Qualité Eau
 * Traite plusieurs fichiers CAP_PLV_* et CAP_RES_* (csv/txt) en optimisant
 * la mémoire pour les fichiers > 1 giga, avec gestion des CSV mal formés.
 *
 * Usage:
 *   node orchestrator.mjs <input_directory> [output.parquet]
 */

import fs from 'fs'
import fsp from 'fs/promises'
import path from 'path'
import { spawn } from 'child_process'
import readline from 'readline'
import { pipeline } from 'stream/promises'
import { Transform } from 'stream'
import { parse } from 'csv-parse'
import { stringify } from 'csv-stringify'
import { checkFileExists, normalizeString, detectDelimiter } from './utils.mjs'
import {
  PLV_SOURCE_PATTERN,
  RES_SOURCE_PATTERN,
  COLUMNS_TO_KEEP_PLV,
  COLUMNS_TO_KEEP_RES,
  COLUMN_RENAME_MAP,
  PARQUET_FIELD_TYPES,
} from './config.mjs'

// Fonctions utilitaires.
// Elles normalisent les données brutes hétérogènes pour éviter de dupliquer
// les mêmes règles de nettoyage dans chaque étape du pipeline.
// Détecte les valeurs vides dans les fichiers sources, qui peuvent arriver sous
// plusieurs formes (`undefined`, `null`, chaîne vide, espaces).
const isEmptyValue = (v) => v === undefined || v === null || String(v).trim() === ''

// Convertit une valeur en nombre décimal tout en conservant `null` pour les
// entrées absentes ou invalides, afin de garder des colonnes réellement
// nullables dans le résultat final.
const toNumberValue = (v) => {
  if (isEmptyValue(v)) return null
  const cleaned = String(v).trim().replace(/\s/g, '').replace(/,/g, '.')
  const num = parseFloat(cleaned)
  return isNaN(num) ? null : num
}

// Réduit une ligne aux seules colonnes utiles. Ce filtrage réduit fortement la
// mémoire consommée avant les opérations de tri et de fusion.
const filterColumns = (row, columnsToKeep) => {
  const filtered = {}
  for (const col of columnsToKeep) {
    if (col in row) filtered[col] = row[col]
  }
  return filtered
}

// Centralise les options de parsing pour traiter les CSV un peu sales de la
// même manière partout, sans disperser les tolérances de lecture.
const getParseOptions = (delimiter = ',') => ({
  columns: true,
  delimiter,
  skip_empty_lines: true,
  relax_column_count: true,
  relax_quotes: true,
})

// Cherche une correspondance de référence en combinant normalisation stricte et
// heuristiques de sous-chaîne. Les textes métiers sont souvent incohérents, donc
// cette fonction privilégie la robustesse plutôt qu'un match exact fragile.
const findReferenceValue = (map, value) => {
  const key = normalizeString(value)
  if (!key) return ''

  const exact = map.get(key)
  if (exact) return exact

  if (key.length < 3) return ''

  for (const [refKey, refValue] of map.entries()) {
    if (refKey.length < 3) continue

    if (key.includes(refKey) || refKey.includes(key)) {
      return refValue
    }
  }

  return ''
}

// Uniformise les seuils numériques pour utiliser un format lisible et stable
// dans les sorties, indépendamment des séparateurs utilisés par la source.
const normalizeThresholdNumber = (value) => {
  const cleaned = String(value ?? '')
    .trim()
    .replace(/\s+/g, '')
  if (!cleaned) return ''

  const lastComma = cleaned.lastIndexOf(',')
  const lastDot = cleaned.lastIndexOf('.')

  let normalized
  if (lastComma > lastDot) {
    normalized = cleaned.replace(/\./g, '').replace(',', '.')
  } else if (lastDot > lastComma) {
    normalized = cleaned.replace(/,/g, '')
  } else {
    normalized = cleaned
  }

  const num = Number.parseFloat(normalized)
  if (Number.isNaN(num)) return cleaned

  return String(num).replace('.', ',')
}

// Harmonise les unités pour éviter que des variantes typographiques se
// multiplient dans les colonnes de sortie.
const normalizeThresholdUnit = (rawUnit) =>
  String(rawUnit ?? '')
    .replace(/\s*\/\s*/g, '/')
    .replace(/°\s*C/gi, '°C')
    .replace(/Unité pH/g, 'unité pH')
    .replace(/\s+/g, ' ')
    .trim()

// Recompose la limite de qualité dans un format canonique. L'objectif est de
// rendre les seuils comparables même si les fichiers amont utilisent plusieurs
// notations pour exprimer la même règle.
const formatLimiteQualite = (value) => {
  const cleaned = String(value ?? '').trim()
  if (!cleaned) return ''

  const withoutLeadingOperator = cleaned.replace(/^(<=?|>=?)\s*/, '').trim()
  const match = withoutLeadingOperator.match(/^([\d.,]+)\s*(.*)$/)
  if (!match) return ''

  const [, numericRaw, unitRaw] = match
  const numeric = normalizeThresholdNumber(numericRaw)
  const unit = normalizeThresholdUnit(unitRaw)
  return `<=${numeric}${unit ? ` ${unit}` : ''}`
}

// Canonicalise les références de qualité en traitant les cas connus, puis les
// intervalles simples. Cette logique s'adapte aux libellés métiers bruités sans
// perdre les informations de bornes et d'unités.
const formatReferenceQualite = (value) => {
  const cleaned = String(value ?? '').trim()
  if (!cleaned) return ''

  const normalized = cleaned.replace(/≥/g, '>=').replace(/≤/g, '<=').replace(/\s+/g, ' ').trim()

  if (/^>=?\s*180\s*et\s*<=?\s*1\s*000\s*ou\s*>=?\s*200\s*et\s*<=?\s*1\s*100/i.test(normalized)) {
    return '>=200 et <=1100 µS/cm'
  }

  if (/^2\s+et\s+aucun\s+changement\s+anormal/i.test(normalized)) {
    return '<=2 mg(C)/L'
  }

  const rangeWithBounds = normalized.match(/^>=?\s*([\d.,]+)\s*et\s*<=?\s*([\d.,]+)\s*(.*)$/i)
  if (rangeWithBounds) {
    const [, lowRaw, highRaw, unitRaw] = rangeWithBounds
    const low = normalizeThresholdNumber(lowRaw)
    const high = normalizeThresholdNumber(highRaw)
    const unit = normalizeThresholdUnit(unitRaw)
    return `>=${low} et <=${high}${unit ? ` ${unit}` : ''}`
  }

  const plainRange = normalized.match(/^([\d.,]+)\s*(?:-|a|à)\s*([\d.,]+)\s*(.*)$/i)
  if (plainRange) {
    const [, lowRaw, highRaw, unitRaw] = plainRange
    const low = normalizeThresholdNumber(lowRaw)
    const high = normalizeThresholdNumber(highRaw)
    const unit = normalizeThresholdUnit(unitRaw)
    return `>=${low} et <=${high}${unit ? ` ${unit}` : ''}`
  }

  const simpleThreshold = normalized.match(/^(?:<=?|>=?)?\s*([\d.,]+)\s*(.*)$/i)
  if (simpleThreshold) {
    const [, numericRaw, unitRaw] = simpleThreshold
    const numeric = normalizeThresholdNumber(numericRaw)
    const unit = normalizeThresholdUnit(unitRaw)
    return `<=${numeric}${unit ? ` ${unit}` : ''}`
  }

  return ''
}

// Charge un CSV à deux colonnes en ignorant l'en-tête et les doublons.
// Cette forme de chargement est suffisante pour les référentiels clé/valeur et
// évite de garder des structures plus lourdes en mémoire.
async function loadExactKeyValueCsv(filePath) {
  const map = new Map()
  const contenu = await fsp.readFile(filePath, 'utf8')
  const delimiter = await detectDelimiter(filePath)

  return new Promise((resolve, reject) => {
    const parser = parse({
      columns: false,
      skip_empty_lines: true,
      delimiter,
      relax_column_count: true,
    })

    let isFirstRow = true

    parser.on('readable', function () {
      let record
      while ((record = parser.read()) !== null) {
        if (isFirstRow) {
          isFirstRow = false
          continue
        }

        if (!Array.isArray(record) || record.length < 2) continue

        const key = normalizeString(record[0])
        const value = String(record[1] ?? '').trim()

        if (!key || !value || map.has(key)) continue
        map.set(key, value)
      }
    })

    parser.on('error', reject)
    parser.on('end', () => resolve(map))

    parser.write(contenu)
    parser.end()
  })
}

// Les exports TXT sont en pratique des CSV déguisés. On les recopie donc en .csv
// pour réutiliser exactement la même chaîne de traitement ensuite.
async function convertTxtToCsv(inputFile, outputFile) {
  await fsp.copyFile(inputFile, outputFile)
}

// Regroupe les fichiers par période afin d'associer un seul CSV par couple
// logique, avec conversion TXT→CSV seulement quand aucun CSV natif n'existe.
// Ce choix évite de dupliquer le traitement et conserve la période pour la
// vérification explicite d'appariement PLV/RES.
async function collectPreparedInputFiles(files, inputDir, sourcePattern) {
  const byPeriod = new Map()

  for (const file of files) {
    const match = file.match(sourcePattern)
    if (!match) continue
    const period = match[1]
    const ext = match[2].toLowerCase()
    const entry = byPeriod.get(period) ?? { csv: null, txt: null }
    entry[ext] = file
    byPeriod.set(period, entry)
  }

  const prepared = new Map()
  const generatedCsvPaths = []
  const sortedPeriods = Array.from(byPeriod.keys()).sort()

  for (const period of sortedPeriods) {
    const { csv, txt } = byPeriod.get(period)

    if (csv) {
      prepared.set(period, path.join(inputDir, csv))
      continue
    }

    if (!txt) {
      continue
    }

    const txtPath = path.join(inputDir, txt)
    const csvFileName = txt.replace(/\.txt$/i, '.csv')
    const csvPath = path.join(inputDir, csvFileName)

    console.log(`  Conversion TXT → CSV : ${txt} -> ${csvFileName}`)
    await convertTxtToCsv(txtPath, csvPath)
    prepared.set(period, csvPath)
    generatedCsvPaths.push(csvPath)
  }

  return { prepared, generatedCsvPaths }
}

// Découverte et chargement des fichiers
// Vérifie la présence des jeux PLV/RES puis charge tous les référentiels en
// appliquant des fallbacks de nommage pour absorber les variantes d'export.
async function discoverFiles(inputDir) {
  checkFileExists(inputDir)
  const files = await fsp.readdir(inputDir)

  const { prepared: plvFiles, generatedCsvPaths: plvGenerated } = await collectPreparedInputFiles(
    files,
    inputDir,
    PLV_SOURCE_PATTERN
  )
  const { prepared: resFiles, generatedCsvPaths: resGenerated } = await collectPreparedInputFiles(
    files,
    inputDir,
    RES_SOURCE_PATTERN
  )
  const generatedCsvPaths = [...plvGenerated, ...resGenerated]

  if (plvFiles.size === 0 || resFiles.size === 0) {
    throw new Error(`❌ Aucun fichier CAP_PLV_* ou CAP_RES_* (csv/txt) trouvé dans ${inputDir}`)
  }

  const parametres = JSON.parse(
    fs.existsSync(path.join(inputDir, 'parametres.json'))
      ? await fsp.readFile(path.join(inputDir, 'parametres.json'), 'utf8')
      : 'null'
  )

  // Helper local volontairement simple : il lit les référentiels CSV ad hoc
  // sans imposer un schéma spécifique, car leur structure varie selon le fichier.
  const loadCsvRef = async (filePath) => {
    if (!fs.existsSync(filePath)) return []
    const delimiter = await detectDelimiter(filePath)
    const records = []
    return new Promise((resolve, reject) => {
      fs.createReadStream(filePath)
        .pipe(parse(getParseOptions(delimiter)))
        .on('data', (row) => records.push(row))
        .on('end', () => resolve(records))
        .on('error', reject)
    })
  }

  const refCapFilteredPath = path.join(inputDir, 'ref_cap_filtered_renomme.csv')
  const refCapRawPath = path.join(inputDir, 'ref_cap.csv')
  let refCapLoaded = []
  if (fs.existsSync(refCapFilteredPath)) {
    refCapLoaded = await loadCsvRef(refCapFilteredPath)
  } else if (fs.existsSync(refCapRawPath)) {
    refCapLoaded = await loadCsvRef(refCapRawPath)
  }

  return {
    plvFiles,
    resFiles,
    generatedCsvPaths,
    parametres,
    captagesPrioritaires: await loadCsvRef(path.join(inputDir, 'captages_prioritaires.csv')),
    limiteQualite: await loadExactKeyValueCsv(path.join(inputDir, 'limite_qualite.csv')),
    referenceQualite: await loadExactKeyValueCsv(path.join(inputDir, 'reference_qualite.csv')),
    substancesParFonction: await loadCsvRef(path.join(inputDir, 'substances_par_fonction.csv')),
    refCapLoaded,
  }
}

// Filtrage et tri
// Nettoie chaque fichier, conserve seulement les colonnes utiles puis trie par
// `referenceprel` afin de rendre la fusion suivante déterministe et efficace.
async function filterAndSort(inputFile, columnsToKeep, outputFile) {
  console.log(`  Filtrage et tri : ${path.basename(inputFile)}`)

  const delimiter = await detectDelimiter(inputFile)
  const tempKeyedFile = `${outputFile}.keyed.tmp`
  const tempSortedKeyedFile = `${outputFile}.keyed.sorted.tmp`

  const sortKey = (value) =>
    String(value ?? '')
      .replace(/\t/g, ' ')
      .replace(/\r?\n/g, ' ')

  const runDiskSort = (inputPath, outputPath) =>
    new Promise((resolve, reject) => {
      const output = fs.createWriteStream(outputPath)
      const sortProcess = spawn('sort', ['-t', '\t', '-k1,1', inputPath], {
        env: { ...process.env, LC_ALL: 'C' },
        stdio: ['ignore', 'pipe', 'pipe'],
      })

      let stderr = ''
      let sortExited = false
      let outputFinished = false
      let sortExitCode = 0
      const maybeResolve = () => {
        if (!sortExited || !outputFinished) return
        if (sortExitCode !== 0) {
          reject(
            new Error(
              `sort a échoué avec le code ${sortExitCode}${stderr ? `: ${stderr.trim()}` : ''}`
            )
          )
          return
        }
        resolve()
      }

      sortProcess.stderr.on('data', (chunk) => {
        stderr += chunk.toString()
      })

      output.on('error', reject)
      output.on('finish', () => {
        outputFinished = true
        maybeResolve()
      })
      sortProcess.on('error', (err) => {
        reject(new Error(`Impossible d'exécuter sort : ${err.message}`))
      })

      sortProcess.stdout.pipe(output)
      sortProcess.on('close', (code) => {
        sortExited = true
        sortExitCode = code
        maybeResolve()
      })
    })

  try {
    await new Promise((resolve, reject) => {
      const keyedOutput = fs.createWriteStream(tempKeyedFile)
      keyedOutput.on('error', reject)

      const parser = fs
        .createReadStream(inputFile)
        .pipe(parse(getParseOptions(delimiter)))
        .on('error', reject)
        .on('data', (row) => {
          const filtered = filterColumns(row, columnsToKeep)
          const line = `${sortKey(filtered.referenceprel)}\t${JSON.stringify(filtered)}\n`

          if (!keyedOutput.write(line)) {
            parser.pause()
            keyedOutput.once('drain', () => parser.resume())
          }
        })
        .on('end', () => keyedOutput.end())

      keyedOutput.on('finish', resolve)
    })

    await runDiskSort(tempKeyedFile, tempSortedKeyedFile)

    const stringifier = stringify({ header: true, quoted: true })
    const outputStream = fs.createWriteStream(outputFile)
    stringifier.pipe(outputStream)

    const sortedLines = readline.createInterface({
      input: fs.createReadStream(tempSortedKeyedFile),
      crlfDelay: Infinity,
    })

    for await (const line of sortedLines) {
      const separatorIndex = line.indexOf('\t')
      if (separatorIndex === -1) continue
      const record = JSON.parse(line.slice(separatorIndex + 1))

      if (!stringifier.write(record)) {
        await new Promise((resolve) => stringifier.once('drain', resolve))
      }
    }

    stringifier.end()
    await new Promise((resolve, reject) => {
      outputStream.on('finish', resolve)
      outputStream.on('error', reject)
      stringifier.on('error', reject)
    })
  } finally {
    for (const tempFile of [tempKeyedFile, tempSortedKeyedFile]) {
      if (fs.existsSync(tempFile)) {
        await fsp.unlink(tempFile)
      }
    }
  }
}

// Fusion par merge ordonnée
// Construit une jointure par `referenceprel` en gardant la sortie stable et en
// évitant de réécrire une logique relationnelle complète hors du flux CSV.
async function mergeJoin(plvSortedFile, resSortedFile, outputFile) {
  console.log(
    `  Fusion ordonnée : ${path.basename(plvSortedFile)} + ${path.basename(resSortedFile)}`
  )

  let totalMerged = 0
  const allColumns = new Set([...COLUMNS_TO_KEEP_PLV, ...COLUMNS_TO_KEEP_RES])

  const columns = Array.from(allColumns).sort()
  const stringifier = stringify({
    header: true,
    quoted: true,
    columns,
  })
  const outputStream = fs.createWriteStream(outputFile)
  stringifier.pipe(outputStream)

  const keyOf = (row) => String(row?.referenceprel ?? '')
  const compareRefs = (a, b) => Buffer.from(a).compare(Buffer.from(b))
  const collectGroup = async (iterator, firstRow, ref) => {
    const rows = [firstRow]
    let next = await iterator.next()
    while (!next.done && keyOf(next.value) === ref) {
      rows.push(next.value)
      next = await iterator.next()
    }
    return { rows, next }
  }

  const plvParser = fs.createReadStream(plvSortedFile).pipe(parse(getParseOptions()))
  const resParser = fs.createReadStream(resSortedFile).pipe(parse(getParseOptions()))
  const plvIterator = plvParser[Symbol.asyncIterator]()
  const resIterator = resParser[Symbol.asyncIterator]()

  let plvStep = await plvIterator.next()
  let resStep = await resIterator.next()

  while (!plvStep.done && !resStep.done) {
    const plvRef = keyOf(plvStep.value)
    const resRef = keyOf(resStep.value)
    const comparison = compareRefs(plvRef, resRef)

    if (comparison < 0) {
      plvStep = await plvIterator.next()
      continue
    }
    if (comparison > 0) {
      resStep = await resIterator.next()
      continue
    }

    const matchedRef = plvRef
    const { rows: plvRows, next: nextPlv } = await collectGroup(
      plvIterator,
      plvStep.value,
      matchedRef
    )
    const { rows: resRows, next: nextRes } = await collectGroup(
      resIterator,
      resStep.value,
      matchedRef
    )

    for (const plvRow of plvRows) {
      for (const resRow of resRows) {
        const merged = {}
        for (const col of columns) {
          merged[col] =
            (col in plvRow ? plvRow[col] : '') || (col in resRow ? resRow[col] : '') || ''
        }

        if (!stringifier.write(merged)) {
          await new Promise((resolve) => stringifier.once('drain', resolve))
        }
        totalMerged++
      }
    }

    plvStep = nextPlv
    resStep = nextRes
  }

  stringifier.end()
  await new Promise((resolve, reject) => {
    outputStream.on('finish', resolve)
    outputStream.on('error', reject)
    stringifier.on('error', reject)
  })

  console.log(`    ✓ ${totalMerged} lignes fusionnées`)
}

// Transformations
// Renomme les colonnes vers le schéma métier final puis complète les champs
// attendus. Cette étape isole le contrat de sortie du vocabulaire des sources.
function createRenameTransform() {
  const renamedColumns = new Set(Object.keys(COLUMN_RENAME_MAP))
  const internalOnlyColumns = new Set(['referenceprel'])

  return new Transform({
    objectMode: true,
    transform(row, _, cb) {
      const renamed = {}
      for (const [oldKey, newKey] of Object.entries(COLUMN_RENAME_MAP)) {
        if (oldKey in row) renamed[newKey] = row[oldKey]
      }
      for (const key of Object.keys(row)) {
        if (!renamedColumns.has(key) && !internalOnlyColumns.has(key)) renamed[key] = row[key]
      }

      // S'assurer que tous les champs Parquet existent
      for (const field of Object.keys(PARQUET_FIELD_TYPES)) {
        if (!(field in renamed)) renamed[field] = null
      }

      cb(null, renamed)
    },
  })
}

// Reconvertit certains champs après le renommage, car le parse CSV produit des
// chaînes et le schéma cible attend des types numériques cohérents.
function createCleaningTransform() {
  return new Transform({
    objectMode: true,
    transform(row, _, cb) {
      // code_insee conservé en string pour préserver les zéros initiaux
      if (row.code_parametre) row.code_parametre = toNumberValue(row.code_parametre)
      if (row.code_unite_sandre) row.code_unite_sandre = toNumberValue(row.code_unite_sandre)
      if (row.resultat_traduction) row.resultat_traduction = toNumberValue(row.resultat_traduction)
      cb(null, row)
    },
  })
}

// Injecte le libellé du paramètre à partir du référentiel `parametres`. On
// préfère une table mémoire dédiée pour garder la transformation en flux.
function createLibelleTransform(parametres) {
  const pMap = new Map()
  if (parametres && Array.isArray(parametres)) {
    for (const param of parametres) {
      pMap.set(String(param.code_parametre), param.libelle || '')
    }
  }
  return new Transform({
    objectMode: true,
    transform(row, _, cb) {
      row.libelle_parametre = pMap.get(String(row.code_parametre)) || ''
      cb(null, row)
    },
  })
}

// Déduit une fonction métier à partir du libellé du paramètre. Le matching par
// sous-chaîne est assumé ici parce que les intitulés sources ne sont pas assez
// normalisés pour une clé stricte.
function createFonctionTransform(substances) {
  const fMap = new Map()
  if (substances && Array.isArray(substances)) {
    for (const s of substances) {
      const substance = normalizeString(s.substance || s.Substance || '')
      const fonction = s['Fonction retenue'] || s.fonction || ''
      if (substance) fMap.set(substance, fonction)
    }
  }
  return new Transform({
    objectMode: true,
    transform(row, _, cb) {
      const libelle = normalizeString(row.libelle_parametre || '')
      for (const [substance, fonction] of fMap) {
        if (libelle.includes(substance)) {
          row.fonction = fonction
          break
        }
      }
      cb(null, row)
    },
  })
}

// Marque les prélèvements comme prioritaires en comparant les codes BSS de la
// ligne à un ensemble de référence. Le Set permet une recherche O(1) par code.
function createCaptagePrioritaireTransform(captages) {
  // Normalise les codes BSS pour comparer des écritures hétérogènes sans tenir
  // compte des espaces ou de la casse.
  const normalizeCodeBss = (value) =>
    String(value ?? '')
      .trim()
      .toUpperCase()
  // Découpe les listes de codes séparées par plusieurs conventions d'export.
  const extractCodesBss = (value) =>
    normalizeCodeBss(value)
      .split(/[|;,]/)
      .map((code) => code.trim())
      .filter(Boolean)

  const cSet = new Set()
  if (captages && Array.isArray(captages)) {
    for (const c of captages) {
      const codes = extractCodesBss(c.CodeBss || c.code_bss || '')
      for (const code of codes) cSet.add(code)
    }
  }
  return new Transform({
    objectMode: true,
    transform(row, _, cb) {
      // C'est bien le code_brgm qui est utilisé comme code BSS.
      // Problème dans le fichier original : On a uniquement la fin des codes BSS
      const codesLigne = extractCodesBss(row.code_brgm)
      row.captage_prioritaire = codesLigne.some((code) => cSet.has(code))
      cb(null, row)
    },
  })
}

// Calcule la limite de qualité normalisée à partir du libellé ou de la fonction
// afin de maximiser les chances d'obtenir une valeur exploitable.
function createLimiteQualiteTransform(limite) {
  return new Transform({
    objectMode: true,
    transform(row, _, cb) {
      row.limite_qualite = formatLimiteQualite(
        findReferenceValue(limite, row.libelle_parametre) ||
          findReferenceValue(limite, row.fonction) ||
          ''
      )
      cb(null, row)
    },
  })
}

// Même logique que pour la limite de qualité, mais appliquée à la référence de
// qualité, avec les mêmes règles de tolérance aux variantes de rédaction.
function createReferenceQualiteTransform(ref) {
  return new Transform({
    objectMode: true,
    transform(row, _, cb) {
      row.reference_qualite = formatReferenceQualite(
        findReferenceValue(ref, row.libelle_parametre) ||
          findReferenceValue(ref, row.fonction) ||
          ''
      )
      cb(null, row)
    },
  })
}

// Complète les coordonnées manquantes depuis `ref_cap`, en privilégiant la
// valeur déjà présente dans la ligne pour ne pas écraser une donnée plus fiable.
function createCoordonneesTransform(refCap) {
  const rMap = new Map()
  if (refCap && Array.isArray(refCap)) {
    for (const r of refCap) {
      const code = String(r.code_installation || '')
      rMap.set(code, {
        longitude: r.longitude || r.longitude_wgs84_dans_sise || '',
        latitude: r.latitude || r.latitude_wgs84_dans_sise || '',
      })
    }
  }
  return new Transform({
    objectMode: true,
    transform(row, _, cb) {
      const ref = rMap.get(String(row.code_installation || ''))
      if (ref) {
        if (!row.longitude || row.longitude === '') row.longitude = ref.longitude
        if (!row.latitude || row.latitude === '') row.latitude = ref.latitude
      }
      cb(null, row)
    },
  })
}

const PYTHON_PARQUET_SCRIPT = String.raw`
import csv
import sys
from datetime import date

import pyarrow as pa
import pyarrow.parquet as pq

# Le schéma est déclaré explicitement pour forcer des colonnes typées et
# nullables, ce qui évite les inférences fragiles au moment de l'écriture Parquet.
FIELD_TYPES = {
    "code_insee": pa.string(),
    "nom_commune": pa.string(),
    "code_installation": pa.string(),
    "nom_installation": pa.string(),
    "code_type_installation": pa.string(),
    "nom_type_installation": pa.string(),
    "date_prelevement": pa.date32(),
    "heure_prelevement": pa.string(),
    "conformite_bacterio": pa.string(),
    "conformite_chimique": pa.string(),
    "code_brgm": pa.string(),
    "code_bss": pa.string(),
    "longitude": pa.float64(),
    "latitude": pa.float64(),
    "code_parametre": pa.float64(),
    "resultat": pa.string(),
    "resultat_traduction": pa.float64(),
    "code_unite": pa.string(),
    "code_unite_sandre": pa.float64(),
    "libelle_parametre": pa.string(),
    "limite_qualite": pa.string(),
    "reference_qualite": pa.string(),
    "captage_prioritaire": pa.bool_(),
    "fonction": pa.string(),
}

# Les convertisseurs centralisent les règles de typage par colonne. Cette
# approche garde le traitement lisible et empêche de disperser la logique de
# conversion dans la boucle principale.
def is_empty(value):
    return value is None or str(value).strip() == ""

def safe_text(value):
    return None if is_empty(value) else str(value)

def safe_int(value):
    if is_empty(value):
        return None
    try:
        cleaned = str(value).strip().replace(" ", "").replace(",", ".")
        return int(float(cleaned))
    except (TypeError, ValueError):
        return None

def safe_float(value):
    if is_empty(value):
        return None
    try:
        cleaned = str(value).strip().replace(" ", "").replace(",", ".")
        return float(cleaned)
    except (TypeError, ValueError):
        return None

def safe_date(value):
    if is_empty(value):
        return None
    try:
        return date.fromisoformat(str(value).strip())
    except (TypeError, ValueError):
        return None

def safe_bool(value):
    if is_empty(value):
        return None
    return str(value).strip().lower() in {"true", "1", "yes", "y", "oui", "o", "s"}

CONVERTERS = {
    "code_insee": safe_text,
    "nom_commune": safe_text,
    "code_installation": safe_text,
    "nom_installation": safe_text,
    "code_type_installation": safe_text,
    "nom_type_installation": safe_text,
    "date_prelevement": safe_date,
    "heure_prelevement": safe_text,
    "conformite_bacterio": safe_text,
    "conformite_chimique": safe_text,
    "code_brgm": safe_text,
    "code_bss": safe_text,
    "longitude": safe_float,
    "latitude": safe_float,
    "code_parametre": safe_float,
    "resultat": safe_text,
    "resultat_traduction": safe_float,
    "code_unite": safe_text,
    "code_unite_sandre": safe_float,
    "libelle_parametre": safe_text,
    "limite_qualite": safe_text,
    "reference_qualite": safe_text,
    "captage_prioritaire": safe_bool,
    "fonction": safe_text,
}

# Détecte le séparateur à partir de la première ligne pour supporter les CSV
# générés avec point-virgule ou virgule, sans dépendre d'une configuration externe.
def detect_delimiter(first_line):
    return ";" if first_line.count(";") > first_line.count(",") else ","

# Construit un schéma Arrow à partir des colonnes présentes dans le CSV. On
# garde la structure exacte du fichier source tout en imposant les types cibles.
def build_schema(columns):
    return pa.schema([
        pa.field(column, FIELD_TYPES.get(column, pa.string()), nullable=True)
        for column in columns
    ])

# Convertit une ligne CSV brute en dictionnaire typé, colonne par colonne, pour
# alimenter Arrow sans charger tout le fichier en mémoire d'un seul bloc.
def parse_row(raw_row, columns):
    row = {}
    for index, column in enumerate(columns):
        value = raw_row[index] if index < len(raw_row) else ""
        row[column] = CONVERTERS.get(column, lambda v: None if v is None or str(v).strip() == "" else str(v))(value)
    return row

# Écrit le CSV en Parquet par lots afin de garder une empreinte mémoire stable
# même sur de très gros fichiers, tout en préservant les types métier.
def convert_csv_to_parquet(input_file, output_file):
    with open(input_file, "r", encoding="utf-8-sig", newline="") as handle:
        first_line = handle.readline()
        if not first_line:
            raise RuntimeError(f"Aucune donnée trouvée dans {input_file}")

        delimiter = detect_delimiter(first_line)
        handle.seek(0)

        reader = csv.reader(handle, delimiter=delimiter)
        headers = next(reader, None)
        if headers is None:
            raise RuntimeError(f"Aucune donnée trouvée dans {input_file}")

        columns = [header.strip() for header in headers]
        if not columns:
            raise RuntimeError(f"Aucune colonne trouvée dans {input_file}")

        schema = build_schema(columns)
        writer = pq.ParquetWriter(
            output_file,
            schema,
            version="2.6",
            compression="snappy",
            data_page_version="1.0",
        )

        rows = 0
        batch = []
        batch_size = 100000
        row_group_size = 1048576
        try:
            for raw_row in reader:
                if not raw_row or all(str(cell).strip() == "" for cell in raw_row):
                    continue

                batch.append(parse_row(raw_row, columns))
                rows += 1
                if len(batch) >= batch_size:
                    table = pa.Table.from_pylist(batch, schema=schema)
                    writer.write_table(table, row_group_size=row_group_size)
                    batch.clear()

            if rows == 0:
                raise RuntimeError(f"Aucune donnée trouvée dans {input_file}")

            if batch:
                table = pa.Table.from_pylist(batch, schema=schema)
                writer.write_table(table, row_group_size=row_group_size)
        finally:
            writer.close()

    print(f"    ✓ {rows} lignes écrites en Parquet")

if __name__ == "__main__":
    if len(sys.argv) != 3:
        raise SystemExit("Usage: python -c <script> <input.csv> <output.parquet>")
    convert_csv_to_parquet(sys.argv[1], sys.argv[2])
`

// CSV vers Parquet
// Délègue la conversion au script Python embarqué, car PyArrow gère mieux
// l'écriture Parquet typée et efficace que ce que ferait ce script Node seul.
async function csvToParquet(csvFile, parquetFile) {
  const python = process.env.PYTHON || 'python3'
  return new Promise((resolve, reject) => {
    const child = spawn(python, ['-c', PYTHON_PARQUET_SCRIPT, csvFile, parquetFile], {
      stdio: 'inherit',
    })

    child.on('error', (err) => {
      reject(new Error(`Impossible d'exécuter ${python} : ${err.message}`))
    })

    child.on('close', (code) => {
      if (code !== 0) {
        reject(new Error(`PyArrow a échoué avec le code ${code}`))
      } else {
        resolve()
      }
    })
  })
}

// Main
// Enchaîne les phases métier: découverte, préparation, fusion, enrichissement
// puis export Parquet, avec nettoyage garanti des fichiers temporaires.
async function processFiles(plvFiles, resFiles, referentiels, outputFile, generatedCsvPaths = []) {
  const sortedPeriods = Array.from(plvFiles.keys()).sort()

  for (const period of sortedPeriods) {
    if (!resFiles.has(period)) {
      const missingPlvFile = path.basename(plvFiles.get(period))
      throw new Error(`❌ Fichier RES manquant pour ${missingPlvFile} (période ${period})`)
    }
  }

  console.log(`\n📊 Traitement de ${sortedPeriods.length} paires PLV/RES → ${outputFile}\n`)

  const tempDir = '.orchestrator_temp'
  if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir)

  const filteredFiles = []

  try {
    console.log('📝 Étape 1 : Filtrage et tri')
    for (let i = 0; i < sortedPeriods.length; i++) {
      const period = sortedPeriods[i]
      const plvFile = plvFiles.get(period)
      const resFile = resFiles.get(period)
      const plvFiltered = path.join(tempDir, `plv_${i}_filtered_sorted.csv`)
      const resFiltered = path.join(tempDir, `res_${i}_filtered_sorted.csv`)

      await filterAndSort(plvFile, COLUMNS_TO_KEEP_PLV, plvFiltered)
      await filterAndSort(resFile, COLUMNS_TO_KEEP_RES, resFiltered)

      filteredFiles.push({ plvFiltered, resFiltered, merged: null })
    }

    console.log('\n🔗 Étape 2 : Fusion ordonnée')
    for (let i = 0; i < filteredFiles.length; i++) {
      const merged = path.join(tempDir, `merged_${i}.csv`)
      await mergeJoin(filteredFiles[i].plvFiltered, filteredFiles[i].resFiltered, merged)
      filteredFiles[i].merged = merged
    }

    console.log('\n✨ Étape 3 : Transformations')
    const allTransformed = path.join(tempDir, 'all_transformed.csv')

    for (let i = 0; i < filteredFiles.length; i++) {
      const { merged } = filteredFiles[i]
      const isFirstFile = i === 0
      const ws = fs.createWriteStream(allTransformed, {
        flags: isFirstFile ? 'w' : 'a',
      })

      try {
        await pipeline(
          fs.createReadStream(merged),
          parse(getParseOptions()),
          createRenameTransform(),
          createCleaningTransform(),
          createLibelleTransform(referentiels.parametres),
          createFonctionTransform(referentiels.substancesParFonction),
          createCaptagePrioritaireTransform(referentiels.captagesPrioritaires),
          createLimiteQualiteTransform(referentiels.limiteQualite),
          createReferenceQualiteTransform(referentiels.referenceQualite),
          createCoordonneesTransform(referentiels.refCapLoaded),
          stringify({ header: isFirstFile, quoted: true }),
          ws
        )
        console.log(`  ✓ Fichier ${i + 1} transformé`)
      } catch (err) {
        console.error(`  ✗ Erreur transformation ${i + 1}:`, err)
        throw err
      }
    }

    console.log(`  ✓ Fichier transformé créé`)
    if (fs.existsSync(allTransformed)) {
      const stats = fs.statSync(allTransformed)
      console.log(`  Taille : ${(stats.size / 1024 / 1024).toFixed(2)} MB`)
    }

    console.log('\n📦 Étape 4 : Conversion en Parquet')
    try {
      await csvToParquet(allTransformed, outputFile)
    } catch (err) {
      console.error('  ✗ Erreur Parquet:', err.message || err)
      throw err
    }

    console.log(`\n✅ Succès ! Fichier Parquet généré : ${outputFile}`)
  } finally {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true })
      console.log(`  Fichiers temporaires supprimés`)
    }
    for (const csvPath of generatedCsvPaths) {
      if (fs.existsSync(csvPath)) {
        fs.rmSync(csvPath)
        console.log(`  CSV généré supprimé : ${path.basename(csvPath)}`)
      }
    }
  }
}

// Point d'entrée CLI : valide les arguments, lance le pipeline et centralise la
// gestion d'erreur pour produire des messages cohérents en cas d'échec.
async function main() {
  try {
    const args = process.argv.slice(2)
    if (args.length === 0) {
      console.error('Usage: node orchestrator.mjs <input_directory> [output.parquet]')
      process.exit(1)
    }

    const inputDir = args[0]
    const outputFile = args[1] || 'output.parquet'

    console.log(`
╔══════════════════════════════════════════╗
║   ORCHESTRATOR - Qualité Eau             ║
║   Traitement optimisé pour gros fichiers ║
╚══════════════════════════════════════════╝
    `)

    const { plvFiles, resFiles, generatedCsvPaths, ...referentiels } = await discoverFiles(inputDir)

    console.log(`📂 Découverte :`)
    console.log(`  • ${plvFiles.size} fichiers PLV`)
    console.log(`  • ${resFiles.size} fichiers RES`)

    await processFiles(plvFiles, resFiles, referentiels, outputFile, generatedCsvPaths)
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('\n❌ Erreur :', message)
    if (err instanceof Error && err.stack) {
      console.error(err.stack)
    }
    process.exit(1)
  }
}

main()
