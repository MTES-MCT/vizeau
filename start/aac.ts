import logger from '@adonisjs/core/services/logger'
import { DuckdbService } from '#services/duckdb_service'
import { AacService } from '#services/aac_service'
import Env from '#start/env'

// Warm up DuckDB connection, S3 secret, and both query paths at server startup.
// Skipped in test/development to avoid slow/flaky external calls.
// Volontairement non attendu : le serveur HTTP doit écouter sans attendre S3, sinon un warmup
// lent dépasse le délai de démarrage de 60 s de Scalingo. Les requêtes reçues entre-temps
// partagent la même connexion DuckDB.
if (Env.get('NODE_ENV') === 'production') {
  logger.info('AAC warmup starting')
  void (async () => {
    try {
      const duckdbService = new DuckdbService()
      const aacService = new AacService(duckdbService)
      const { data } = await aacService.getAll(1, 1)
      logger.info('AAC warmup: fetched data to populate duckdb service')
      const code = data[0]?.code
      if (code) {
        // Runs a dummy query to warm up the AAC service and DuckDB connection.
        await aacService.getByCode(String(code))
        logger.info('AAC warmup: dummy query works')
      }
      logger.info('AAC warmup completed')
    } catch (err) {
      logger.warn({ err }, 'AAC warmup failed')
    }
  })()
}
