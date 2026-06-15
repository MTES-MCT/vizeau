import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { UserFactory } from '#database/factories/user_factory'
import { TerritoireFactory } from '#database/factories/territoire_factory'
import { inertiaApiClient } from '@adonisjs/inertia/plugins/api_client'
import app from '@adonisjs/core/services/app'
import { AacService } from '#services/aac_service'

function createMockAacService(): AacService {
  return {
    async getAll(
      _page: number,
      _perPage: number,
      _recherche?: string,
      _commune?: string,
      aacCodes?: string[]
    ) {
      const codes = aacCodes ?? []

      return {
        data: codes.map((code) => ({
          code,
          nom: `AAC ${code}`,
          surface: code === '12345' ? 150.5 : 0,
          nb_captages_actifs: code === '12345' ? 3 : 0,
          communes:
            code === '12345' ? { nb_communes: 2, communes: {} } : { nb_communes: 0, communes: {} },
          date_maj: '2024-01-01',
          date_creation: '2020-01-01',
          bbox: null,
          nb_parcelles: 0,
          surface_agricole_bio: null,
          surface_agricole_ppe: null,
          surface_agricole_ppr: null,
          surface_agricole_utile: null,
        })),
        total: codes.length,
      }
    },
  } as unknown as AacService
}

test.group('Territoires - Index Route', (group) => {
  group.setup(async () => {
    await (inertiaApiClient(app) as () => Promise<void>)()
  })
  group.each.setup(() => {
    app.container.swap(AacService, () => createMockAacService())
    return () => app.container.restore(AacService)
  })
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('user can list all territoires associated to their account', async ({
    assert,
    client,
    route,
  }) => {
    const user = await UserFactory.create()
    const aacTerritoire = await TerritoireFactory.merge({ code: '12345' }).create()
    const nonAacTerritoire = await TerritoireFactory.apply('nonAAC').create()

    await user.related('territoires').attach([aacTerritoire.id, nonAacTerritoire.id])

    const response = await client.get(route('territoires.index')).loginAs(user).withInertia()

    response.assertStatus(200)

    const responseBody = response.body()
    assert.equal(responseBody.component, 'territoires/index')

    const territoires = responseBody.props.territoires
    assert.lengthOf(territoires, 2)

    const territoireWithAacLink = territoires.find((territoire: { id: string }) => {
      return territoire.id === aacTerritoire.id
    })
    const territoireWithoutAacLink = territoires.find((territoire: { id: string }) => {
      return territoire.id === nonAacTerritoire.id
    })

    assert.isDefined(territoireWithAacLink)
    assert.isDefined(territoireWithoutAacLink)
    assert.equal(territoireWithAacLink.code, '12345')
    assert.equal(territoireWithAacLink.aacHref, '/aac/12345')
    assert.equal(territoireWithAacLink.typeLabel, 'AAC Sandre')
    assert.equal(territoireWithAacLink.surface, 150.5)
    assert.equal(territoireWithAacLink.nb_communes, 2)
    assert.equal(territoireWithAacLink.nb_captages_actifs, 3)
    assert.isNull(territoireWithoutAacLink.code)
    assert.isNull(territoireWithoutAacLink.aacHref)
    assert.equal(territoireWithoutAacLink.typeLabel, 'Autre territoire')
    assert.isNull(territoireWithoutAacLink.surface)
    assert.isNull(territoireWithoutAacLink.nb_communes)
    assert.isNull(territoireWithoutAacLink.nb_captages_actifs)
  })

  test('user gets paginated territoires', async ({ assert, client, route }) => {
    const user = await UserFactory.create()
    const territoires = await TerritoireFactory.createMany(21)

    await user.related('territoires').attach(territoires.map((territoire) => territoire.id))

    const response = await client
      .get(route('territoires.index', {}, { qs: { territoiresPage: 2 } }))
      .loginAs(user)
      .withInertia()

    response.assertStatus(200)

    const responseBody = response.body()
    assert.equal(responseBody.component, 'territoires/index')
    assert.equal(responseBody.props.meta.currentPage, 2)
    assert.equal(responseBody.props.meta.lastPage, 2)
    assert.equal(responseBody.props.territoires.length, 1)
  })

  test("user cannot see another user's territoires", async ({ assert, client, route }) => {
    const user = await UserFactory.create()
    const anotherUser = await UserFactory.create()
    const myTerritoire = await TerritoireFactory.create()
    const otherTerritoire = await TerritoireFactory.create()

    await user.related('territoires').attach([myTerritoire.id])
    await anotherUser.related('territoires').attach([otherTerritoire.id])

    const response = await client.get(route('territoires.index')).loginAs(user).withInertia()

    response.assertStatus(200)

    const responseBody = response.body()
    const territoireIds = responseBody.props.territoires.map((territoire: { id: string }) => {
      return territoire.id
    })

    assert.include(territoireIds, myTerritoire.id)
    assert.notInclude(territoireIds, otherTerritoire.id)
  })
})
