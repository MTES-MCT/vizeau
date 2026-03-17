import logger from '@adonisjs/core/services/logger'

// Warm up DuckDB connection, S3 secret, and both query paths at server startup.
// Skipped in test/development to avoid slow/flaky external calls.
if (process.env.NODE_ENV === 'production') {
  import('#services/aac_service')
    .then(async ({ AacService }) => {
      const warmupService = new AacService()
      const { data } = await warmupService.getAll(1, 1)
      const code = data[0]?.code
      if (code) {
        return warmupService.getByCode(String(code))
      }
    })
    .catch((err) => logger.warn({ err }, 'AAC warmup failed'))
}
