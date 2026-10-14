import { inject } from '@adonisjs/core'
import type { Logger } from '@adonisjs/core/logger'
import { DuckdbService, getAacFilesS3Driver } from '#services/duckdb_service'
import { AacDto, type AacSummaryJson } from '../dto/aac_dto.js'
import type {
  AnalysesStats,
  AnalysesPerYear,
  SubstanceItem,
  ChroniqueData,
  CaptageAlerteJson,
} from '#types/captage'

function getParquetPath(): string {
  return `s3://${getAacFilesS3Driver().options.bucket}/aac.parquet`
}

function getAnalysesRobinetPath(): string {
  return `s3://${getAacFilesS3Driver().options.bucket}/analyses_robinet.parquet`
}

/**
 * Agrégats d'analyses_robinet.parquet par installation et par date de prélèvement : une ligne
 * par couple (`code_installation`, `date_prelevement`), avec `dep_regl` et `dep_alerte` vrais si
 * au moins une mesure de cette date dépasse le seuil (mêmes règles que SQL_DEP_REGL et
 * SQL_DEP_ALERTE, appliquées par le projet de génération). Une date en dépassement réglementaire
 * et d'alerte a les deux indicateurs à vrai.
 * Environ 250 000 lignes en un seul row group : les requêtes qui ne comptent que des dates le
 * lisent plutôt que les 50 millions de lignes d'analyses_robinet.parquet.
 */
function getAnalysesParDatePath(): string {
  return `s3://${getAacFilesS3Driver().options.bucket}/analyses_robinet_par_date.parquet`
}

/**
 * AAC ordering (DuckDB dialect): codes are stored as strings but are numeric, so they are
 * sorted as integers. AACs without a numeric code (rare) come last, sorted by name.
 * Kept consistent with the `orderByCode` scope of the Territoire model.
 */
const SQL_ORDER_BY_CODE = 'TRY_CAST(code AS INTEGER) ASC NULLS LAST, code ASC NULLS LAST, nom ASC'

// ---------------------------------------------------------------------------
// Reusable SQL threshold-detection fragments (DuckDB dialect).
// Centralised here to avoid divergence across queries.
// Les indicateurs d'analyses_robinet_par_date.parquet sont calculés par le projet de génération
// avec ces mêmes règles : les garder alignées.
// ---------------------------------------------------------------------------

/** Row exceeds the réglementaire threshold: limite_qualite encodes a ≤X value. */
const SQL_DEP_REGL =
  `TRY_CAST(replace(regexp_extract(limite_qualite, '<=([0-9][0-9,.]*)', 1), ',', '.') AS DOUBLE) IS NOT NULL` +
  ` AND resultat_traduction IS NOT NULL` +
  ` AND resultat_traduction > TRY_CAST(replace(regexp_extract(limite_qualite, '<=([0-9][0-9,.]*)', 1), ',', '.') AS DOUBLE)`

/** Row exceeds the alerte threshold via a simple ≤X pattern on reference_qualite. */
const SQL_DEP_ALERTE_LTEQ =
  `TRY_CAST(replace(regexp_extract(reference_qualite, '<=([0-9][0-9,.]*)', 1), ',', '.') AS DOUBLE) IS NOT NULL` +
  ` AND resultat_traduction IS NOT NULL` +
  ` AND resultat_traduction > TRY_CAST(replace(regexp_extract(reference_qualite, '<=([0-9][0-9,.]*)', 1), ',', '.') AS DOUBLE)`

/** Row falls outside the alerte range via a ≥X et ≤Y pattern on reference_qualite. */
const SQL_DEP_ALERTE_RANGE =
  `TRY_CAST(replace(regexp_extract(reference_qualite, '>=([0-9][0-9,.]*) et', 1), ',', '.') AS DOUBLE) IS NOT NULL` +
  ` AND resultat_traduction IS NOT NULL` +
  ` AND (resultat_traduction < TRY_CAST(replace(regexp_extract(reference_qualite, '>=([0-9][0-9,.]*) et', 1), ',', '.') AS DOUBLE)` +
  ` OR resultat_traduction > TRY_CAST(replace(regexp_extract(reference_qualite, 'et <=([0-9][0-9,.]*)', 1), ',', '.') AS DOUBLE))`

/** Row violates any alerte threshold (either pattern). */
const SQL_DEP_ALERTE = `(${SQL_DEP_ALERTE_LTEQ}) OR (${SQL_DEP_ALERTE_RANGE})`

/** Row violates any threshold (réglementaire or alerte). */
const SQL_DEP_ANY = `(${SQL_DEP_REGL}) OR (${SQL_DEP_ALERTE})`

/** CASE expression returning the most severe statut for each row. */
const SQL_STATUT_CASE =
  `CASE` +
  ` WHEN ${SQL_DEP_REGL} THEN 'dep_regl'` +
  ` WHEN ${SQL_DEP_ALERTE_LTEQ} THEN 'dep_alerte'` +
  ` WHEN ${SQL_DEP_ALERTE_RANGE} THEN 'dep_alerte'` +
  ` ELSE 'conforme' END`

/**
 * Filtres sur l'année de prélèvement, exprimés en intervalles de dates : contrairement à
 * date_part('year', …), ils permettent à DuckDB d'écarter les row groups grâce à leurs min/max.
 */
const SQL_YEAR_FROM = 'date_prelevement >= make_date($yearMin, 1, 1)'
const SQL_YEAR_TO = 'date_prelevement < make_date($yearMax + 1, 1, 1)'
const SQL_YEAR_RANGE = `${SQL_YEAR_FROM} AND ${SQL_YEAR_TO}`

/**
 * Pour analyses_robinet.parquet, au-delà de ce nombre d'installations, le filtre reste `= ANY($installationCodes)` : la liste
 * couvre alors presque tous les row groups, et comparer chaque ligne à des milliers de
 * paramètres ralentit la requête (dashboard sur toutes les AAC : 300 ms à chaud avec `= ANY`,
 * 440 ms avec `IN`). Mesures dans optimisation-data.md, étape 7.
 */
