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

  // If set, the string will be parsed as JSON and the content will be injected as users
  USERS_TO_SEED: Env.schema.string.optional(),

  /*
  |----------------------------------------------------------
  | Variables for configuring the drive package
  |----------------------------------------------------------
  */
  DRIVE_DISK: Env.schema.enum(['spaces'] as const),
  SPACES_KEY: Env.schema.string(),
  SPACES_SECRET: Env.schema.string(),
  SPACES_REGION: Env.schema.string(),
  SPACES_BUCKET: Env.schema.string(),
  SPACES_ENDPOINT: Env.schema.string(),

  /*
  |----------------------------------------------------------
  | Variables for configuring the AAC parquet file
  |----------------------------------------------------------
  */
  S3_ACCESS_KEY: Env.schema.string(),
  S3_SECRET_KEY: Env.schema.string(),
  S3_REGION: Env.schema.string(),
  S3_BUCKET: Env.schema.string(),
  S3_ENDPOINT: Env.schema.string(),

  /*
  |----------------------------------------------------------
  | Variables pour l'intégration ProConnect (OIDC)
  |----------------------------------------------------------
  */
  PROCONNECT_DOMAIN: Env.schema.string.optional(),
  PROCONNECT_CLIENT_ID: Env.schema.string.optional(),
  PROCONNECT_CLIENT_SECRET: Env.schema.string.optional(),
  PROCONNECT_CALLBACK_URL: Env.schema.string.optional(),
  PROCONNECT_POST_LOGOUT_REDIRECT_URI: Env.schema.string.optional(),
})
