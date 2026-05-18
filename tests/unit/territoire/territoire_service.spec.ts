import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { TerritoireService } from '#services/territoire_service'
import Territoire from '#models/territoire'

test.group('Territoire service', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('it creates a territoire from a name', async ({ assert }) => {
    const territoireService = new TerritoireService()

    const territoire = await territoireService.createTerritoire('  New territoire  ')
    const persistedTerritoire = await Territoire.findOrFail(territoire.id)

    assert.exists(territoire.id)
    assert.equal(persistedTerritoire.name, 'New territoire')
    assert.isNull(persistedTerritoire.code)
    assert.isNull(persistedTerritoire.parentTerritoireId)
  })

  test('it rejects an empty territoire name', async ({ assert }) => {
    const territoireService = new TerritoireService()

    await assert.rejects(
      () => territoireService.createTerritoire('   '),
      'Territoire name cannot be empty'
    )
  })
})
