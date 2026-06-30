#!/usr/bin/env node
/**
 * Pipeline complet AAC :
 *   1. Télécharge les fichiers source depuis S3 vers data/
 *   2. Génère les fiches AAC (5 phases DuckDB + assemblage JS)
 *   3. Pousse le fichier aac.parquet résultant sur S3
 *
 * Usage : node --env-file=.env pipeline.js
 *
 * Variables d'environnement :
 *   S3_BUCKET        Bucket source (fichiers input) — requis
 *   S3_ACCESS_KEY    Clé d'accès S3 — requis
 *   S3_SECRET_KEY    Clé secrète S3 — requis
 *   S3_REGION        Région S3 (défaut : fr-par)
 *   S3_ENDPOINT      Endpoint S3 (défaut : s3.fr-par.scw.cloud)
 *   S3_PREFIX        Préfixe des fichiers source dans le bucket (défaut : vide)
 *   S3_BIO_DIR       Répertoire S3 des fichiers RPG bio annuels (défaut : bio)
 *   S3_RPG_DIR       Répertoire S3 des fichiers RPG annuels (défaut : RPG)
 *   S3_OUTPUT_BUCKET Bucket de destination (défaut : S3_BUCKET)
 *   S3_OUTPUT_KEY    Clé de destination du fichier (défaut : aac.parquet)
 */