const INSTALLATION_CODES_IN_LIST_MAX = 1000

type CaptageSeedRow = {
  code: string
  name: string
  bssCode: string
  state: string
  commune: string | null
  type: string | null
  prioritaire: boolean
}

function normalizeString(value: unknown): string | null {
  if (typeof value !== 'string') return null

  const normalized = value.trim()
  return normalized.length > 0 ? normalized : null
}

function getCaptageStatePriority(state: string): number {
  return state.toUpperCase() === 'ACTIF' ? 0 : 1
}

/**
 * Le jeu de données AAC (DuckDB sur S3) est une source distante : si elle est indisponible ou
 * trop lente, les appelants dégradent la fonctionnalité concernée plutôt que d'échouer entièrement.
 */
export async function withAacFallback<T>(
  logger: Logger,
  label: string,
  query: () => Promise<T>,
  fallback: T
): Promise<T> {
  try {
    return await query()
  } catch (error) {
    logger.error({ err: error }, `Données AAC indisponibles (${label})`)
    return fallback
  }
}

/** Everything the home page needs about a user's territoires, see getOverviewForTerritoires. */
export type AacOverview = {
  summariesByCode: Record<string, AacSummaryJson>
  conformiteStatsByAacCode: Map<string, AnalysesStats>
  captagesAlertes: CaptageAlerteJson[]
  /** The first AAC codes (in input order) with at least one dépassement, and how many there are in total. */
  aacCodesARisque: { codes: string[]; total: number }
}

/** Nombre de dates de prélèvement d'une installation, voir getDateCountsByInstallation. */
type DateCounts = { total: number; reglementaires: number; alerte: number; alerteSeule: number }

function sumBy<T>(items: T[], value: (item: T) => number): number {
  return items.reduce((total, item) => total + value(item), 0)
}

/** How many territoires à risque the home page lists. */
export const TERRITOIRES_A_RISQUE_LIMIT = 10

function toCaptageAlerte(row: Record<string, unknown>): CaptageAlerteJson {
  return {
    code: String(row.code ?? ''),
    nom: String(row.nom ?? ''),
    commune: String(row.commune ?? ''),
    departement: String(row.departement ?? ''),
    aac_code: String(row.aac_code ?? ''),
    aac_nom: String(row.aac_nom ?? ''),
    depassements_alerte: Number(row.depassements_alerte ?? 0),
    depassements_reglementaires: Number(row.depassements_reglementaires ?? 0),
  }
}

// ---------------------------------------------------------------------------
// Global search index (see AacService.getGlobalSearchIndex)
// ---------------------------------------------------------------------------

const GLOBAL_SEARCH_INDEX_TTL_MS = 60 * 60 * 1000

type GlobalSearchAac = { code: string; nom: string }
type GlobalSearchInstallation = {
  code: string
  nom: string
  code_bss: string | null
  aac_code: string
}
type GlobalSearchIndexEntry<T> = {
  item: T
  // Code that ranks the entry first when the query is exactly equal to it
  code: string | null
  searchText: string
}
type GlobalSearchIndex = {
  aacs: GlobalSearchIndexEntry<GlobalSearchAac>[]
  installations: GlobalSearchIndexEntry<GlobalSearchInstallation>[]
}

function normalizeSearchText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

/**
 * Returns the entries (already sorted by name) containing the query, the one whose code
 * is exactly the query first, limited to `limit` items, along with the total number of matches.
 */
function searchInIndex<T>(
  entries: GlobalSearchIndexEntry<T>[],
  recherche: string,
  limit: number
): { data: T[]; total: number } {
  const needle = normalizeSearchText(recherche.trim())
  const matches = entries.filter((entry) => entry.searchText.includes(needle))
  const exactMatchIndex = matches.findIndex(
    (entry) => entry.code !== null && normalizeSearchText(entry.code) === needle
  )
  if (exactMatchIndex > 0) {
    matches.unshift(...matches.splice(exactMatchIndex, 1))
  }

  return { data: matches.slice(0, limit).map((entry) => entry.item), total: matches.length }
}

/**
 * Service for querying the AAC dataset stored as a Parquet file in S3 via DuckDB.
 * Provides methods to get paginated lists of AACs with optional search filters,
 * and to get details of a single AAC by code.
 * Uses parameterized queries to prevent SQL injection,
 * and normalizes DuckDB-specific value types to plain JS objects.
 */
@inject()
export class AacService {
  private static globalSearchIndex: {
    promise: Promise<GlobalSearchIndex>
    loadedAt: number
  } | null = null

  constructor(protected duckdbService: DuckdbService) {}

