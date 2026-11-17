import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import app from '@adonisjs/core/services/app'
import { inertiaApiClient } from '@adonisjs/inertia/plugins/api_client'
import { UserFactory } from '#database/factories/user_factory'
import { CaptageFactory } from '#database/factories/captage_factory'
import { ProjectFactory } from '#database/factories/project_factory'
import { TerritoireFactory } from '#database/factories/territoire_factory'
import { AacService } from '#services/aac_service'

// Les pages des projets demandent un utilisateur rattaché à un territoire
async function createUserWithTerritoire() {
  const user = await UserFactory.create()
  const territoire = await TerritoireFactory.create()
  await user.related('territoires').attach([territoire.id])
  return user
}

function createMockAacService(): AacService {
  return {
    async getEmprisesByCode() {
      return {}
    },
  } as unknown as AacService
}

test.group('Projets - Recherche des captages à rattacher', (group) => {
  group.setup(async () => {
    await (inertiaApiClient(app) as () => Promise<void>)()
  })
  group.each.setup(() => {
    app.container.swap(AacService, () => createMockAacService())
    return () => app.container.restore(AacService)
  })
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('la page de création cherche les captages par ancien ou nouveau code BSS', async ({
    assert,
    client,
    route,
  }) => {
    const user = await createUserWithTerritoire()
    const ancien = await CaptageFactory.merge({
      name: 'Puits ancien',
      bssCode: '02165X0039/S1',
      newBssCode: null,
    }).create()
    const nouveau = await CaptageFactory.merge({
      name: 'Forage neuf',
      bssCode: null,
      newBssCode: 'BSS004ABCD',
    }).create()

    const searchCaptages = async (recherche: string) => {
      const response = await client
        .get(route('projets.create', {}, { qs: { installationsRecherche: recherche } }))
        .loginAs(user)
        .withInertiaPartialReload('projets/creation', ['installations'])
      response.assertStatus(200)
      return response.body().props.installations as {
        id: string
        bssCode: string | null
        newBssCode: string | null
      }[]
    }

    const captages = await searchCaptages('02165x0039')

    // L'indice seul de l'ancien code
    assert.deepEqual(
      captages.map((c) => c.id),
      [ancien.id]
    )

    // Un captage sans ancien code BSS, trouvé par son nouveau code
    const byNewBssCode = await searchCaptages('bss004')
    assert.lengthOf(byNewBssCode, 1)
    assert.include(byNewBssCode[0], { id: nouveau.id, bssCode: null, newBssCode: 'BSS004ABCD' })
  })

  test('la page d’édition cherche aussi les captages par code BSS', async ({
    assert,
    client,
    route,
  }) => {
    const user = await createUserWithTerritoire()
    const project = await ProjectFactory.merge({ userId: user.id }).create()
    const captage = await CaptageFactory.merge({ bssCode: null, newBssCode: 'BSS004ABCD' }).create()

    const response = await client
      .get(
        route(
          'projets.edition',
          { projectId: project.id },
          { qs: { installationsRecherche: 'BSS004ABCD' } }
        )
      )
      .loginAs(user)
      .withInertiaPartialReload('projets/edition', ['installations'])

    response.assertStatus(200)
    assert.deepEqual(
      response.body().props.installations.map((c: { id: string }) => c.id),
      [captage.id]
    )
  })
})
