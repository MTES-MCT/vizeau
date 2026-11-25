import { DuckDBInstance, type DuckDBConnection } from '@duckdb/node-api'
import { LRUCache } from 'lru-cache'
import pLimit from 'p-limit'
import env from '#start/env'
import { createAacS3Secret, HTTP_TIMEOUT_SECONDS } from '#services/duckdb_service'

// Les recherches ne lisent que quelques groupes de lignes
const MEMORY_LIMIT = '256MB'
// Recherches simultanées dans le millésime par défaut
const DEFAULT_MILLESIME_CONCURRENCY = 3
// Durée de vie de l'instance d'un autre millésime après sa dernière recherche
const OTHER_MILLESIME_TTL_MS = 10 * 60 * 1000

/**
 * Lecture des Parquet privés du RPG, `{RPG_PARQUET_URL}/{millésime}/{fichier}`, à part de la
 * DuckDB des AAC.
 *
 * Une instance DuckDB garde en mémoire le pied de chaque fichier lu, pour ne pas le relire à
 * chaque requête. Celui d'un `parcelles.parquet` national décrit des milliers de groupes de
 * lignes et occupe près de 200 Mo une fois chargé : on ne peut pas tous les garder. Donc :
 * - le millésime par défaut a son instance, gardée tant que le serveur tourne ;
 * - les autres millésimes se partagent une seule instance, fermée au bout de 10 minutes sans
 *   recherche, ou dès qu'un autre millésime est demandé. La fermer rend sa mémoire.
 */
export class RpgDuckdbService {
  private static defaultInstance: Promise<DuckDBInstance> | null = null
  private static defaultLimit = pLimit(DEFAULT_MILLESIME_CONCURRENCY)

  // Une recherche à la fois dans les autres millésimes : une instance n'est jamais fermée pendant
  // qu'une requête l'utilise, et l'ancienne est fermée avant que la nouvelle ne charge un pied.
  private static otherLimit = pLimit(1)
  private static others = new LRUCache<number, DuckDBInstance>({
    max: 1,
    ttl: OTHER_MILLESIME_TTL_MS,
    updateAgeOnGet: true,
    ttlAutopurge: true,
    // Instance remplacée ou expirée. Une instance en cours d'utilisation ne peut pas expirer :
    // la recherche l'a lue avec get(), qui a relancé ses 10 minutes.
    dispose: (instance) => instance.closeSync(),
  })

  /** URL d'un fichier du millésime, par exemple `parcelles.parquet`. */
  fileUrl(millesime: number, file: string) {
    return `${this.baseUrl().replace(/\/$/, '')}/${millesime}/${file}`
  }

  protected baseUrl() {
    const base = env.get('RPG_PARQUET_URL')
    if (!base) throw new Error('RPG_PARQUET_URL n’est pas défini')
    return base
  }

  protected defaultMillesime() {
    return Number(env.get('RPG_DEFAULT_MILLESIME'))
  }

  /** Exécute `task` sur une connexion à l'instance du millésime. */
  async withMillesime<T>(millesime: number, task: (connection: DuckDBConnection) => Promise<T>) {
    if (millesime === this.defaultMillesime()) {
      return RpgDuckdbService.defaultLimit(async () => {
        RpgDuckdbService.defaultInstance ??= this.createInstance().catch((error) => {
          RpgDuckdbService.defaultInstance = null
          throw error
        })
        return this.runOn(await RpgDuckdbService.defaultInstance, task)
      })
    }

    return RpgDuckdbService.otherLimit(async () => {
      let instance = RpgDuckdbService.others.get(millesime)
      if (!instance) {
        // Créer une instance ne lit rien : le pied n'est chargé qu'à la première requête, une
        // fois l'ancienne instance fermée par set()
        instance = await this.createInstance()
        RpgDuckdbService.others.set(millesime, instance)
      }
      return this.runOn(instance, task)
    })
  }

  /** Ferme toutes les instances (tests). */
  static closeAll() {
    RpgDuckdbService.others.clear()
    const defaultInstance = RpgDuckdbService.defaultInstance
    RpgDuckdbService.defaultInstance = null
    return defaultInstance?.then((instance) => instance.closeSync()).catch(() => {})
  }

  private async runOn<T>(
    instance: DuckDBInstance,
    task: (connection: DuckDBConnection) => Promise<T>
  ) {
    const connection = await instance.connect()
    try {
      return await task(connection)
    } finally {
      connection.closeSync()
    }
  }

  private async createInstance() {
    const instance = await DuckDBInstance.create(':memory:', { memory_limit: MEMORY_LIMIT })
    let connection: DuckDBConnection | undefined
    try {
      connection = await instance.connect()
      if (this.baseUrl().startsWith('s3://')) {
        await connection.run('INSTALL httpfs; LOAD httpfs;')
        // Comme pour les AAC : une lecture bloquée côté S3 est relancée au bout de quelques
        // secondes, au lieu d'immobiliser la requête par tranches de 30 s
        await connection.run(`SET GLOBAL http_timeout = ${HTTP_TIMEOUT_SECONDS}`)
        await connection.run('SET GLOBAL enable_http_metadata_cache = true')
        await createAacS3Secret(connection)
      }
      await connection.run('SET GLOBAL parquet_metadata_cache = true')
      connection.closeSync()
      return instance
    } catch (error) {
      connection?.closeSync()
      instance.closeSync()
      throw error
    }
  }
}
