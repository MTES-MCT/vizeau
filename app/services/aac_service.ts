import { DuckDBInstance, DuckDBConnection } from '@duckdb/node-api'
import env from '#start/env'

/*
 * Singleton DuckDB connection instance.
 * Initialized on first use by getConnection(), which also sets up the S3 secret.
 * The connection is reused for all queries to avoid overhead of reconnecting.
 */
let connection: DuckDBConnection | null = null

async function getConnection(): Promise<DuckDBConnection> {
  if (connection) return connection

  const instance = await DuckDBInstance.create(':memory:')
  connection = await instance.connect()

  try {
    await connection.run('LOAD httpfs;')
    await connection.run(`
      CREATE SECRET aac_s3_secret (
        TYPE S3,
        KEY_ID '${env.get('S3_ACCESS_KEY')}',
        SECRET '${env.get('S3_SECRET_KEY')}',
        REGION '${env.get('S3_REGION')}',
        ENDPOINT '${env.get('S3_ENDPOINT')}',
        URL_STYLE 'path'
      );
    `)
  } catch (err) {
    connection = null
    throw err
  }

  return connection
}

function getParquetPath(): string {
  return `s3://${env.get('S3_BUCKET')}/aac.parquet`
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
    commune?: string
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
        "array_to_string(map_keys(communes.communes), '|') ILIKE '%' || $" + paramIdx++ + " || '%'"
      )
      filterParams.push(commune)
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
      'SELECT code, nom, surface, nb_captages_actifs, communes.nb_communes ' +
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
}
