import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { inertiaApiClient } from '@adonisjs/inertia/plugins/api_client'
import app from '@adonisjs/core/services/app'
import { UserFactory } from '#database/factories/user_factory'
import { TerritoireFactory } from '#database/factories/territoire_factory'
import { AacService } from '#services/aac_service'

function createMockAacService(getAllSpy: (...args: unknown[]) => void): AacService {
  return {
    async getAll(...args: unknown[]) {
      getAllSpy(...args)
      return { data: [], total: 0 }
    },
  } as unknown as AacService
}

test.group('Aac - Index Route', (group) => {
  group.setup(async () => {
    await (inertiaApiClient(app) as () => Promise<void>)()
  })
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('dépassement filters default to false and are echoed back in the query string', async ({
    assert,
    client,
    route,
  }) => {
    const user = await UserFactory.create()
    const territoire = await TerritoireFactory.create()
    await user.related('territoires').attach([territoire.id])

    const calls: unknown[][] = []
    app.container.swap(AacService, () => createMockAacService((...args) => calls.push(args)))

    const response = await client
      .get(route('aac.index'))
      .loginAs(user)
      .withInertiaPartialReload('aac/index', ['aacs', 'meta', 'queryString'])

    app.container.restore(AacService)

    response.assertStatus(200)
    const responseBody = response.body()
    assert.equal(responseBody.component, 'aac/index')
    assert.equal(responseBody.props.queryString.aacDepassementsReglementaires, 'false')
    assert.equal(responseBody.props.queryString.aacDepassementsAlerte, 'false')
    assert.equal(calls[0][5], false)
    assert.equal(calls[0][6], false)
  })

  test('dépassement filters are parsed from the query string and forwarded to the service', async ({
    assert,
    client,
    route,
  }) => {
    const user = await UserFactory.create()
    const territoire = await TerritoireFactory.create()
    await user.related('territoires').attach([territoire.id])

    const calls: unknown[][] = []
    app.container.swap(AacService, () => createMockAacService((...args) => calls.push(args)))

    const response = await client
      .get(
        route(
          'aac.index',
          {},
          { qs: { aacDepassementsReglementaires: 'true', aacDepassementsAlerte: 'true' } }
        )
      )
      .loginAs(user)
      .withInertiaPartialReload('aac/index', ['aacs', 'meta', 'queryString'])

    app.container.restore(AacService)

    response.assertStatus(200)
    const responseBody = response.body()
    assert.equal(responseBody.props.queryString.aacDepassementsReglementaires, 'true')
    assert.equal(responseBody.props.queryString.aacDepassementsAlerte, 'true')
    assert.equal(calls[0][5], true)
    assert.equal(calls[0][6], true)
  })

  test('aacs and meta are deferred and resolved with a single query', async ({
    assert,
    client,
    route,
  }) => {
    const user = await UserFactory.create()
    const territoire = await TerritoireFactory.create()
    await user.related('territoires').attach([territoire.id])

    const calls: unknown[][] = []
    app.container.swap(AacService, () => createMockAacService((...args) => calls.push(args)))

    const initial = await client.get(route('aac.index')).loginAs(user).withInertia()

    assert.notProperty(initial.body().props, 'aacs')
    assert.notProperty(initial.body().props, 'meta')
    assert.sameMembers(initial.body().deferredProps.default, ['aacs', 'meta'])
    assert.lengthOf(calls, 0)

    const reload = await client
      .get(route('aac.index'))
      .loginAs(user)
      .withInertiaPartialReload('aac/index', ['aacs', 'meta'])

    app.container.restore(AacService)

    reload.assertStatus(200)
    assert.deepEqual(reload.body().props.aacs, [])
    assert.equal(reload.body().props.meta.lastPage, 1)
    assert.lengthOf(calls, 1)
  })
})