  async getAll(
    page: number,
    perPage: number,
    recherche?: string,
    commune?: string,
    aacCodes?: string[],
    depassementsReglementaires?: boolean,
    depassementsAlerte?: boolean
  ): Promise<{ data: Record<string, unknown>[]; total: number }> {
    const conditions: string[] = []
    const parameters: Record<string, string | number | ReturnType<DuckdbService['list']>> = {
      path: getParquetPath(),
      limit: perPage,
      offset: (page - 1) * perPage,
    }

    if (recherche) {
      conditions.push("(nom ILIKE '%' || $recherche || '%' OR code ILIKE '%' || $recherche || '%')")
      parameters.recherche = recherche
    }

    if (commune) {
      conditions.push(
        "array_to_string(map_keys(communes.communes), '|') ILIKE '%' || $commune || '%'"
      )
      parameters.commune = commune
    }

    if (aacCodes && aacCodes.length > 0) {
      conditions.push('code = ANY($aacCodes)')
      parameters.aacCodes = this.duckdbService.list(aacCodes)
    }

    // An AAC matches a dépassement filter when at least one of its installations has had
    // an analysis exceeding the corresponding threshold, across all recorded history.
    const [installationCodesWithReglementaire, installationCodesWithAlerte] = await Promise.all([
      depassementsReglementaires
        ? this.getInstallationCodesWithDepassement('reglementaire')
        : Promise.resolve(null),
      depassementsAlerte
        ? this.getInstallationCodesWithDepassement('alerte')
        : Promise.resolve(null),
    ])

    if (installationCodesWithReglementaire) {
      conditions.push(
        'len(list_filter(list_transform(installations, i -> i.code), ' +
          'code -> list_contains($installationCodesWithReglementaire, code))) > 0'
      )
      parameters.installationCodesWithReglementaire = this.duckdbService.list(
        installationCodesWithReglementaire
      )
    }

    if (installationCodesWithAlerte) {
      conditions.push(
        'len(list_filter(list_transform(installations, i -> i.code), ' +
          'code -> list_contains($installationCodesWithAlerte, code))) > 0'
      )
      parameters.installationCodesWithAlerte = this.duckdbService.list(installationCodesWithAlerte)
    }

    const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''

    /*
     * Single-pass query: COUNT(*) OVER () is computed in the same scan as the
     * projected columns, avoiding a second full read of the Parquet file.
     * DuckDB evaluates the window aggregate before the ORDER BY + LIMIT/OFFSET,
     * so the total always reflects the full filtered set.
     */
    const rows = await this.duckdbService.query<Record<string, unknown>>(
      'SELECT code, nom, surface, nb_captages_actifs, date_maj, date_creation, communes, nb_parcelles, surface_agricole_bio, surface_agricole_ppe, surface_agricole_ppr, surface_agricole_utile, bbox, ' +
        'list_transform(installations, i -> i.code) AS installation_codes, ' +
        'CAST(COUNT(*) OVER () AS INTEGER) AS total_count ' +
        'FROM read_parquet($path) ' +
        where +
        ` ORDER BY ${SQL_ORDER_BY_CODE} LIMIT $limit OFFSET $offset`,
      parameters
    )

    // The total is embedded in every row; fall back to 0 when the page is empty.
    const total = rows.length > 0 ? Number(rows[0].total_count) : 0

    const installationCodesByRow = rows.map((r) =>
      Array.isArray(r.installation_codes)
        ? r.installation_codes.filter((code): code is string => typeof code === 'string')
        : []
    )
    const allInstallationCodes = Array.from(new Set(installationCodesByRow.flat()))
    const conformiteByInstallation =
      await this.getConformiteStatsByInstallation(allInstallationCodes)

    return {
      data: rows.map((r, index) => {
        const { total_count: totalCount, installation_codes: installationCodes, ...rest } = r
        void totalCount
        void installationCodes

        const conformite = installationCodesByRow[index].reduce(
          (acc, code) => {
            const stats = conformiteByInstallation.get(code)
            if (!stats) return acc
            return {
              depassements_alerte: acc.depassements_alerte + stats.depassements_alerte,
              depassements_reglementaires:
                acc.depassements_reglementaires + stats.depassements_reglementaires,
            }
          },
          { depassements_alerte: 0, depassements_reglementaires: 0 }
        )

        return { ...rest, ...conformite }
      }),
      total,
    }
  }

  /**
   * Get the AAC summaries for a fixed set of codes, keyed by code.
   * Used to enrich territoires (which only store a `code`) with AAC data
   * such as surface, dépassements, etc.
   */
  async getSummariesByCode(aacCodes: string[]): Promise<Record<string, AacSummaryJson>> {
    const summariesByCode: Record<string, AacSummaryJson> = {}
    if (aacCodes.length === 0) return summariesByCode

    const { data } = await this.getAll(1, aacCodes.length, undefined, undefined, aacCodes)
    for (const row of data) {
      const summary = AacDto.fromRawSummary(row)
      summariesByCode[summary.code] = summary
    }

    return summariesByCode
  }

  /**
   * Filtre d'analyses_robinet.parquet sur une liste d'installations, écrit
   * `code_installation IN ($installationCode_0, …)` avec un paramètre par code.
   * analyses_robinet.parquet étant trié par installation, DuckDB
   * compare alors chaque code aux min/max des row groups et ne lit que ceux qui le contiennent.
   * Avec `= ANY($installationCodes)`, il ne retient que l'intervalle [code min, code max] : les
   * installations d'une AAC étant souvent dans plusieurs départements, il lisait presque tout
   * le fichier. Gardé au-delà de INSTALLATION_CODES_IN_LIST_MAX installations.
   * Inutile pour analyses_robinet_par_date.parquet, en un seul row group : `= ANY` y suffit.
   */
  private installationCodesFilter(installationCodes: string[]): {
    sql: string
    parameters: Record<string, string | ReturnType<DuckdbService['list']>>
  } {
    const distinctCodes = Array.from(new Set(installationCodes))

    if (distinctCodes.length > INSTALLATION_CODES_IN_LIST_MAX) {
      return {
        sql: 'code_installation = ANY($installationCodes)',
        parameters: { installationCodes: this.duckdbService.list(distinctCodes) },
      }
    }

    const parameters = Object.fromEntries(
      distinctCodes.map((code, index) => [`installationCode_${index}`, code])
    )
    const placeholders = Object.keys(parameters).map((name) => `$${name}`)
    return { sql: `code_installation IN (${placeholders.join(', ')})`, parameters }
  }

  /**
   * Get aggregate conformity stats (dépassements d'alerte, dépassements réglementaires),
   * over all recorded history, for each of the given installation codes individually.
   * A date exceeding both thresholds is counted only under réglementaire (same priority
   * as SQL_STATUT_CASE), mirroring the mutual-exclusivity rule used in per-installation stats.
   */
  async getConformiteStatsByInstallation(
    installationCodes: string[]
  ): Promise<Map<string, AnalysesStats>> {
    const countsByInstallation = await this.getDateCountsByInstallation(installationCodes)

    return new Map(
      Array.from(countsByInstallation, ([code, counts]) => [
        code,
        {
          total: counts.total,
          depassements_reglementaires: counts.reglementaires,
          depassements_alerte: counts.alerteSeule,
        },
      ])
    )
  }

