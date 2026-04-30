import { DuckDBInstance, DuckDBConnection } from '@duckdb/node-api'
import env from '#start/env'

/** Escapes a value for safe embedding in a single-quoted SQL string literal. */
function sqlEscape(value: string): string {
  return value.replace(/'/g, "''")
}

/*
 * Singleton DuckDB connection instance.
 * Initialized on first use by getConnection(), which also sets up the S3 secret.
 * The connection is reused for all queries to avoid overhead of reconnecting.
 */
let connectionPromise: Promise<DuckDBConnection> | null = null

async function getConnection(): Promise<DuckDBConnection> {
  if (connectionPromise) return connectionPromise

  connectionPromise = (async () => {
    try {
      const instance = await DuckDBInstance.create(':memory:')
      const conn = await instance.connect()
      await conn.run('INSTALL httpfs;')
      await conn.run('LOAD httpfs;')
      await conn.run(`
        CREATE SECRET aac_s3_secret (
          TYPE S3,
          KEY_ID '${sqlEscape(env.get('S3_ACCESS_KEY'))}',
          SECRET '${sqlEscape(env.get('S3_SECRET_KEY'))}',
          REGION '${sqlEscape(env.get('S3_REGION'))}',
          ENDPOINT '${sqlEscape(env.get('S3_ENDPOINT'))}',
          URL_STYLE 'path'
        );
      `)
      return conn
    } catch (err) {
      connectionPromise = null
      throw err
    }
  })()

  return connectionPromise
}

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

/**
 * Recursively normalizes DuckDB value types to plain JS objects:
 * - DuckDBDateValue { days } → ISO date string
 * - DuckDBStructValue { entries: object } → plain object
 * - DuckDBMapValue { entries: [{key, value}] } → plain object
 * - BigInt → Number
 */
function normalizeValue(value: unknown): unknown {
  if (value === null || value === undefined) return value
  if (typeof value === 'bigint') return Number(value)
  if (Array.isArray(value)) return value.map(normalizeValue)

  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>

    // DuckDB date value: { days: number }
    if ('days' in obj && (typeof obj.days === 'number' || typeof obj.days === 'bigint')) {
      const ms = Number(obj.days) * 86400000
      return new Date(ms).toISOString().slice(0, 10)
    }

    // DuckDB list value: { items: [...] }
    if ('items' in obj && Array.isArray(obj.items)) {
      return (obj.items as unknown[]).map(normalizeValue)
    }

    // DuckDB struct or map value: has 'entries' property
    if ('entries' in obj) {
      const entries = obj.entries
      if (Array.isArray(entries)) {
        // DuckDB map: entries = [{ key, value }, ...]
        return Object.fromEntries(
          (entries as Array<{ key: unknown; value: unknown }>).map(({ key, value: v }) => [
            String(normalizeValue(key)),
            normalizeValue(v),
          ])
        )
      } else if (entries !== null && typeof entries === 'object') {
        // DuckDB struct: entries = { field: value, ... }
        return Object.fromEntries(
          Object.entries(entries as Record<string, unknown>).map(([k, v]) => [k, normalizeValue(v)])
        )
      }
    }

    // Plain object
    return Object.fromEntries(Object.entries(obj).map(([k, v]) => [k, normalizeValue(v)]))
  }

  return value
}

/**
 * Service for querying the AAC dataset stored as a Parquet file in S3 via DuckDB.
 * Provides methods to get paginated lists of AACs with optional search filters,
 * and to get details of a single AAC by code.
 * Uses parameterized queries to prevent SQL injection,
 * and normalizes DuckDB-specific value types to plain JS objects.
 */