import { DuckDBInstance } from '@duckdb/node-api'
import { existsSync, mkdirSync, createWriteStream, unlinkSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DATA = join(__dirname, 'data')
mkdirSync(DATA, { recursive: true })

// ─── Config S3 ────────────────────────────────────────────────────────────────

const S3_BUCKET = process.env.S3_BUCKET
const S3_ACCESS = process.env.S3_ACCESS_KEY
const S3_SECRET = process.env.S3_SECRET_KEY
const S3_REGION = process.env.S3_REGION || 'fr-par'
const S3_ENDPOINT = process.env.S3_ENDPOINT || 's3.fr-par.scw.cloud'
const S3_PREFIX = process.env.S3_PREFIX || ''
const S3_BIO_DIR = process.env.S3_BIO_DIR || 'bio'
const S3_RPG_DIR = process.env.S3_RPG_DIR || 'RPG'
const S3_OUTPUT_BUCKET = process.env.S3_OUTPUT_BUCKET || S3_BUCKET
const S3_OUTPUT_KEY = process.env.S3_OUTPUT_KEY || 'aac.parquet'

if (!S3_BUCKET || !S3_ACCESS || !S3_SECRET) {
  console.error('Variables manquantes : S3_BUCKET, S3_ACCESS_KEY, S3_SECRET_KEY')
  process.exit(1)
}

const s3src = (name) => `s3://${S3_BUCKET}/${S3_PREFIX ? `${S3_PREFIX}/${name}` : name}`
const s3dest = `s3://${S3_OUTPUT_BUCKET}/${S3_OUTPUT_KEY}`

// ─── DuckDB ───────────────────────────────────────────────────────────────────

const instance = await DuckDBInstance.create(':memory:', {
  temp_directory: join(DATA, '.tmp'),
  preserve_insertion_order: 'false',
  threads: '4',
})
const conn = await instance.connect()
const q = (sql) => conn.runAndReadAll(sql).then((r) => r.getRowObjects())

for (const stmt of [
  'INSTALL httpfs',
  'LOAD httpfs',
  `SET s3_endpoint='${S3_ENDPOINT}'`,
  `SET s3_region='${S3_REGION}'`,
  `SET s3_access_key_id='${S3_ACCESS}'`,
  `SET s3_secret_access_key='${S3_SECRET}'`,
  "SET s3_url_style='vhost'",
  'INSTALL spatial',
  'LOAD spatial',
])
  await conn.run(stmt)

// ─── Helpers chemins locaux ───────────────────────────────────────────────────

const localPath = (name) => join(DATA, name)

const readTable = (name) => `read_parquet('${localPath(name)}')`

// ─── Étape 1 : téléchargement des fichiers source ────────────────────────────

console.log('═══ Étape 1 : téléchargement des fichiers source ═══\n')

const SOURCE_FILES = [
  'aac_hilbert.parquet',
  'aac_pp_zones.parquet',
  'communes_hilbert.parquet',
  'captages.parquet',
  'rpg_parcelles.parquet',
]

const BIO_YEARS = [2019, 2020, 2021, 2022, 2023, 2024]
const CULTURES_EVOLUTION_YEARS = [2020, 2021, 2022, 2023, 2024]

for (const name of SOURCE_FILES) {
  const dest = localPath(name)

  if (existsSync(dest)) {
    console.log(`  ✓ ${name} (déjà présent)`)
    continue
  }

  process.stdout.write(`  ↓ ${name}...`)
  const t = Date.now()

  await conn.run(
    `COPY (SELECT * FROM read_parquet('${s3src(name)}'))
     TO '${dest}' WITH (FORMAT PARQUET, CODEC 'ZSTD', ROW_GROUP_SIZE 5000)`
  )
  console.log(` ${((Date.now() - t) / 1000).toFixed(1)}s`)
}

for (const year of BIO_YEARS) {
  const name = `rpg_bio_${year}.parquet`
  const dest = localPath(name)

  if (existsSync(dest)) {
    console.log(`  ✓ ${name} (déjà présent)`)
    continue
  }

  process.stdout.write(`  ↓ ${name}...`)
  const t = Date.now()

  await conn.run(
    `COPY (SELECT * FROM read_parquet('s3://${S3_BUCKET}/${S3_BIO_DIR}/${name}'))
     TO '${dest}' WITH (FORMAT PARQUET, CODEC 'ZSTD', ROW_GROUP_SIZE 5000)`
  )
  console.log(` ${((Date.now() - t) / 1000).toFixed(1)}s`)
}

{
  const name = 'captages_prioritaires_2026.csv'
  const dest = localPath(name)
  if (existsSync(dest)) {
    console.log(`  ✓ ${name} (déjà présent)`)
  } else {
    process.stdout.write(`  ↓ ${name}...`)
    const t = Date.now()
    await conn.run(
      `COPY (SELECT * FROM read_csv('${s3src(name)}', header=true))
       TO '${dest}' (FORMAT CSV, HEADER true)`
    )
    console.log(` ${((Date.now() - t) / 1000).toFixed(1)}s`)
  }
}

// ─── Constantes RPG ───────────────────────────────────────────────────────────

const GROUPES_CULTURES_EVOLUTION = {
  1: 'Blé tendre',
  2: 'Maïs grain et ensilage',
  3: 'Orge',
  4: 'Autres céréales',
  5: 'Colza',
  6: 'Tournesol',
  7: 'Autres oléagineux',
  8: 'Protéagineux',
  9: 'Plantes à fibres',
  11: 'Gel (surfaces gelées sans production)',
  14: 'Riz',
  15: 'Légumineuses à grains',
  16: 'Fourrage',
  17: 'Estives et landes',
  18: 'Prairies permanentes',
  19: 'Prairies temporaires',
  20: 'Vergers',
  21: 'Vignes',
  22: 'Fruits à coque',
  23: 'Oliviers',
  24: 'Autres cultures industrielles',
  25: 'Autres cultures industrielles',
  26: 'Canne à sucre',
  28: 'Divers',
}

function buildInstallations(captages, bssPrioritaires) {
  const groups = new Map()
  for (const r of captages) {
    const ref = r.t1_ins_cap_ref || r.t1_code_ins
    const refLib = r.t1_ins_cap_ref_lib || r.t1_ins_nom
    if (!groups.has(ref)) groups.set(ref, { nom_ref: refLib, membres: new Map() })
    groups.get(ref).membres.set(r.t1_code_ins, r)
  }

  return [...groups.entries()]
    .map(([codeRef, { membres }]) => {
      const ref = membres.get(codeRef) ?? [...membres.values()][0]
      const entry = {
        code: codeRef,
        nom: ref.t1_ins_nom,
        ...(ref.t1_ins_code_bss ? { code_bss: ref.t1_ins_code_bss } : {}),
        commune: ref.t1_com_nom,
        departement: ref.t1_dep_geo_lib,
        type: ref.t1_cap_type_lib,
        nature: ref.t1_ins_nat_code,
        usage: ref.t1_ins_usage_lib,
        etat: ref.t1_ins_etat_lib,
        ...(ref.t2_code_ppe ? { code_ppe: ref.t2_code_ppe } : {}),
        ...(ref.t2_code_ppr ? { code_ppr: ref.t2_code_ppr } : {}),
        ...(ref.t2_code_ppi ? { code_ppi: ref.t2_code_ppi } : {}),
      }

      const allBss = [...membres.values()].map((m) => m.t1_ins_code_bss).filter(Boolean)
      if (allBss.some((bss) => bssPrioritaires.has(bss))) entry.prioritaire = true

      const rattaches = [...membres.values()]
        .filter((m) => m.t1_code_ins !== codeRef)
        .map((m) => ({
          code: m.t1_code_ins,
          nom: m.t1_ins_nom,
          ...(m.t1_ins_code_bss ? { code_bss: m.t1_ins_code_bss } : {}),
          etat: m.t1_ins_etat_lib,
        }))

      if (rattaches.length > 0) entry.captages_rattaches = rattaches
      return entry
    })
    .sort((a, b) => a.nom.localeCompare(b.nom))
}

function buildSauResult(rows, surfKey, nbKey, totalM2) {
  const result = {}
  for (const r of [...rows].sort((a, b) => (b[surfKey] || 0) - (a[surfKey] || 0))) {
    if (!r[nbKey] || !r[surfKey]) continue
    result[GROUPES_CULTURES_EVOLUTION[r.code_group] || `Groupe ${r.code_group}`] = {
      nb_parcelles: r[nbKey],
      surface: Math.round(r[surfKey] / 100) / 100,
      SAU: Math.round((r[surfKey] / totalM2) * 1000) / 10,
    }
  }

  return result
}

function buildCulturesEvolutionOutput(cdaac, nom, repartition) {
  return {
    aac: String(cdaac),
    nom,
    repartition,
  }
}

// ─── Étape 2 : génération des fiches AAC ─────────────────────────────────────

console.log('\n═══ Étape 2 : génération des fiches AAC ═══\n')

// Phase 1 : données légères

console.log('Phase 1 — chargement des données légères...')
let t = Date.now()

const aacRows = await q(`
  SELECT cdaac, nom, datemajaac, datecreati,
         ST_AsGeoJSON(geom)                                                AS geom_wgs,
         ST_AsGeoJSON(ST_Transform(geom, 'EPSG:4326', 'EPSG:2154', true)) AS geom_l93,
         ST_Area(ST_Transform(geom, 'EPSG:4326', 'EPSG:2154', true))      AS area_m2,
         ST_XMin(geom) AS bbox_west,
         ST_YMin(geom) AS bbox_south,
         ST_XMax(geom) AS bbox_east,
         ST_YMax(geom) AS bbox_north
  FROM read_parquet('${localPath('aac_hilbert.parquet')}')`)

const aacMap = new Map(aacRows.map((r) => [r.cdaac, r]))
console.log(`  ${aacRows.length} AAC chargées (${Date.now() - t}ms)`)

t = Date.now()
const ppRows = await q(`SELECT * FROM read_parquet('${localPath('aac_pp_zones.parquet')}')`)
const ppMap = new Map(ppRows.map((r) => [r.cdaac, r]))
console.log(`  PP zones chargées (${Date.now() - t}ms)`)

t = Date.now()
const communesRows = await q(`
  SELECT a.cdaac, c.nom, c.code,
         ST_Area(ST_Transform(
           ST_MakeValid(ST_Intersection(ST_MakeValid(c.geom), ST_MakeValid(a.geom))),
           'EPSG:4326', 'EPSG:2154', true
         )) AS surf_m2
  FROM read_parquet('${localPath('aac_hilbert.parquet')}') a
  JOIN read_parquet('${localPath('communes_hilbert.parquet')}') c ON ST_Intersects(a.geom, c.geom)
  ORDER BY a.cdaac, surf_m2 DESC`)

const communesMap = new Map()
for (const r of communesRows) {
  if (!communesMap.has(r.cdaac)) communesMap.set(r.cdaac, [])
  communesMap.get(r.cdaac).push(r)
}
console.log(`  Communes chargées — ${communesRows.length} lignes (${Date.now() - t}ms)`)

t = Date.now()
const captagesRows = await q(`
  SELECT pp.cdaac,
         cap.t1_code_ins, cap.t1_ins_nom, cap.t1_com_nom, cap.t1_com_insee,
         cap.t1_ins_etat_lib, cap.t1_uge_mo_nom,
         cap.t1_dep_geo_lib, cap.t1_cap_type_lib, cap.t1_ins_nat_code,
         cap.t1_ins_usage_lib, cap.t1_ins_etat,
         cap.t1_ins_cap_ref, cap.t1_ins_cap_ref_lib,
         cap.t1_ins_code_bss,
         COALESCE(cap.t2_code_ppe, '') AS t2_code_ppe,
         COALESCE(cap.t2_code_ppr, '') AS t2_code_ppr,
         COALESCE(cap.t2_code_ppi, '') AS t2_code_ppi
  FROM read_parquet('${localPath('aac_pp_zones.parquet')}') pp
  JOIN (
    SELECT *, ROW_NUMBER() OVER (PARTITION BY t1_code_ins) AS rn
    FROM read_parquet('${localPath('captages.parquet')}')
  ) cap ON rn = 1 AND (
    (pp.ppe_codes IS NOT NULL AND list_contains(pp.ppe_codes, cap.t2_code_ppe)) OR
    (pp.ppr_codes IS NOT NULL AND list_contains(pp.ppr_codes, cap.t2_code_ppr)) OR
    (pp.ppi_codes IS NOT NULL AND list_contains(pp.ppi_codes, cap.t2_code_ppi))
  )`)

const captagesMap = new Map()
for (const r of captagesRows) {
  if (!captagesMap.has(r.cdaac)) captagesMap.set(r.cdaac, [])
  captagesMap.get(r.cdaac).push(r)
}
console.log(`  Captages chargés — ${captagesRows.length} lignes (${Date.now() - t}ms)`)

t = Date.now()
const bssRows = await q(
  `SELECT CodeBss FROM read_csv('${localPath('captages_prioritaires_2026.csv')}', header=true) WHERE CodeBss IS NOT NULL`
)
const bssPrioritaires = new Set(
  bssRows.flatMap((r) =>
    r.CodeBss.split('|')
      .map((s) => s.trim())
      .filter(Boolean)
  )
)
console.log(`  ${bssPrioritaires.size} BSS prioritaires chargés (${Date.now() - t}ms)`)

// Phase 2 : RPG bio

console.log('\nPhase 2 — RPG bio (scan par année)...')
t = Date.now()

const bioByYearMap = new Map() // cdaac -> [{year, nb, surf_m2}, ...]

for (const year of BIO_YEARS) {
  const fileName = `rpg_bio_${year}.parquet`
  process.stdout.write(`  ${year}...`)
  const t2 = Date.now()

  const rows = await q(`
    SELECT a.cdaac,
           CAST(COUNT(*) AS INTEGER)                                           AS nb,
           CAST(SUM(ST_Area(ST_Intersection(ST_MakeValid(r.geom_l93),
                 ST_MakeValid(a.geom_l93)))) AS DOUBLE)                        AS surf_m2
    FROM (
      SELECT ST_Transform(geometry, 'EPSG:4326', 'EPSG:2154', true) AS geom_l93
      FROM ${readTable(fileName)}
    ) r
    JOIN (
      SELECT cdaac,
             ST_Transform(geom, 'EPSG:4326', 'EPSG:2154', true) AS geom_l93
      FROM read_parquet('${localPath('aac_hilbert.parquet')}')
    ) a ON ST_Intersects(r.geom_l93, a.geom_l93)
    GROUP BY a.cdaac`)

  for (const r of rows) {
    if (!bioByYearMap.has(r.cdaac)) bioByYearMap.set(r.cdaac, [])
    bioByYearMap.get(r.cdaac).push({ year, nb: r.nb, surf_m2: r.surf_m2 })
  }
  console.log(` ${rows.length} AAC (${Date.now() - t2}ms)`)
}

console.log(`  Bio chargé — ${bioByYearMap.size} AAC avec parcelles bio (${Date.now() - t}ms)`)

// Phase 3 : RPG parcelles

console.log('\nPhase 3 — RPG parcelles (scan unique, peut prendre plusieurs minutes)...')
t = Date.now()

const rpgRows = await q(`
  SELECT cdaac, code_group,
         CAST(COUNT(*) AS INTEGER)                                                    AS nb_aac,
         CAST(SUM(area_aac) AS DOUBLE)                                                AS surf_aac,
         CAST(COUNT(*) FILTER (WHERE area_ppe > 0) AS INTEGER)                        AS nb_ppe,
         CAST(SUM(area_ppe) AS DOUBLE)                                                AS surf_ppe,
         CAST(COUNT(*) FILTER (WHERE area_ppr > 0) AS INTEGER)                        AS nb_ppr,
         CAST(SUM(area_ppr) AS DOUBLE)                                                AS surf_ppr
  FROM (
    SELECT t.code_group, a.cdaac,
           ST_Area(ST_Intersection(ST_MakeValid(t.geom), ST_MakeValid(a.geom_l93))) AS area_aac,
           CASE WHEN pp.ppe_zone_l93 IS NOT NULL
                THEN ST_Area(ST_Intersection(ST_MakeValid(t.geom),
                       ST_GeomFromGeoJSON(pp.ppe_zone_l93)))
                ELSE 0.0 END AS area_ppe,
           CASE WHEN pp.ppr_zone_l93 IS NOT NULL
                THEN ST_Area(ST_Intersection(ST_MakeValid(t.geom),
                       ST_GeomFromGeoJSON(pp.ppr_zone_l93)))
                ELSE 0.0 END AS area_ppr
    FROM ${readTable('rpg_parcelles.parquet')} t
    JOIN (
      SELECT cdaac,
             ST_Transform(geom, 'EPSG:4326', 'EPSG:2154', true) AS geom_l93
      FROM read_parquet('${localPath('aac_hilbert.parquet')}')
    ) a ON ST_Intersects(t.geom, a.geom_l93)
    LEFT JOIN read_parquet('${localPath('aac_pp_zones.parquet')}') pp ON a.cdaac = pp.cdaac
  ) inner_t
  GROUP BY cdaac, code_group`)

const rpgMap = new Map()
for (const r of rpgRows) {
  if (!rpgMap.has(r.cdaac)) rpgMap.set(r.cdaac, [])
  rpgMap.get(r.cdaac).push(r)
}
console.log(`  RPG chargé — ${rpgRows.length} lignes pour ${rpgMap.size} AAC (${Date.now() - t}ms)`)

// Phase 4 : RPG évolution annuelle depuis S3

console.log('\nPhase 4 — RPG évolution annuelle (S3 RPG/RPG_YYYY.parquet)...')
t = Date.now()

const culturesEvolutionMap = new Map()

for (const year of CULTURES_EVOLUTION_YEARS) {
  process.stdout.write(`  ${year}...`)
  const t2 = Date.now()
  const rpgYearPath = `s3://${S3_BUCKET}/${S3_RPG_DIR}/RPG_${year}.parquet`

  const rows = await q(`
    SELECT a.cdaac, t.code_group,
           CAST(COUNT(*) AS INTEGER)                                              AS nb_parcelles,
           CAST(SUM(ST_Area(ST_Intersection(ST_MakeValid(t.geom),
                 ST_MakeValid(a.geom_l93)))) AS DOUBLE) / 10000.0                 AS surface_ha
    FROM read_parquet('${rpgYearPath}') t
    JOIN (
      SELECT cdaac,
             ST_Transform(geom, 'EPSG:4326', 'EPSG:2154', true) AS geom_l93
      FROM read_parquet('${localPath('aac_hilbert.parquet')}')
    ) a ON ST_Intersects(t.geom, a.geom_l93)
    GROUP BY a.cdaac, t.code_group
  `)

  const byCdaac = new Map()
  for (const r of rows) {
    if (!r.nb_parcelles || !r.surface_ha) continue
    if (!byCdaac.has(r.cdaac)) byCdaac.set(r.cdaac, [])
    byCdaac.get(r.cdaac).push(r)
  }

  for (const [cdaac, yearRows] of byCdaac) {
    const cultures = Object.fromEntries(
      yearRows
        .sort((a, b) => (b.surface_ha || 0) - (a.surface_ha || 0))
        .map((r) => [
          isNaN(r.code_group)
            ? r.code_group
            : GROUPES_CULTURES_EVOLUTION[r.code_group] || `Groupe ${r.code_group}`,
          {
            surface_ha: Math.round(r.surface_ha * 10) / 10,
            nb_parcelles: r.nb_parcelles,
          },
        ])
    )

    if (!culturesEvolutionMap.has(cdaac)) culturesEvolutionMap.set(cdaac, {})
    culturesEvolutionMap.get(cdaac)[year] = cultures
  }
  console.log(` ${rows.length} groupes AAC (${Date.now() - t2}ms)`)
}

console.log(`  Évolution cultures chargée — ${culturesEvolutionMap.size} AAC (${Date.now() - t}ms)`)

// Phase 5 : assemblage

console.log('\nPhase 5 — assemblage des fiches...')
t = Date.now()
let nbFiches = 0

const tmpNdjson = join(DATA, '_tmp_aac.ndjson')
const ndjsonStream = createWriteStream(tmpNdjson)

for (const [cdaac, aac] of aacMap) {
  const pp = ppMap.get(cdaac) ?? {}
  const communes = communesMap.get(cdaac) ?? []
  const captages = captagesMap.get(cdaac) ?? []
  const bioYears = bioByYearMap.get(cdaac) ?? []
  const bio = bioYears.at(-1)
  const rpg = rpgMap.get(cdaac) ?? []
  const culturesEvolution = culturesEvolutionMap.get(cdaac) ?? {}

  const ppeGeom = pp.ppe_zone_l93 ?? null
  const pprGeom = pp.ppr_zone_l93 ?? null

  const totalSauM2 = rpg.reduce((s, r) => s + (r.surf_aac || 0), 0)
  const totalPpeM2 = rpg.reduce((s, r) => s + (r.surf_ppe || 0), 0)
  const totalPprM2 = rpg.reduce((s, r) => s + (r.surf_ppr || 0), 0)
  const nbParcelles = rpg.reduce((s, r) => s + (r.nb_aac || 0), 0)
  const nbBio = bio?.nb ?? 0
  const totalBioM2 = bio?.surf_m2 ?? 0
  const nbCaptagesActifs = captages.filter(
    (c) => c.t1_ins_etat_lib?.toUpperCase() === 'ACTIF'
  ).length

  const installations = buildInstallations(captages, bssPrioritaires)
  const estPrioritaire = installations.some((i) => i.prioritaire === true)

  ndjsonStream.write(
    JSON.stringify({
      nom: aac.nom,
      code: String(cdaac),
      prioritaire: estPrioritaire,
      date_creation: aac.datecreati ? new Date(aac.datecreati).toISOString().slice(0, 10) : null,
      date_maj: aac.datemajaac ? new Date(aac.datemajaac).toISOString().slice(0, 10) : null,
      bbox: [aac.bbox_west, aac.bbox_south, aac.bbox_east, aac.bbox_north],
      surface: Math.round(aac.area_m2 / 100) / 100,
      nb_captages_actifs: nbCaptagesActifs,
      nb_installations: installations.length,
      surface_agricole: Math.round(totalSauM2 / 100) / 100,
      nb_parcelles: nbParcelles,
      communes: {
        nb_communes: communes.length,
        communes: Object.fromEntries(
          communes.map((c) => [
            c.nom,
            {
              code_insee: c.code,
              surface: Math.round((c.surf_m2 / 10_000) * 100) / 100,
              repartition: Math.round((c.surf_m2 / aac.area_m2) * 1000) / 10,
            },
          ])
        ),
      },
      surface_agricole_utile: buildSauResult(rpg, 'surf_aac', 'nb_aac', totalSauM2),
      surface_agricole_ppe: ppeGeom ? buildSauResult(rpg, 'surf_ppe', 'nb_ppe', totalPpeM2) : null,
      surface_agricole_ppr: pprGeom ? buildSauResult(rpg, 'surf_ppr', 'nb_ppr', totalPprM2) : null,
      surface_agricole_bio: {
        nb_parcelles: nbBio,
        surface: Math.round(totalBioM2 / 100) / 100,
        part_bio: totalSauM2 > 0 ? Math.round((totalBioM2 / totalSauM2) * 1000) / 10 : 0,
        evolution: bioYears.map(({ year, nb, surf_m2 }) => ({
          annee: year,
          nb_parcelles: nb,
          surface: Math.round(surf_m2 / 100) / 100,
        })),
      },
      cultures_evolution: buildCulturesEvolutionOutput(cdaac, aac.nom, culturesEvolution),
      installations,
    }) + '\n'
  )
  nbFiches++
}

await new Promise((resolve, reject) => {
  ndjsonStream.end()
  ndjsonStream.on('finish', resolve)
  ndjsonStream.on('error', reject)
})

console.log(`  ${nbFiches} fiches assemblées en ${Date.now() - t}ms`)

// ─── Étape 3 : écriture Parquet et push S3 ───────────────────────────────────

console.log('\n═══ Étape 3 : push vers S3 ═══\n')
t = Date.now()

process.stdout.write(`  ↑ ${s3dest}...`)
await conn.run(`
  COPY (
    SELECT * FROM read_json_auto('${tmpNdjson}', maximum_object_size = 10485760)
  )
  TO '${s3dest}' (FORMAT PARQUET, CODEC 'ZSTD', ROW_GROUP_SIZE 500)
`)
unlinkSync(tmpNdjson)

console.log(` ${((Date.now() - t) / 1000).toFixed(1)}s`)
console.log(`\nTerminé → ${s3dest}`)
process.exit(0)
