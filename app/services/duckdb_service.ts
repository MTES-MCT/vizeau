import {
  DuckDBInstance,
  listValue,
  type DuckDBConnection,
  type DuckDBValue,
} from '@duckdb/node-api'
import { inject } from '@adonisjs/core'
import drive from '@adonisjs/drive/services/main'
import type { S3Driver } from 'flydrive/drivers/s3'
import logger from '@adonisjs/core/services/logger'
import env from '#start/env'

export function getAacFilesS3Driver(): S3Driver {
  return drive.use('aacFilesS3').driver as S3Driver
}

type DuckdbParameters = Record<string, DuckDBValue>

const MB = 1024 * 1024

function toMb(bytes: number | bigint): number {
  return Math.round(Number(bytes) / MB)
}

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
        // Par défaut, DuckDB s'accorde 80 % de la mémoire du conteneur, ce qui laisse trop peu de
        // place à Node dans la limite de 500 Mo. Les fichiers AAC sont assez petits pour cette valeur.
        const instance = await DuckDBInstance.create(':memory:', { memory_limit: '150MB' })
        const connection = await instance.connect()

        if (env.get('DUCKDB_DEBUG') === true) {
          await connection.run("CALL enable_logging(storage = 'stdout');")
        }

        await connection.run('INSTALL httpfs;')
        await connection.run('LOAD httpfs;')

        // Keep HTTP metadata (HEAD) and Parquet footers in memory across queries, so they are not
        // fetched from S3 again on every call. These caches do not detect a file being replaced
        // on S3: restart the application after a data update.
        await connection.run('SET enable_http_metadata_cache = true;')
        await connection.run('SET parquet_metadata_cache = true;')

        // Copy the AAC S3 connection information as a DuckDB Secret.
        // DuckDB's S3 secret expects a bare host for ENDPOINT (no protocol) and
        // controls HTTPS separately via USE_SSL, unlike the AWS SDK / Drive
        // endpoint below, which is a full URL. Derive both from the same source.
        const { region, endpoint, credentials } = getAacFilesS3Driver().options as {
          region: string
          endpoint: string
          credentials: { accessKeyId: string; secretAccessKey: string }
        }
        const { accessKeyId, secretAccessKey } = credentials
        const endpointUrl = new URL(endpoint)
        await connection.run(`
          CREATE SECRET aac_s3_secret (
            TYPE S3,
            KEY_ID '${sqlEscape(accessKeyId)}',
            SECRET '${sqlEscape(secretAccessKey)}',
            REGION '${sqlEscape(region)}',
            ENDPOINT '${sqlEscape(endpointUrl.host)}',
            USE_SSL ${endpointUrl.protocol === 'https:'},
            URL_STYLE 'path'
          );
        `)

        if (env.get('DUCKDB_MEM_DEBUG') === true) {
          const settingsResult = await connection.run(
            "SELECT current_setting('memory_limit') AS memory_limit, current_setting('threads') AS threads"
          )
          const [settings] = await settingsResult.getRowObjects()
          logger.info({ settings: normalizeValue(settings) }, 'DuckDB settings')
        }

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
    const debug = env.get('DUCKDB_MEM_DEBUG') === true
    const startedAt = performance.now()

    if (debug) await this.logMemory(connection, 'before query', sql)

    const result = await connection.run(sql, parameters)
    const rows = await result.getRowObjects()

    if (debug) {
      await this.logMemory(connection, 'after query', sql, {
        rowCount: rows.length,
        durationMs: Math.round(performance.now() - startedAt),
      })
    }

    return rows.map((row) => normalizeValue(row) as T)
  }

  /**
   * Logs the memory held by DuckDB's buffer manager (hash tables, materialized CTEs, file cache),
   * along with the memory of the whole Node process (RSS), which also includes what DuckDB
   * allocates outside its buffer manager.
   */
  private async logMemory(
    connection: DuckDBConnection,
    step: string,
    sql: string,
    extra: Record<string, unknown> = {}
  ) {
    const duckdbResult = await connection.run(
      'SELECT tag, memory_usage_bytes, temporary_storage_bytes FROM duckdb_memory() ' +
        'WHERE memory_usage_bytes > 0 OR temporary_storage_bytes > 0'
    )
    const duckdbRows = await duckdbResult.getRowObjects()
    const duckdbByTag = Object.fromEntries(
      duckdbRows.map((row) => [String(row.tag), toMb(row.memory_usage_bytes as bigint)])
    )
    const duckdbTotalBytes = duckdbRows.reduce(
      (total, row) => total + Number(row.memory_usage_bytes),
      0
    )
    const duckdbTemporaryBytes = duckdbRows.reduce(
      (total, row) => total + Number(row.temporary_storage_bytes),
      0
    )

    // Mémoire de tout le process, y compris ce que DuckDB alloue hors de son buffer manager
    const { rss, heapUsed, external } = process.memoryUsage()

    logger.info(
      {
        step,
        sql: sql.replace(/\s+/g, ' ').trim().slice(0, 200),
        memoryMb: {
          rss: toMb(rss),
          nodeHeap: toMb(heapUsed),
          nodeExternal: toMb(external),
          duckdb: toMb(duckdbTotalBytes),
          duckdbTemporary: toMb(duckdbTemporaryBytes),
        },
        duckdbByTagMb: duckdbByTag,
        ...extra,
      },
      'DuckDB memory'
    )
  }
}
