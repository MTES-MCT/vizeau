import {
  DuckDBInstance,
  listValue,
  type DuckDBConnection,
  type DuckDBValue,
} from '@duckdb/node-api'
import { inject } from '@adonisjs/core'
import env from '#start/env'

type DuckdbParameters = Record<string, DuckDBValue>

function sqlEscape(value: string): string {
  return value.replace(/'/g, "''")
}

function normalizeValue(value: unknown): unknown {
  if (value === null || value === undefined) return value
  if (typeof value === 'bigint') return Number(value)
  if (Array.isArray(value)) return value.map(normalizeValue)

  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>

    if ('days' in obj && (typeof obj.days === 'number' || typeof obj.days === 'bigint')) {
      return new Date(Number(obj.days) * 86400000).toISOString().slice(0, 10)
    }

    if ('items' in obj && Array.isArray(obj.items)) {
      return (obj.items as unknown[]).map(normalizeValue)
    }

    if ('entries' in obj) {
      const entries = obj.entries
      if (Array.isArray(entries)) {
        return Object.fromEntries(
          (entries as Array<{ key: unknown; value: unknown }>).map(({ key, value: entryValue }) => [
            String(normalizeValue(key)),
            normalizeValue(entryValue),
          ])
        )
      }

      if (entries !== null && typeof entries === 'object') {
        return Object.fromEntries(
          Object.entries(entries as Record<string, unknown>).map(([key, entryValue]) => [
            key,
            normalizeValue(entryValue),
          ])
        )
      }
    }

    return Object.fromEntries(
      Object.entries(obj).map(([key, entryValue]) => [key, normalizeValue(entryValue)])
    )
  }

  return value
}

@inject()
export class DuckdbService {
  private static connectionPromise: Promise<DuckDBConnection> | null = null

  private async getConnection(): Promise<DuckDBConnection> {
    if (DuckdbService.connectionPromise) return DuckdbService.connectionPromise

    DuckdbService.connectionPromise = (async () => {
      try {
        const instance = await DuckDBInstance.create(':memory:')
        const connection = await instance.connect()

        if (env.get('DUCKDB_DEBUG') === true) {
          await connection.run("CALL enable_logging(storage = 'stdout');")
        }

        await connection.run('INSTALL httpfs;')
        await connection.run('LOAD httpfs;')
        await connection.run(`
          CREATE SECRET aac_s3_secret (
            TYPE S3,
            KEY_ID '${sqlEscape(env.get('S3_ACCESS_KEY'))}',
            SECRET '${sqlEscape(env.get('S3_SECRET_KEY'))}',
            REGION '${sqlEscape(env.get('S3_REGION'))}',
            ENDPOINT '${sqlEscape(env.get('S3_ENDPOINT'))}',
            URL_STYLE 'path'
          );
        `)

        return connection
      } catch (error) {
        DuckdbService.connectionPromise = null
        throw error
      }
    })()

    return DuckdbService.connectionPromise
  }

  list(values: readonly DuckDBValue[]) {
    return listValue(values)
  }

  async query<T extends Record<string, unknown>>(
    sql: string,
    parameters?: DuckdbParameters
  ): Promise<T[]> {
    const connection = await this.getConnection()
    const result = await connection.run(sql, parameters)
    const rows = await result.getRowObjects()

    return rows.map((row) => normalizeValue(row) as T)
  }
}