  /**
   * Returns the distinct installation codes that have at least one water-quality analysis
   * exceeding the given threshold ("reglementaire": limite_qualite, "alerte": reference_qualite),
   * across all recorded history. Used to filter the AAC list by dépassement type.
   */
  async getInstallationCodesWithDepassement(type: 'reglementaire' | 'alerte'): Promise<string[]> {
    const column = type === 'reglementaire' ? 'dep_regl' : 'dep_alerte'

    const rows = await this.duckdbService.query<Record<string, unknown>>(
      `SELECT DISTINCT code_installation FROM read_parquet($path) WHERE ${column}`,
      { path: getAnalysesParDatePath() }
    )

    return rows
      .map((r) => r.code_installation)
      .filter((code): code is string => typeof code === 'string')
  }

  /**
   * Lit toutes les colonnes d'analyses_robinet_par_date.parquet, pour le préchauffage
   * (`start/aac.ts`) : le fichier entier (environ 600 Ko, 3 requêtes HTTP) est ensuite dans le
   * cache de fichiers de DuckDB, et les requêtes suivantes ne font plus d'appel à S3.
   */
  async preloadAnalysesParDate(): Promise<void> {
    await this.duckdbService.query(
      'SELECT COUNT(DISTINCT code_installation) AS installations, MAX(date_prelevement) AS date_max, ' +
        'BOOL_OR(dep_regl) AS dep_regl, BOOL_OR(dep_alerte) AS dep_alerte FROM read_parquet($path)',
      { path: getAnalysesParDatePath() }
    )
  }

  /**
   * Get everything the home page needs about the given territoires' AACs. `summariesByCode`
   * matches getSummariesByCode.
   *
   * Deux requêtes DuckDB simples (les AAC, puis les analyses agrégées par installation),
   * combinées ici : réunies en une seule requête SQL (CTE matérialisées, jointures, list()),
   * elles dépassaient la limite mémoire de DuckDB dès quelques centaines d'AAC.
   */
  async getOverviewForTerritoires(
    territoires: { id: string; code: string }[]
  ): Promise<AacOverview> {
    if (territoires.length === 0) {
      return {
        summariesByCode: {},
        conformiteStatsByAacCode: new Map(),
        captagesAlertes: [],
        aacCodesARisque: { codes: [], total: 0 },
      }
    }

    // Order is preserved: territoires à risque are listed in the same order as the input.
    const aacCodes = Array.from(new Set(territoires.map((t) => t.code)))

    const aacRows = await this.duckdbService.query<Record<string, unknown>>(
      `SELECT code, nom, surface, nb_captages_actifs, date_maj, date_creation, communes, nb_parcelles,
              surface_agricole_bio, surface_agricole_ppe, surface_agricole_ppr, surface_agricole_utile,
              bbox, installations
       FROM read_parquet($path)
       WHERE code = ANY($aacCodes)`,
      { path: getParquetPath(), aacCodes: this.duckdbService.list(aacCodes) }
    )

    // Une ligne par installation de chaque AAC, comme l'unnest(installations) en SQL
    const aacInstallations = aacRows.flatMap(({ installations, code, nom }) =>
      (Array.isArray(installations) ? (installations as Record<string, unknown>[]) : []).map(
        (installation) => ({
          aac_code: code,
          aac_nom: nom,
          code: installation.code,
          nom: installation.nom,
          commune: installation.commune,
          departement: installation.departement,
        })
      )
    )

    const installationCodes = Array.from(
      new Set(
        aacInstallations
          .map((installation) => installation.code)
          .filter((code): code is string => typeof code === 'string')
      )
    )
    const datesByInstallation = await this.getDateCountsByInstallation(installationCodes)

    const installationsByAacCode = Map.groupBy(
      aacInstallations,
      (installation) => installation.aac_code as string
    )

    const summariesByCode: Record<string, AacSummaryJson> = {}
    for (const { installations, ...aacRow } of aacRows) {
      const counts = (installationsByAacCode.get(aacRow.code as string) ?? []).map((installation) =>
        datesByInstallation.get(installation.code as string)
      )
      const summary = AacDto.fromRawSummary({
        ...aacRow,
        depassements_alerte: sumBy(counts, (c) => c?.alerteSeule ?? 0),
        depassements_reglementaires: sumBy(counts, (c) => c?.reglementaires ?? 0),
      })
      summariesByCode[summary.code] = summary
    }

    // Unlike the summaries, alerte counts every date exceeding the alerte threshold,
    // réglementaire or not. AACs without any analysis are left out.
    const conformiteStatsByAacCode = new Map<string, AnalysesStats>()
    for (const [aacCode, installations] of installationsByAacCode) {
      const counts = Array.from(
        new Set(installations.map((installation) => installation.code as string))
      )
        .map((code) => datesByInstallation.get(code))
        .filter((c) => c !== undefined)
      if (counts.length === 0) continue

      conformiteStatsByAacCode.set(aacCode, {
        total: sumBy(counts, (c) => c.total),
        depassements_alerte: sumBy(counts, (c) => c.alerte),
        depassements_reglementaires: sumBy(counts, (c) => c.reglementaires),
      })
    }

    const codesARisque = aacCodes.filter((code) => {
      const stats = conformiteStatsByAacCode.get(code)
      return (
        stats !== undefined &&
        (stats.depassements_alerte > 0 || stats.depassements_reglementaires > 0)
      )
    })

    const captagesAlertes = aacInstallations
      .flatMap((installation) => {
        const counts = datesByInstallation.get(installation.code as string)
        if (!counts || (counts.reglementaires === 0 && counts.alerteSeule === 0)) return []
        return [
          toCaptageAlerte({
            ...installation,
            depassements_reglementaires: counts.reglementaires,
            depassements_alerte: counts.alerteSeule,
          }),
        ]
      })
      // Noms comparés en binaire, comme le faisait l'ORDER BY de DuckDB
      .sort(
        (a, b) =>
          b.depassements_reglementaires - a.depassements_reglementaires ||
          b.depassements_alerte - a.depassements_alerte ||
          (a.nom < b.nom ? -1 : a.nom > b.nom ? 1 : 0)
      )

    return {
      summariesByCode,
      conformiteStatsByAacCode,
      captagesAlertes,
      aacCodesARisque: {
        codes: codesARisque.slice(0, TERRITOIRES_A_RISQUE_LIMIT),
        total: codesARisque.length,
      },
    }
  }

