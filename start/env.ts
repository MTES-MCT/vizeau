/*
|--------------------------------------------------------------------------
| Environment variables service
|--------------------------------------------------------------------------
|
| The `Env.create` method creates an instance of the Env service. The
| service validates the environment variables and also cast values
| to JavaScript data types.
|
*/

import { Env } from '@adonisjs/core/env'

// Millésimes du RPG séparés par des virgules, rendus du plus récent au plus ancien
function parseRpgMillesimes(key: string, value?: string): string[] {
  const millesimes = [...new Set((value ?? '').split(',').map((millesime) => millesime.trim()))]
  if (millesimes.some((millesime) => !/^\d{4}$/.test(millesime))) {
    throw new Error(
      `"${key}" doit lister des années séparées par des virgules, par exemple 2024,2023`
    )
  }
  return millesimes.sort().reverse()
}

export default await Env.create(new URL('../', import.meta.url), {
  NODE_ENV: Env.schema.enum(['development', 'production', 'test'] as const),
  PORT: Env.schema.number(),
  APP_KEY: Env.schema.string(),
  HOST: Env.schema.string({ format: 'host' }),
  LOG_LEVEL: Env.schema.string(),

  /*
  |----------------------------------------------------------
  | Variables for configuring session package
  |----------------------------------------------------------
  */
  SESSION_DRIVER: Env.schema.enum(['cookie', 'memory'] as const),

  /*
  |----------------------------------------------------------
  | Variables for configuring database connection
  |----------------------------------------------------------
  */
  DB_HOST: Env.schema.string({ format: 'host' }),
  DB_PORT: Env.schema.number(),
  DB_USER: Env.schema.string(),
  DB_PASSWORD: Env.schema.string.optional(),
  DB_DATABASE: Env.schema.string(),

  /*
  |----------------------------------------------------------
  | Variables for admin account creation
  |----------------------------------------------------------
   */
  ADMIN_EMAIL: Env.schema.string({ format: 'email' }),
  ADMIN_PASSWORD: Env.schema.string(),

  /*
  |----------------------------------------------------------
  | Variables for external services
  |----------------------------------------------------------
   */
  // If set, enables the integration with the PMTiles server for map tile hosting
  PMTILES_URL: Env.schema.string.optional({ format: 'url' }),
  // URL de base des tuiles du RPG : un fichier par millésime, {RPG_PMTILES_URL}/{millésime}/rpg.pmtiles
  RPG_PMTILES_URL: Env.schema.string.optional({ format: 'url' }),
  // Millésimes du RPG proposés par les cartes, et celui qu'elles affichent par défaut
  RPG_MILLESIMES: parseRpgMillesimes,
  RPG_DEFAULT_MILLESIME: (key: string, value?: string) => {
    // Les fichiers .env sont déjà chargés dans process.env quand les variables sont validées
    const millesimes = parseRpgMillesimes('RPG_MILLESIMES', process.env.RPG_MILLESIMES)
    if (!value || !millesimes.includes(value)) {
      throw new Error(`"${key}" doit être l'un des millésimes de RPG_MILLESIMES`)
    }
    return value
  },

  // Set when running db:seed, never in the .env file: preview the changes without writing
  DRY_RUN: Env.schema.boolean.optional(),

  /*
  |----------------------------------------------------------
  | Variables for configuring the drive package
  |----------------------------------------------------------
  */
  DRIVE_DISK: Env.schema.enum(['userUploadsS3', 'spaces'] as const),
  USER_UPLOADS_S3_ACCESS_KEY: Env.schema.string(),
  USER_UPLOADS_S3_SECRET_KEY: Env.schema.string(),
  USER_UPLOADS_S3_REGION: Env.schema.string(),
  USER_UPLOADS_S3_BUCKET: Env.schema.string(),
  USER_UPLOADS_S3_ENDPOINT: Env.schema.string(),

  /*
  |----------------------------------------------------------
  | Variables for configuring the AAC parquet file
  |----------------------------------------------------------
  */
  AAC_FILES_S3_ACCESS_KEY: Env.schema.string(),
  AAC_FILES_S3_SECRET_KEY: Env.schema.string(),
  AAC_FILES_S3_REGION: Env.schema.string(),
  AAC_FILES_S3_BUCKET: Env.schema.string(),
  AAC_FILES_S3_ENDPOINT: Env.schema.string(),

  // If true, DuckDB will write logs in the standard output
  DUCKDB_DEBUG: Env.schema.boolean.optional(),

  // If true, logs DuckDB memory usage around each DuckDB query
  DUCKDB_MEM_DEBUG: Env.schema.boolean.optional(),

  // Maximum number of DuckDB queries running at the same time (3 if not set)
  DUCKDB_MAX_CONCURRENT_QUERIES: Env.schema.number.optional(),

  /*
  |----------------------------------------------------------
  | Variables for configuring the limiter package
  |----------------------------------------------------------
  */
  // Defaults to database, memory is used by the tests
  LIMITER_STORE: Env.schema.enum.optional(['database', 'memory'] as const),
})