export class AacService {
  async getAll(
    page: number,
    perPage: number,
    recherche?: string,
    commune?: string,
    aacCodes?: string[]
  ): Promise<{ data: Record<string, unknown>[]; total: number }> {
    const conn = await getConnection()
    const path = getParquetPath()

    let paramIdx = 2
    const conditions: string[] = []
    const filterParams: string[] = []

    if (recherche) {
      conditions.push(
        "(nom ILIKE '%' || $" + paramIdx + " || '%' OR code ILIKE '%' || $" + paramIdx + " || '%')"
      )

      paramIdx++
      filterParams.push(recherche)
    }

    if (commune) {
      conditions.push(
        "array_to_string(map_keys(communes.communes), '|') ILIKE '%' || $" + paramIdx + " || '%'"
      )

      paramIdx++
      filterParams.push(commune)
    }

    if (aacCodes && aacCodes.length > 0) {
      const placeholders: string[] = []

      // Build the param placeholders for the IN clause
      for (const code of aacCodes) {
        placeholders.push(`$${paramIdx}`)
        paramIdx++
        filterParams.push(code)
      }

      conditions.push(`code IN (${placeholders.join(', ')})`)
    }

    const where = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : ''

    const bindAll = (stmt: { bindVarchar: (i: number, v: string) => void }) => {
      stmt.bindVarchar(1, path)
      filterParams.forEach((v, i) => stmt.bindVarchar(i + 2, v))
    }

    const countStmt = await conn.prepare('SELECT COUNT(*) AS total FROM read_parquet($1) ' + where)
    bindAll(countStmt)
    const countResult = await countStmt.run()
    const countRows = (await countResult.getRowObjects()) as Array<Record<string, unknown>>
    const total = Number(countRows[0].total)

    const limitIdx = paramIdx
    const offsetIdx = paramIdx + 1
    const dataStmt = await conn.prepare(
      'SELECT code, nom, surface, nb_captages_actifs, date_maj, date_creation, communes, nb_parcelles, surface_agricole_bio, surface_agricole_ppe, surface_agricole_ppr, surface_agricole_utile, bbox ' +
        'FROM read_parquet($1) ' +
        where +
        ' ORDER BY nom LIMIT $' +
        limitIdx +
        ' OFFSET $' +
        offsetIdx
    )
    bindAll(dataStmt)
    dataStmt.bindInteger(limitIdx, perPage)
    dataStmt.bindInteger(offsetIdx, (page - 1) * perPage)
    const dataResult = await dataStmt.run()
    const rows = (await dataResult.getRowObjects()) as Array<Record<string, unknown>>

    return { data: rows.map((r) => normalizeValue(r) as Record<string, unknown>), total }
  }

  /**
   * Get details of a single AAC by its code.
   * @param code
   */
  async getByCode(code: string): Promise<Record<string, unknown> | null> {
    const conn = await getConnection()
    const stmt = await conn.prepare('SELECT * FROM read_parquet($1) WHERE code = $2 LIMIT 1')
    stmt.bindVarchar(1, getParquetPath())
    stmt.bindVarchar(2, code)

    const result = await stmt.run()
    const rows = (await result.getRowObjects()) as Array<Record<string, unknown>>
    if (!rows[0]) return null
    return normalizeValue(rows[0]) as Record<string, unknown>
  }

  /**
   * Returns installation codes for a given AAC code.
   * Reads only the installations column to avoid loading the full AAC row.
   */
  async getInstallationCodesByAacCode(aacCode: string): Promise<string[] | null> {
    const conn = await getConnection()
    const stmt = await conn.prepare(
      'SELECT list_transform(installations, i -> i.code) AS installation_codes ' +
        'FROM read_parquet($1) WHERE code = $2 LIMIT 1'
    )
    stmt.bindVarchar(1, getParquetPath())
    stmt.bindVarchar(2, aacCode)

    const result = await stmt.run()
    const rows = (await result.getRowObjects()) as Array<Record<string, unknown>>
    if (!rows[0]) return null

    const installationCodes = normalizeValue(rows[0].installation_codes)
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
    const conn = await getConnection()
    const stmt = await conn.prepare(
      'SELECT 1 AS found FROM read_parquet($1) ' +
        'WHERE code = $2 ' +
        '  AND list_contains(list_transform(installations, i -> i.code), $3) ' +
        'LIMIT 1'
    )
    stmt.bindVarchar(1, getParquetPath())
    stmt.bindVarchar(2, aacCode)
    stmt.bindVarchar(3, installationCode)

    const result = await stmt.run()
    const rows = await result.getRowObjects()
    return rows.length > 0
  }