  /**
   * Compte, pour chaque installation, les dates de prélèvement : au total, avec un dépassement
   * réglementaire, avec un dépassement d'alerte, et avec un dépassement d'alerte seulement
   * (une date en dépassement réglementaire et d'alerte compte en réglementaire).
   * Les installations sans analyse sont absentes du résultat.
   */
  private async getDateCountsByInstallation(
    installationCodes: string[]
  ): Promise<Map<string, DateCounts>> {
    const countsByInstallation = new Map<string, DateCounts>()
    if (installationCodes.length === 0) return countsByInstallation

    const sql = `
      SELECT
        code_installation,
        CAST(COUNT(*) AS INTEGER) AS total,
        CAST(COUNT(*) FILTER (WHERE dep_regl) AS INTEGER) AS reglementaires,
        CAST(COUNT(*) FILTER (WHERE dep_alerte) AS INTEGER) AS alerte,
        CAST(COUNT(*) FILTER (WHERE dep_alerte AND NOT dep_regl) AS INTEGER) AS alerte_seule
      FROM read_parquet($path)
      WHERE code_installation = ANY($installationCodes)
      GROUP BY code_installation
    `
    const rows = await this.duckdbService.query<Record<string, unknown>>(sql, {
      path: getAnalysesParDatePath(),
      installationCodes: this.duckdbService.list(Array.from(new Set(installationCodes))),
    })

    for (const row of rows) {
      if (typeof row.code_installation !== 'string') continue
      countsByInstallation.set(row.code_installation, {
        total: Number(row.total),
        reglementaires: Number(row.reglementaires),
        alerte: Number(row.alerte),
        alerteSeule: Number(row.alerte_seule),
      })
    }

    return countsByInstallation
  }

  /**
   * Get details of a single AAC by its code.
   * @param code
   */
  async getByCode(code: string): Promise<Record<string, unknown> | null> {
    const rows = await this.duckdbService.query<Record<string, unknown>>(
      'SELECT * FROM read_parquet($path) WHERE code = $code LIMIT 1',
      { path: getParquetPath(), code }
    )
    if (!rows[0]) return null
    return rows[0]
  }

  /**
   * Returns the surface of every AAC, keyed by AAC code.
   * Reads only the `code` and `surface` columns from the Parquet file.
   */
  async getAllSurfaces(): Promise<Record<string, number | null>> {
    const rows = await this.duckdbService.query<Record<string, unknown>>(
      'SELECT code, surface FROM read_parquet($path)',
      { path: getParquetPath() }
    )

    return Object.fromEntries(
      rows
        .filter((row) => typeof row.code === 'string')
        .map((row) => [
          row.code,
          row.surface === null || row.surface === undefined ? null : Number(row.surface),
        ])
    )
  }

  /**
   * Returns installation codes for a given AAC code.
   * Reads only the installations column to avoid loading the full AAC row.
   */
  async getInstallationCodesByAacCode(aacCode: string): Promise<string[] | null> {
    const rows = await this.duckdbService.query<Record<string, unknown>>(
      'SELECT list_transform(installations, i -> i.code) AS installation_codes ' +
        'FROM read_parquet($path) WHERE code = $aacCode LIMIT 1',
      { path: getParquetPath(), aacCode }
    )
    if (!rows[0]) return null

    const installationCodes = rows[0].installation_codes
    if (!Array.isArray(installationCodes)) return []

    return installationCodes
      .filter((code): code is string => typeof code === 'string')
      .map((code) => code.trim())
      .filter((code) => code.length > 0)
  }

  /**
   * Checks whether an installation belongs to a given AAC.
   * Reads only the `code` and `installations` columns from the Parquet file,
   * which is significantly cheaper than a full SELECT * via getByCode().
   */
  async hasInstallation(aacCode: string, installationCode: string): Promise<boolean> {
    const rows = await this.duckdbService.query(
      'SELECT 1 AS found FROM read_parquet($path) ' +
        'WHERE code = $aacCode ' +
        '  AND list_contains(list_transform(installations, i -> i.code), $installationCode) ' +
        'LIMIT 1',
      { path: getParquetPath(), aacCode, installationCode }
    )
    return rows.length > 0
  }

  /**
   * Get the distinct years for which analyses exist for a given installation.
   * Returns years in descending order (most recent first).
   * @param installationCode  The installation code (InstallationInfo.code)
   */
  async getAnalysesRobinetYears(installationCode: string): Promise<string[]> {
    const rows = await this.duckdbService.query<Record<string, unknown>>(
      "SELECT DISTINCT CAST(date_part('year', date_prelevement) AS INTEGER) AS year " +
        'FROM read_parquet($path) ' +
        'WHERE code_installation = $installationCode AND date_prelevement IS NOT NULL ' +
        'ORDER BY year DESC',
      { path: getAnalysesParDatePath(), installationCode }
    )
    return rows.map((r) => String(r.year))
  }

  /**
   * Get water quality analyses for an installation filtered by year.
   * @param installationCode  The installation code (InstallationInfo.code)
   * @param year              The calendar year to filter by
   */
  async getAnalysesRobinet(
    installationCode: string,
    year: number
  ): Promise<Record<string, unknown>[]> {
    return this.duckdbService.query(
      'SELECT * FROM read_parquet($path) ' +
        "WHERE code_installation = $installationCode AND date_part('year', date_prelevement) = $year " +
        'ORDER BY date_prelevement DESC NULLS LAST',
      { path: getAnalysesRobinetPath(), installationCode, year }
    )
  }

