import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { TerritoireService } from '#services/territoire_service'
import Territoire from '#models/territoire'
import { TerritoireFactory } from '#database/factories/territoire_factory'
import { UserFactory } from '#database/factories/user_factory'

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
    assert.isTrue(persistedTerritoire.isActive)
  })

  test('it rejects an empty territoire name', async ({ assert }) => {
    const territoireService = new TerritoireService()

    await assert.rejects(
      () => territoireService.createTerritoire('   '),
      'Territoire name cannot be empty'
    )
  })

  test('it detects an inactive territoire among the given ids', async ({ assert }) => {
    const territoireService = new TerritoireService()
    const activeTerritoire = await TerritoireFactory.create()
    const inactiveTerritoire = await TerritoireFactory.apply('inactive').create()

    assert.isTrue(
      await territoireService.hasInactiveTerritoires([activeTerritoire.id, inactiveTerritoire.id])
    )
  })

  test('it returns false when all the given territoires are active', async ({ assert }) => {
    const territoireService = new TerritoireService()
    const territoires = await TerritoireFactory.createMany(2)

    assert.isFalse(await territoireService.hasInactiveTerritoires(territoires.map((t) => t.id)))
  })

  test('it returns false for an empty list of territoires', async ({ assert }) => {
    const territoireService = new TerritoireService()

    assert.isFalse(await territoireService.hasInactiveTerritoires([]))
  })

  test('it excludes inactive territoires from the territoires of a user by default', async ({
    assert,
  }) => {
    const territoireService = new TerritoireService()
    const activeTerritoire = await TerritoireFactory.create()
    const inactiveTerritoire = await TerritoireFactory.apply('inactive').create()
    const user = await UserFactory.create()
    await user.related('territoires').attach([activeTerritoire.id, inactiveTerritoire.id])

    const paginatedTerritoires = await territoireService.getTerritoiresForUser(user.id)
    const allTerritoires = await territoireService.getAllTerritoiresForUser(user.id)

    assert.deepEqual(
      paginatedTerritoires.all().map((t) => t.id),
      [activeTerritoire.id]
    )
    assert.deepEqual(
      allTerritoires.map((t) => t.id),
      [activeTerritoire.id]
    )
  })

  test('it includes inactive territoires when asked to', async ({ assert }) => {
    const territoireService = new TerritoireService()
    const activeTerritoire = await TerritoireFactory.create()
    const inactiveTerritoire = await TerritoireFactory.apply('inactive').create()
    const user = await UserFactory.create()
    await user.related('territoires').attach([activeTerritoire.id, inactiveTerritoire.id])

    const paginatedTerritoires = await territoireService.getTerritoiresForUser(user.id, 1, 20, {
      includeInactive: true,
    })
    const allTerritoires = await territoireService.getAllTerritoiresForUser(user.id, {
      includeInactive: true,
    })

    assert.sameMembers(
      paginatedTerritoires.all().map((t) => t.id),
      [activeTerritoire.id, inactiveTerritoire.id]
    )
    assert.sameMembers(
      allTerritoires.map((t) => t.id),
      [activeTerritoire.id, inactiveTerritoire.id]
    )
  })
})
