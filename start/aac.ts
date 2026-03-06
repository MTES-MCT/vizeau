import { AacService } from '#services/aac_service'

// Warm up DuckDB connection, S3 secret, and both query paths at server startup
const warmupService = new AacService()
warmupService
  .getAll(1, 1)
  .then(({ data }) => {
    const code = data[0]?.code
    if (code) return warmupService.getByCode(String(code))
  })
  .catch(() => {})