  /**
   * Get aggregate stats for an installation over a year range:
   * total analyses, dépassements d'alerte (reference_qualite exceeded),
   * and dépassements réglementaires (limite_qualite exceeded).
   */
  async getAnalysesStats(
    installationCode: string,
    yearMin: number,
    yearMax: number
  ): Promise<AnalysesStats> {
    const sql = `
      SELECT
        CAST(COUNT(*) AS INTEGER) AS total,
        CAST(COUNT(*) FILTER (WHERE dep_regl) AS INTEGER) AS depassements_reglementaires,
        CAST(COUNT(*) FILTER (WHERE dep_alerte) AS INTEGER) AS depassements_alerte
      FROM read_parquet($path)
      WHERE code_installation = $installationCode
        AND ${SQL_YEAR_RANGE}
    `
    const rows = await this.duckdbService.query<Record<string, unknown>>(sql, {
      path: getAnalysesParDatePath(),
      installationCode,
      yearMin,
      yearMax,
    })
    const row = rows[0]
    return {
      total: Number(row.total),
      depassements_alerte: Number(row.depassements_alerte),
      depassements_reglementaires: Number(row.depassements_reglementaires),
    }
  }

  /**
   * Returns the min/max year range of analyses for the given installation codes.
   */
  async getAnalysesYearRange(
    installationCodes: string[]
  ): Promise<{ yearMin: number | null; yearMax: number | null }> {
    if (installationCodes.length === 0) return { yearMin: null, yearMax: null }

    const rows = await this.duckdbService.query<Record<string, unknown>>(
      `SELECT MIN(CAST(date_part('year', date_prelevement) AS INTEGER)) AS year_min,
              MAX(CAST(date_part('year', date_prelevement) AS INTEGER)) AS year_max
       FROM read_parquet($path)
       WHERE code_installation = ANY($installationCodes)`,
      {
        path: getAnalysesParDatePath(),
        installationCodes: this.duckdbService.list(Array.from(new Set(installationCodes))),
      }
    )
    const row = rows[0] ?? {}
    const toNullableFiniteNumber = (value: unknown): number | null => {
      if (value === null || value === undefined) return null
      const numericValue = Number(value)
      return Number.isFinite(numericValue) ? numericValue : null
    }
    return {
      yearMin: toNullableFiniteNumber(row.year_min),
      yearMax: toNullableFiniteNumber(row.year_max),
    }
  }

  /**
   * Get per-year analyses stats for an installation:
   * total analyses, with/without dépassement per year.
   * One "analyse" = one distinct date of sampling.
   * A date has a dépassement if at least one parameter exceeds its threshold.
   */
  async getAnalysesPerYear(
    installationCode: string,
    yearMin: number,
    yearMax: number
  ): Promise<AnalysesPerYear[]> {
    const sql = `
      SELECT
        CAST(date_part('year', date_prelevement) AS INTEGER) AS annee,
        CAST(COUNT(*) AS INTEGER) AS total,
        CAST(COUNT(*) FILTER (WHERE dep_regl OR dep_alerte) AS INTEGER) AS avec_dep,
        CAST(COUNT(*) FILTER (WHERE NOT (dep_regl OR dep_alerte)) AS INTEGER) AS sans_dep
      FROM read_parquet($path)
      WHERE code_installation = $installationCode
        AND ${SQL_YEAR_RANGE}
      GROUP BY annee
      ORDER BY annee
    `
    const rows = await this.duckdbService.query<Record<string, unknown>>(sql, {
      path: getAnalysesParDatePath(),
      installationCode,
      yearMin,
      yearMax,
    })
    return rows.map((r) => ({
      annee: Number(r.annee),
      total: Number(r.total),
      avec_dep: Number(r.avec_dep),
      sans_dep: Number(r.sans_dep),
    }))
  }

  /**
   * Get the list of distinct substances analysed for an installation over a year range.
   */
  async getSubstances(
    installationCode: string,
    yearMin: number,
    yearMax: number
  ): Promise<SubstanceItem[]> {
    const sql = `
      SELECT
        CAST(code_parametre AS INTEGER) AS code_parametre,
        ANY_VALUE(libelle_parametre) AS libelle_parametre,
        ANY_VALUE(code_unite) AS code_unite,
        BOOL_OR(${SQL_DEP_ANY}) AS has_dep,
        CAST(COUNT(*) FILTER (WHERE ${SQL_DEP_REGL}) AS INTEGER) AS nb_dep_regl,
        CAST(COUNT(*) FILTER (WHERE ${SQL_DEP_ALERTE}) AS INTEGER) AS nb_dep_alerte,
        CAST(COUNT(*) AS INTEGER) AS nb_total,
        ROUND(100.0 * COUNT(*) FILTER (WHERE ${SQL_DEP_REGL}) / NULLIF(COUNT(*), 0), 1) AS frequence_dep_regl,
        ROUND(MAX(resultat_traduction), 4) AS max_value
      FROM read_parquet($path)
      WHERE code_installation = $installationCode
        AND ${SQL_YEAR_RANGE}
        AND resultat_traduction IS NOT NULL
      GROUP BY code_parametre
      ORDER BY nb_dep_regl DESC, nb_dep_alerte DESC, libelle_parametre
    `
    const rows = await this.duckdbService.query<Record<string, unknown>>(sql, {
      path: getAnalysesRobinetPath(),
      installationCode,
      yearMin,
      yearMax,
    })
    return rows.map((r) => ({
      code_parametre: Number(r.code_parametre),
      libelle_parametre: String(r.libelle_parametre ?? ''),
      code_unite: String(r.code_unite ?? ''),
      has_dep: Boolean(r.has_dep),
      nb_dep_regl: Number(r.nb_dep_regl ?? 0),
      nb_dep_alerte: Number(r.nb_dep_alerte ?? 0),
      nb_total: Number(r.nb_total ?? 0),
      frequence_dep_regl: Number(r.frequence_dep_regl ?? 0),
      max_value: Number(r.max_value ?? 0),
    }))
  }

