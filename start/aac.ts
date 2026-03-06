import logger from '@adonisjs/core/services/logger'
import { AacService } from '#services/aac_service'

// Warm up DuckDB connection, S3 secret, and both query paths at server startup.
// Skipped in test/development to avoid slow/flaky external calls.
if (process.env.NODE_ENV === 'production') {
  const warmupService = new AacService()
  warmupService
    .getAll(1, 1)
    .then(({ data }) => {
      const code = data[0]?.code
      if (code) return warmupService.getByCode(String(code))
    })
    .catch((err) => logger.warn({ err }, 'AAC warmup failed'))
}
