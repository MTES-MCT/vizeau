import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import app from '@adonisjs/core/services/app'
import { UserFactory } from '#database/factories/user_factory'
import { AacService } from '#services/aac_service'

/** Simule une source AAC injoignable : toutes les requêtes DuckDB/S3 échouent. */
function createFailingAacService(): AacService {
  const fail = async () => {
    throw new Error('Failed to execute prepared statement')
  }

  return {
    getSummariesByCode: fail,
    getConformiteStatsByAacCodes: fail,
    getSubstancesAlertesRepartition: fail,
    getCaptagesAlertesByAacCodes: fail,
  } as unknown as AacService
}

test.group('Accueil - Index Route', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('the home page stays available when the AAC data source is down', async ({ client }) => {
    const user = await UserFactory.with('territoires', 1).create()

    app.container.swap(AacService, () => createFailingAacService())

    try {
      const response = await client.get('/').loginAs(user)

      response.assertStatus(200)
    } finally {
      app.container.restore(AacService)
    }
  })
})