  /**
   * Get the distinct years for which analyses exist for a given installation.
   * Returns years in descending order (most recent first).
   * @param installationCode  The installation code (InstallationInfo.code)
   */
  async getAnalysesRobinetYears(installationCode: string): Promise<string[]> {
    const conn = await getConnection()
    const stmt = await conn.prepare(
      "SELECT DISTINCT CAST(date_part('year', date_prelevement) AS INTEGER) AS year " +
        'FROM read_parquet($1) ' +
        'WHERE code_installation = $2 AND date_prelevement IS NOT NULL ' +
        'ORDER BY year DESC'
    )
    stmt.bindVarchar(1, getAnalysesRobinetPath())
    stmt.bindVarchar(2, installationCode)

    const result = await stmt.run()
    const rows = (await result.getRowObjects()) as Array<Record<string, unknown>>
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
    const conn = await getConnection()
    const stmt = await conn.prepare(
      'SELECT * FROM read_parquet($1) ' +
        "WHERE code_installation = $2 AND date_part('year', date_prelevement) = $3 " +
        'ORDER BY date_prelevement DESC NULLS LAST'
    )
    stmt.bindVarchar(1, getAnalysesRobinetPath())
    stmt.bindVarchar(2, installationCode)
    stmt.bindInteger(3, year)

    const result = await stmt.run()
    const rows = (await result.getRowObjects()) as Array<Record<string, unknown>>
    return rows.map((r) => normalizeValue(r) as Record<string, unknown>)
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
  ): Promise<{ total: number; depassements_alerte: number; depassements_reglementaires: number }> {
    const conn = await getConnection()
    const sql = `
      WITH date_flags AS (
        SELECT
          date_prelevement,
          BOOL_OR(${SQL_DEP_REGL}) AS dep_regl,
          BOOL_OR(${SQL_DEP_ALERTE}) AS dep_alerte
        FROM read_parquet($1)
        WHERE code_installation = $2
          AND date_part('year', date_prelevement) BETWEEN $3 AND $4
        GROUP BY date_prelevement
      )
      SELECT
        CAST(COUNT(*) AS INTEGER) AS total,
        CAST(COUNT(*) FILTER (WHERE dep_regl) AS INTEGER) AS depassements_reglementaires,
        CAST(COUNT(*) FILTER (WHERE dep_alerte) AS INTEGER) AS depassements_alerte
      FROM date_flags
    `
    const stmt = await conn.prepare(sql)
    stmt.bindVarchar(1, getAnalysesRobinetPath())
    stmt.bindVarchar(2, installationCode)
    stmt.bindInteger(3, yearMin)
    stmt.bindInteger(4, yearMax)

    const result = await stmt.run()
    const rows = (await result.getRowObjects()) as Array<Record<string, unknown>>
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

    const conn = await getConnection()
    const path = getAnalysesRobinetPath()
    const placeholders = installationCodes.map((_, i) => `$${i + 2}`).join(', ')
    const stmt = await conn.prepare(
      `SELECT MIN(CAST(date_part('year', date_prelevement) AS INTEGER)) AS year_min,
              MAX(CAST(date_part('year', date_prelevement) AS INTEGER)) AS year_max
       FROM read_parquet($1)
       WHERE code_installation IN (${placeholders}) AND date_prelevement IS NOT NULL`
    )
    stmt.bindVarchar(1, path)
    installationCodes.forEach((code, i) => stmt.bindVarchar(i + 2, code))
    const result = await stmt.run()
    const rows = (await result.getRowObjects()) as Array<Record<string, unknown>>
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
  ): Promise<Array<{ annee: number; total: number; avec_dep: number; sans_dep: number }>> {
    const conn = await getConnection()
    const sql = `
      WITH date_flags AS (
        SELECT
          date_prelevement,
          BOOL_OR(${SQL_DEP_ANY}) AS date_a_dep
        FROM read_parquet($1)
        WHERE code_installation = $2
          AND date_part('year', date_prelevement) BETWEEN $3 AND $4
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
    const stmt = await conn.prepare(sql)
    stmt.bindVarchar(1, getAnalysesRobinetPath())
    stmt.bindVarchar(2, installationCode)
    stmt.bindInteger(3, yearMin)
    stmt.bindInteger(4, yearMax)

    const result = await stmt.run()
    const rows = (await result.getRowObjects()) as Array<Record<string, unknown>>
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
  ): Promise<
    Array<{
      code_parametre: number
      libelle_parametre: string
      code_unite: string
      has_dep: boolean
    }>
  > {
    const conn = await getConnection()
    const sql = `
      SELECT
        CAST(code_parametre AS INTEGER) AS code_parametre,
        ANY_VALUE(libelle_parametre) AS libelle_parametre,
        ANY_VALUE(code_unite) AS code_unite,
        BOOL_OR(${SQL_DEP_ANY}) AS has_dep
      FROM read_parquet($1)
      WHERE code_installation = $2
        AND date_part('year', date_prelevement) BETWEEN $3 AND $4
        AND resultat_traduction IS NOT NULL
      GROUP BY code_parametre
      ORDER BY libelle_parametre
    `
    const stmt = await conn.prepare(sql)
    stmt.bindVarchar(1, getAnalysesRobinetPath())
    stmt.bindVarchar(2, installationCode)
    stmt.bindInteger(3, yearMin)
    stmt.bindInteger(4, yearMax)

    const result = await stmt.run()
    const rows = (await result.getRowObjects()) as Array<Record<string, unknown>>
    return rows.map((r) => ({
      code_parametre: Number(r.code_parametre),
      libelle_parametre: String(r.libelle_parametre),
      code_unite: String(r.code_unite ?? ''),
      has_dep: Boolean(r.has_dep),
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
  ): Promise<{
    info: {
      code_parametre: number
      libelle_parametre: string
      code_unite: string
      seuil_regl: number | null
      seuil_alerte: number | null
    }
    stats: {
      moyenne: number
      maximum: number
      nb_total: number
      nb_dep_regl: number
      frequence_dep_regl: number
    }
    series: Array<{ date: string; valeur: number; statut: 'conforme' | 'dep_alerte' | 'dep_regl' }>
  }> {
    const conn = await getConnection()

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
      FROM read_parquet($1)
      WHERE code_installation = $2
        AND CAST(code_parametre AS INTEGER) = $3
        AND date_part('year', date_prelevement) BETWEEN $4 AND $5
        AND resultat_traduction IS NOT NULL
    `

    const seriesSql = `
      SELECT
        CAST(date_prelevement AS VARCHAR) AS date,
        resultat_traduction AS valeur,
        ${SQL_STATUT_CASE} AS statut
      FROM read_parquet($1)
      WHERE code_installation = $2
        AND CAST(code_parametre AS INTEGER) = $3
        AND date_part('year', date_prelevement) BETWEEN $4 AND $5
        AND resultat_traduction IS NOT NULL
      ORDER BY date_prelevement
    `

    const [statsStmt, seriesStmt] = await Promise.all([
      conn.prepare(statsSql),
      conn.prepare(seriesSql),
    ])
    for (const stmt of [statsStmt, seriesStmt]) {
      stmt.bindVarchar(1, getAnalysesRobinetPath())
      stmt.bindVarchar(2, installationCode)
      stmt.bindInteger(3, codeParametre)
      stmt.bindInteger(4, yearMin)
      stmt.bindInteger(5, yearMax)
    }

    const [statsResult, seriesResult] = await Promise.all([statsStmt.run(), seriesStmt.run()])
    const statsRows = (await statsResult.getRowObjects()) as Array<Record<string, unknown>>
    const seriesRows = (await seriesResult.getRowObjects()) as Array<Record<string, unknown>>

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

    const conn = await getConnection()
    const path = getAnalysesRobinetPath()

    const placeholders = installationCodes.map((_, i) => `$${i + 2}`).join(', ')
    let paramIdx = installationCodes.length + 2
    let yearFilter = ''
    if (yearFrom !== undefined) {
      yearFilter += ` AND date_part('year', date_prelevement) >= $${paramIdx++}`
    }
    if (yearTo !== undefined) {
      yearFilter += ` AND date_part('year', date_prelevement) <= $${paramIdx++}`
    }

    const stmt = await conn.prepare(
      `SELECT COUNT(DISTINCT (code_installation, date_prelevement)) AS nb_analyses, COUNT(DISTINCT code_parametre) AS nb_parametres ` +
        `FROM read_parquet($1) WHERE code_installation IN (${placeholders}) AND date_prelevement IS NOT NULL${yearFilter}`
    )
    stmt.bindVarchar(1, path)
    let bindIdx = 2
    installationCodes.forEach((code) => stmt.bindVarchar(bindIdx++, code))
    if (yearFrom !== undefined) stmt.bindInteger(bindIdx++, yearFrom)
    if (yearTo !== undefined) stmt.bindInteger(bindIdx++, yearTo)

    const result = await stmt.run()
    const rows = (await result.getRowObjects()) as Array<Record<string, unknown>>
    const row = rows[0] ?? {}
    return {
      nb_analyses: Number(row.nb_analyses ?? 0),
      nb_parametres: Number(row.nb_parametres ?? 0),
    }
  }

  /**
   * Returns all AAC names ordered alphabetically.
   */
  async getAllNames() {
    const conn = await getConnection()
    const stmt = await conn.prepare('SELECT code, nom as name FROM read_parquet($1) ORDER BY nom')
    stmt.bindVarchar(1, getParquetPath())

    const result = await stmt.run()
    return (await result.getRowObjects()) as Array<{ code: string; name: string }>
  }
}
