import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { UserFactory } from '#database/factories/user_factory'
import { TerritoireFactory } from '#database/factories/territoire_factory'
import { inertiaApiClient } from '@adonisjs/inertia/plugins/api_client'
import app from '@adonisjs/core/services/app'

test.group('Territoires - Index Route', (group) => {
  group.setup(async () => {
    await (inertiaApiClient(app) as () => Promise<void>)()
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
    assert.isNull(territoireWithoutAacLink.code)
    assert.isNull(territoireWithoutAacLink.aacHref)
    assert.equal(territoireWithoutAacLink.typeLabel, 'Autre territoire')
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
