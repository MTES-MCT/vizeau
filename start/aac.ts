import logger from '@adonisjs/core/services/logger'
import { DuckdbService } from '#services/duckdb_service'
import { AacService } from '#services/aac_service'
import Env from '#start/env'

// Préchauffe DuckDB au démarrage du serveur : création de l'instance (httpfs, secret S3,
// réglages), puis mise en cache des métadonnées et des données lues sur S3 pour les trois
// fichiers Parquet. Sans cela, la première requête de chaque fichier prend plusieurs secondes.
// Limité à la production pour éviter des appels lents ou instables à S3 en test et en développement.
// Volontairement non attendu : le serveur HTTP doit écouter sans attendre S3, sinon un warmup
// lent dépasse le délai de démarrage de 60 s de Scalingo. Les requêtes reçues entre-temps
// utilisent la même instance DuckDB et attendent leur tour si la limite de requêtes simultanées
// (DUCKDB_MAX_CONCURRENT_QUERIES) est atteinte.
if (Env.get('NODE_ENV') === 'production') {
  logger.info('AAC warmup starting')
  void (async () => {
    try {
      const duckdbService = new DuckdbService()
      const aacService = new AacService(duckdbService)

      // Lit tout aac.parquet (tri et comptage sur l'ensemble du fichier) : il est ensuite en cache
      const { data } = await aacService.getAll(1, 1)
      logger.info('AAC warmup: aac.parquet en cache')

      // Lit tout analyses_robinet_par_date.parquet (environ 600 Ko) : il est ensuite en cache
      await aacService.preloadAnalysesParDate()
      logger.info('AAC warmup: analyses_robinet_par_date.parquet en cache')

      // Récupère le footer d'analyses_robinet.parquet en ne lisant que les analyses des
      // installations d'une seule AAC
      const code = data[0]?.code
      const installationCodes = code
        ? await aacService.getInstallationCodesByAacCode(String(code))
        : null
      if (installationCodes?.length) {
        await aacService.getAnalysesSummary(installationCodes)
        logger.info('AAC warmup: métadonnées de analyses_robinet.parquet en cache')
      } else {
        logger.warn(
          'AAC warmup: aucune installation trouvée, analyses_robinet.parquet non préchauffé'
        )
      }

      logger.info('AAC warmup completed')
    } catch (err) {
      logger.warn({ err }, 'AAC warmup failed')
    }
  })()
}