  /**
   * Get detailed chronique for a specific substance: info, stats, and time series.
   */
  async getSubstanceChronique(
    installationCode: string,
    codeParametre: number,
    yearMin: number,
    yearMax: number
  ): Promise<ChroniqueData> {
    const statsSql = `
      SELECT
        ANY_VALUE(libelle_parametre) AS libelle_parametre,
        ANY_VALUE(code_unite) AS code_unite,
        TRY_CAST(replace(regexp_extract(ANY_VALUE(limite_qualite), '<=([0-9][0-9,.]*)', 1), ',', '.') AS DOUBLE) AS seuil_regl,
        TRY_CAST(replace(regexp_extract(ANY_VALUE(reference_qualite), '<=([0-9][0-9,.]*)', 1), ',', '.') AS DOUBLE) AS seuil_alerte,
        ROUND(AVG(resultat_traduction), 4) AS moyenne,
        ROUND(MAX(resultat_traduction), 4) AS maximum,
        CAST(COUNT(*) AS INTEGER) AS nb_total,
        CAST(COUNT(*) FILTER (WHERE ${SQL_DEP_REGL}) AS INTEGER) AS nb_dep_regl,
        ROUND(100.0 * COUNT(*) FILTER (WHERE ${SQL_DEP_REGL}) / NULLIF(COUNT(*), 0), 1) AS frequence_dep_regl
      FROM read_parquet($path)
      WHERE code_installation = $installationCode
        AND CAST(code_parametre AS INTEGER) = $codeParametre
        AND ${SQL_YEAR_RANGE}
        AND resultat_traduction IS NOT NULL
    `

    const seriesSql = `
      SELECT
        CAST(date_prelevement AS VARCHAR) AS date,
        resultat_traduction AS valeur,
        ${SQL_STATUT_CASE} AS statut
      FROM read_parquet($path)
      WHERE code_installation = $installationCode
        AND CAST(code_parametre AS INTEGER) = $codeParametre
        AND ${SQL_YEAR_RANGE}
        AND resultat_traduction IS NOT NULL
      ORDER BY date_prelevement
    `

    const parameters = {
      path: getAnalysesRobinetPath(),
      installationCode,
      codeParametre,
      yearMin,
      yearMax,
    }
    const [statsRows, seriesRows] = await Promise.all([
      this.duckdbService.query<Record<string, unknown>>(statsSql, parameters),
      this.duckdbService.query<Record<string, unknown>>(seriesSql, parameters),
    ])

    const row = statsRows[0] ?? {}
    return {
      info: {
        code_parametre: codeParametre,
        libelle_parametre: String(row.libelle_parametre ?? ''),
        code_unite: String(row.code_unite ?? ''),
        seuil_regl:
          row.seuil_regl !== null && row.seuil_regl !== undefined ? Number(row.seuil_regl) : null,
        seuil_alerte:
          row.seuil_alerte !== null && row.seuil_alerte !== undefined
            ? Number(row.seuil_alerte)
            : null,
      },
      stats: {
        moyenne: Number(row.moyenne ?? 0),
        maximum: Number(row.maximum ?? 0),
        nb_total: Number(row.nb_total ?? 0),
        nb_dep_regl: Number(row.nb_dep_regl ?? 0),
        frequence_dep_regl: Number(row.frequence_dep_regl ?? 0),
      },
      series: seriesRows.map((r) => ({
        date: String(r.date),
        valeur: Number(r.valeur),
        statut: String(r.statut) as 'conforme' | 'dep_alerte' | 'dep_regl',
      })),
    }
  }

  /**
   * Returns total number of analyses rows and distinct parameters.
   */
  async getAnalysesSummary(
    installationCodes: string[],
    yearFrom?: number,
    yearTo?: number
  ): Promise<{ nb_analyses: number; nb_parametres: number }> {
    if (installationCodes.length === 0) return { nb_analyses: 0, nb_parametres: 0 }

    const installationFilter = this.installationCodesFilter(installationCodes)
    const conditions = [installationFilter.sql, 'date_prelevement IS NOT NULL']
    const parameters: Record<string, number | string | ReturnType<DuckdbService['list']>> = {
      path: getAnalysesRobinetPath(),
      ...installationFilter.parameters,
    }
    if (yearFrom !== undefined) {
      conditions.push(SQL_YEAR_FROM)
      parameters.yearMin = yearFrom
    }
    if (yearTo !== undefined) {
      conditions.push(SQL_YEAR_TO)
      parameters.yearMax = yearTo
    }

    const rows = await this.duckdbService.query<Record<string, unknown>>(
      `SELECT COUNT(DISTINCT (code_installation, date_prelevement)) AS nb_analyses, COUNT(DISTINCT code_parametre) AS nb_parametres ` +
        `FROM read_parquet($path) WHERE ${conditions.join(' AND ')}`,
      parameters
    )
    const row = rows[0] ?? {}
    return {
      nb_analyses: Number(row.nb_analyses ?? 0),
      nb_parametres: Number(row.nb_parametres ?? 0),
    }
  }

  async getAnalysesRobinetForExport(
    installationCodes: string[]
  ): Promise<Record<string, unknown>[]> {
    if (installationCodes.length === 0) {
      return []
    }

    const installationFilter = this.installationCodesFilter(installationCodes)
    return this.duckdbService.query(
      'SELECT "code_insee", "nom_commune", "code_installation", "nom_installation", "date_prelevement", "heure_prelevement", "code_brgm", "resultat", "code_unite", "libelle_parametre", "limite_qualite", "reference_qualite", "captage_prioritaire" ' +
        'FROM read_parquet($path) ' +
        `WHERE ${installationFilter.sql} ` +
        'ORDER BY "date_prelevement" DESC NULLS LAST',
      { path: getAnalysesRobinetPath(), ...installationFilter.parameters }
    )
  }

