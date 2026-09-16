import env from '#start/env'
import { defineConfig, services } from '@adonisjs/drive'

const driveConfig = defineConfig({
  default: env.get('DRIVE_DISK'),

  /**
   * The services object can be used to configure multiple file system
   * services each using the same or a different driver.
   */
  services: {
    userUploadsS3: services.s3({
      credentials: {
        accessKeyId: env.get('USER_UPLOADS_S3_ACCESS_KEY'),
        secretAccessKey: env.get('USER_UPLOADS_S3_SECRET_KEY'),
      },
      region: env.get('USER_UPLOADS_S3_REGION'),
      bucket: env.get('USER_UPLOADS_S3_BUCKET'),
      endpoint: env.get('USER_UPLOADS_S3_ENDPOINT'),
      visibility: 'private',
    }),
    // We don't use this bucket with drive at this moment, only through DuckDB,
    // But this way the configuration is centralized somewhere
    aacFilesS3: services.s3({
      credentials: {
        accessKeyId: env.get('AAC_FILES_S3_ACCESS_KEY'),
        secretAccessKey: env.get('AAC_FILES_S3_SECRET_KEY'),
      },
      region: env.get('AAC_FILES_S3_REGION'),
      bucket: env.get('AAC_FILES_S3_BUCKET'),
      endpoint: env.get('AAC_FILES_S3_ENDPOINT'),
      visibility: 'private',
    }),
  },
})

export default driveConfig

declare module '@adonisjs/drive/types' {
  export interface DriveDisks extends InferDriveDisks<typeof driveConfig> {}
}
