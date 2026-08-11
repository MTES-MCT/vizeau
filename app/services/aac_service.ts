import env from '#start/env'
import { inject } from '@adonisjs/core'
import { DuckdbService } from '#services/duckdb_service'
import type { AnalysesStats, AnalysesPerYear, SubstanceItem, ChroniqueData } from '#types/captage'

function getParquetPath(): string {
  return `s3://${env.get('S3_BUCKET')}/aac.parquet`
}

function getAnalysesRobinetPath(): string {
  return `s3://${env.get('S3_BUCKET')}/analyses_robinet.parquet`
}

// ---------------------------------------------------------------------------
// Reusable SQL threshold-detection fragments (DuckDB dialect).
// Centralised here to avoid divergence across queries.
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
 * Service for querying the AAC dataset stored as a Parquet file in S3 via DuckDB.
 * Provides methods to get paginated lists of AACs with optional search filters,
 * and to get details of a single AAC by code.
 * Uses parameterized queries to prevent SQL injection,
 * and normalizes DuckDB-specific value types to plain JS objects.
 */
@inject()
export class AacService {
  constructor(protected duckdbService: DuckdbService) {}

  async getAll(
    page: number,
    perPage: number,
    recherche?: string,
    commune?: string,
    aacCodes?: string[]
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

    const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''

    /*
     * Single-pass query: COUNT(*) OVER () is computed in the same scan as the
     * projected columns, avoiding a second full read of the Parquet file.
     * DuckDB evaluates the window aggregate before the ORDER BY + LIMIT/OFFSET,
     * so the total always reflects the full filtered set.
     */
    const rows = await this.duckdbService.query<Record<string, unknown>>(
      'SELECT code, nom, surface, nb_captages_actifs, date_maj, date_creation, communes, nb_parcelles, surface_agricole_bio, surface_agricole_ppe, surface_agricole_ppr, surface_agricole_utile, bbox, ' +
        'CAST(COUNT(*) OVER () AS INTEGER) AS total_count ' +
        'FROM read_parquet($path) ' +
        where +
        ' ORDER BY nom LIMIT $limit OFFSET $offset',
      parameters
    )

    // The total is embedded in every row; fall back to 0 when the page is empty.
    const total = rows.length > 0 ? Number(rows[0].total_count) : 0

    return {
      data: rows.map((r) => {
        const { total_count: totalCount, ...rest } = r
        void totalCount
        return rest
      }),
      total,
    }
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
      { path: getAnalysesRobinetPath(), installationCode }
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
      WITH date_flags AS (
        SELECT
          date_prelevement,
          BOOL_OR(${SQL_DEP_REGL}) AS dep_regl,
          BOOL_OR(${SQL_DEP_ALERTE}) AS dep_alerte
        FROM read_parquet($path)
        WHERE code_installation = $installationCode
          AND date_part('year', date_prelevement) BETWEEN $yearMin AND $yearMax
        GROUP BY date_prelevement
      )
      SELECT
        CAST(COUNT(*) AS INTEGER) AS total,
        CAST(COUNT(*) FILTER (WHERE dep_regl) AS INTEGER) AS depassements_reglementaires,
        CAST(COUNT(*) FILTER (WHERE dep_alerte) AS INTEGER) AS depassements_alerte
      FROM date_flags
    `
    const rows = await this.duckdbService.query<Record<string, unknown>>(sql, {
      path: getAnalysesRobinetPath(),
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
       WHERE code_installation = ANY($installationCodes) AND date_prelevement IS NOT NULL`,
      {
        path: getAnalysesRobinetPath(),
        installationCodes: this.duckdbService.list(installationCodes),
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
      WITH date_flags AS (
        SELECT
          date_prelevement,
          BOOL_OR(${SQL_DEP_ANY}) AS date_a_dep
        FROM read_parquet($path)
        WHERE code_installation = $installationCode
          AND date_part('year', date_prelevement) BETWEEN $yearMin AND $yearMax
        GROUP BY date_prelevement
      )
      SELECT
        CAST(date_part('year', date_prelevement) AS INTEGER) AS annee,
        CAST(COUNT(*) AS INTEGER) AS total,
        CAST(COUNT(*) FILTER (WHERE date_a_dep) AS INTEGER) AS avec_dep,
        CAST(COUNT(*) FILTER (WHERE NOT date_a_dep) AS INTEGER) AS sans_dep
      FROM date_flags
      GROUP BY annee
      ORDER BY annee
    `
    const rows = await this.duckdbService.query<Record<string, unknown>>(sql, {
      path: getAnalysesRobinetPath(),
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
        AND date_part('year', date_prelevement) BETWEEN $yearMin AND $yearMax
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
        AND date_part('year', date_prelevement) BETWEEN $yearMin AND $yearMax
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
        AND date_part('year', date_prelevement) BETWEEN $yearMin AND $yearMax
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

    const conditions = [
      'code_installation = ANY($installationCodes)',
      'date_prelevement IS NOT NULL',
    ]
    const parameters: Record<string, number | string | ReturnType<DuckdbService['list']>> = {
      path: getAnalysesRobinetPath(),
      installationCodes: this.duckdbService.list(installationCodes),
    }
    if (yearFrom !== undefined) {
      conditions.push("date_part('year', date_prelevement) >= $yearFrom")
      parameters.yearFrom = yearFrom
    }
    if (yearTo !== undefined) {
      conditions.push("date_part('year', date_prelevement) <= $yearTo")
      parameters.yearTo = yearTo
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

    return this.duckdbService.query(
      'SELECT "code_insee", "nom_commune", "code_installation", "nom_installation", "date_prelevement", "heure_prelevement", "code_brgm", "resultat", "code_unite", "libelle_parametre", "limite_qualite", "reference_qualite", "captage_prioritaire" ' +
        'FROM read_parquet($path) ' +
        'WHERE "code_installation" = ANY($installationCodes) ' +
        'ORDER BY "date_prelevement" DESC NULLS LAST',
      {
        path: getAnalysesRobinetPath(),
        installationCodes: this.duckdbService.list(installationCodes),
      }
    )
  }

  /**
   * Returns all AAC names ordered alphabetically.
   */
  async getAllNames() {
    return this.duckdbService.query<{ code: string; name: string }>(
      'SELECT code, nom as name FROM read_parquet($path) ORDER BY nom',
      { path: getParquetPath() }
    )
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