  /**
   * Returns all AAC names ordered by code.
   */
  async getAllNames() {
    return this.duckdbService.query<{ code: string; name: string }>(
      `SELECT code, nom as name FROM read_parquet($path) ORDER BY ${SQL_ORDER_BY_CODE}`,
      { path: getParquetPath() }
    )
  }

  /**
   * Used by the global search: AACs whose name or code matches the query (ignoring case and accents),
   * ordered by name. An AAC whose code is exactly the query comes first: short codes such as "10"
   * are contained in many other codes and would otherwise be cut off by the limit.
   * Returns at most `limit` AACs, along with the total number of matches.
   */
  async searchAacs(
    recherche: string,
    limit: number
  ): Promise<{ data: GlobalSearchAac[]; total: number }> {
    const { aacs } = await this.getGlobalSearchIndex()
    return searchInIndex(aacs, recherche, limit)
  }

  /**
   * Used by the global search: installations whose name or BSS code matches the query
   * (ignoring case and accents), ordered by name.
   * An installation can belong to several AACs: it is returned once, with the first AAC code
   * (needed to build the link to its page).
   */
  async searchInstallations(
    recherche: string,
    limit: number
  ): Promise<{ data: GlobalSearchInstallation[]; total: number }> {
    const { installations } = await this.getGlobalSearchIndex()
    return searchInIndex(installations, recherche, limit)
  }

  /**
   * The global search runs on every keystroke: querying the Parquet files on S3 each time would
   * take up to a second and queue up on the shared DuckDB connection. The AACs and installations
   * (a few thousand rows) are loaded once instead, then filtered in memory until the cache expires.
   */
  private getGlobalSearchIndex(): Promise<GlobalSearchIndex> {
    const cached = AacService.globalSearchIndex
    if (cached && Date.now() - cached.loadedAt < GLOBAL_SEARCH_INDEX_TTL_MS) {
      return cached.promise
    }

    const promise = this.loadGlobalSearchIndex()
    AacService.globalSearchIndex = { promise, loadedAt: Date.now() }
    // Do not keep a failed load in cache, so that the next search retries
    promise.catch(() => {
      if (AacService.globalSearchIndex?.promise === promise) AacService.globalSearchIndex = null
    })

    return promise
  }

  private async loadGlobalSearchIndex(): Promise<GlobalSearchIndex> {
    const [aacs, installations] = await Promise.all([
      this.duckdbService.query<GlobalSearchAac>(
        'SELECT code, nom FROM read_parquet($path) ORDER BY nom',
        { path: getParquetPath() }
      ),
      this.duckdbService.query<GlobalSearchInstallation>(
        `
        SELECT
          installation.code AS code,
          installation.nom AS nom,
          installation.code_bss AS code_bss,
          min(aac_code) AS aac_code
        FROM (SELECT code AS aac_code, unnest(installations) AS installation FROM read_parquet($path))
        WHERE installation.code IS NOT NULL AND installation.nom IS NOT NULL
        GROUP BY installation.code, installation.nom, installation.code_bss
        ORDER BY nom
        `,
        { path: getParquetPath() }
      ),
    ])

    return {
      aacs: aacs.map((aac) => ({
        item: aac,
        code: aac.code,
        searchText: normalizeSearchText(`${aac.nom} ${aac.code}`),
      })),
      installations: installations.map((installation) => ({
        item: installation,
        code: installation.code_bss,
        searchText: normalizeSearchText(`${installation.nom} ${installation.code_bss ?? ''}`),
      })),
    }
  }

  /**
   * Empties the global search cache, so that the next search reloads the AAC dataset.
   */
  static clearGlobalSearchIndex() {
    AacService.globalSearchIndex = null
  }

  /**
   * Returns all captages extracted from AAC installations.
   * The source parquet may contain the same installation across multiple AACs,
   * so rows are deduplicated to satisfy unique constraints on `code` and `bssCode`.
   */
  async getAllCaptagesFromInstallations(): Promise<CaptageSeedRow[]> {
    const rows = await this.duckdbService.query<Record<string, unknown>>(
      'SELECT unnest(installations) AS installation FROM read_parquet($path) WHERE installations IS NOT NULL',
      { path: getParquetPath() }
    )

    const candidates = rows
      .map((row) => row.installation as Record<string, unknown> | null)
      .flatMap((installation): CaptageSeedRow[] => {
        if (!installation || typeof installation !== 'object') return []

        const code = normalizeString(installation.code)
        const name = normalizeString(installation.nom)
        const bssCode = normalizeString(installation.code_bss)
        const state = normalizeString(installation.etat)

        if (!code || !name || !bssCode || !state) return []

        const commune = normalizeString(installation.commune)
        const type = normalizeString(installation.type)
        const prioritaire = installation.prioritaire === true

        return [
          {
            code,
            name,
            bssCode,
            state,
            commune,
            type,
            prioritaire,
          },
        ]
      })
      .sort((left, right) => {
        const byState = getCaptageStatePriority(left.state) - getCaptageStatePriority(right.state)
        if (byState !== 0) return byState

        const byCode = left.code.localeCompare(right.code)
        if (byCode !== 0) return byCode

        const byBssCode = left.bssCode.localeCompare(right.bssCode)
        if (byBssCode !== 0) return byBssCode

        return left.name.localeCompare(right.name)
      })

    const captagesByCode = new Map<string, CaptageSeedRow>()
    const usedBssCodes = new Set<string>()

    for (const captage of candidates) {
      if (captagesByCode.has(captage.code)) continue
      if (usedBssCodes.has(captage.bssCode)) continue

      captagesByCode.set(captage.code, captage)
      usedBssCodes.add(captage.bssCode)
    }

    return Array.from(captagesByCode.values())
  }
}
