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
   * Returns the min/max year range of analyses for the given installation codes.
   */
  async getAnalysesYearRange(
    installationCodes: string[]
  ): Promise<{ yearMin: number; yearMax: number }> {
    if (installationCodes.length === 0) return { yearMin: 0, yearMax: 0 }

    const conn = await getConnection()
    const path = getAnalysesRobinetPath()
    const placeholders = installationCodes.map((_, i) => `$${i + 2}`).join(', ')
    const stmt = await conn.prepare(
      `SELECT MIN(date_part('year', date_prelevement)) AS year_min,
              MAX(date_part('year', date_prelevement)) AS year_max
       FROM read_parquet($1)
       WHERE code_installation IN (${placeholders}) AND date_prelevement IS NOT NULL`
    )
    stmt.bindVarchar(1, path)
    installationCodes.forEach((code, i) => stmt.bindVarchar(i + 2, code))
    const result = await stmt.run()
    const rows = (await result.getRowObjects()) as Array<Record<string, unknown>>
    const row = rows[0] ?? {}
    return {
      yearMin: Number(row.year_min ?? 0),
      yearMax: Number(row.year_max ?? 0),
    }
  }

  /**
   * Groups analyses by (code_installation, date_prelevement) and classifies each
   * as conforme (C/D), non_conforme (N), or alerte (S/blank).
   */
  async getConformiteSummary(
    installationCodes: string[],
    yearFrom?: number,
    yearTo?: number
  ): Promise<{ conforme: number; alerte: number; non_conforme: number }> {
    if (installationCodes.length === 0) return { conforme: 0, alerte: 0, non_conforme: 0 }

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
      `WITH analyses AS (
         SELECT
           code_installation,
           date_prelevement,
           MAX(CASE WHEN conformite_bacterio = 'N' OR conformite_chimique = 'N' THEN 1 ELSE 0 END) AS has_non_conforme,
           MAX(CASE WHEN conformite_bacterio IN ('C','D') OR conformite_chimique IN ('C','D') THEN 1 ELSE 0 END) AS has_conforme
         FROM read_parquet($1)
         WHERE code_installation IN (${placeholders}) AND date_prelevement IS NOT NULL${yearFilter}
         GROUP BY code_installation, date_prelevement
       )
       SELECT
         SUM(CASE WHEN has_non_conforme = 1 THEN 1 ELSE 0 END) AS non_conforme,
         SUM(CASE WHEN has_non_conforme = 0 AND has_conforme = 1 THEN 1 ELSE 0 END) AS conforme,
         SUM(CASE WHEN has_non_conforme = 0 AND has_conforme = 0 THEN 1 ELSE 0 END) AS alerte
       FROM analyses`
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
      conforme: Number(row.conforme ?? 0),
      alerte: Number(row.alerte ?? 0),
      non_conforme: Number(row.non_conforme ?? 0),
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

  /*
   */
  async getAllNames() {
    const conn = await getConnection()
    const stmt = await conn.prepare('SELECT code, nom as name FROM read_parquet($1) ORDER BY nom')
    stmt.bindVarchar(1, getParquetPath())

    const result = await stmt.run()
    return (await result.getRowObjects()) as Array<{ code: string; name: string }>
  }
}
