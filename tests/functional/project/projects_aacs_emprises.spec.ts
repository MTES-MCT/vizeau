import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import app from '@adonisjs/core/services/app'
import { inertiaApiClient } from '@adonisjs/inertia/plugins/api_client'
import { UserFactory } from '#database/factories/user_factory'
import { TerritoireFactory } from '#database/factories/territoire_factory'
import { ProjectFactory } from '#database/factories/project_factory'
import { AacService, type AacEmprise } from '#services/aac_service'

const BBOX_BY_CODE: Record<string, AacEmprise['bbox']> = {
  '100': [1, 45, 2, 46],
  '200': [3, 47, 4, 48],
  '300': [5, 49, 6, 50],
  '400': [7, 51, 8, 52],
}

function createMockAacService(): AacService {
  return {
    async getEmprisesByCode(aacCodes: string[]) {
      return Object.fromEntries(
        aacCodes
          .filter((code) => code in BBOX_BY_CODE)
          .map((code) => [code, { bbox: BBOX_BY_CODE[code] }])
      )
    },
  } as unknown as AacService
}

test.group('Projets - Emprises des AAC pour la carte des parcelles', (group) => {
  group.setup(async () => {
    await (inertiaApiClient(app) as () => Promise<void>)()
  })
  group.each.setup(() => {
    app.container.swap(AacService, () => createMockAacService())
    return () => app.container.restore(AacService)
  })
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('la page de création ne renvoie que les AAC actives de l’utilisateur, triées par code', async ({
    assert,
    client,
    route,
  }) => {
    const user = await UserFactory.create()
    const aac200 = await TerritoireFactory.merge({ code: '200' }).create()
    const aac100 = await TerritoireFactory.merge({ code: '100' }).create()
    const aacInconnue = await TerritoireFactory.merge({ code: '999' }).create()
    const aacInactive = await TerritoireFactory.merge({ code: '300', isActive: false }).create()
    await user.related('territoires').attach([aac200.id, aac100.id, aacInconnue.id, aacInactive.id])

    // AAC d'un autre utilisateur, qui ne doit pas fuiter
    const otherUser = await UserFactory.create()
    const otherAac = await TerritoireFactory.merge({ code: '400' }).create()
    await otherUser.related('territoires').attach([otherAac.id])

    const response = await client
      .get(route('projets.create'))
      .loginAs(user)
      .withInertiaPartialReload('projets/creation', ['aacs'])

    response.assertStatus(200)
    assert.deepEqual(response.body().props.aacs, [
      { id: aac100.id, code: '100', name: aac100.name, bbox: [1, 45, 2, 46] },
      { id: aac200.id, code: '200', name: aac200.name, bbox: [3, 47, 4, 48] },
      { id: aacInconnue.id, code: '999', name: aacInconnue.name, bbox: null },
    ])
  })

  test('la page d’édition renvoie les AAC de l’utilisateur', async ({ assert, client, route }) => {
    const user = await UserFactory.create()
    const aac = await TerritoireFactory.merge({ code: '100' }).create()
    await user.related('territoires').attach([aac.id])
    const project = await ProjectFactory.merge({ userId: user.id }).create()

    const response = await client
      .get(route('projets.edition', { projectId: project.id }))
      .loginAs(user)
      .withInertiaPartialReload('projets/edition', ['aacs'])

    response.assertStatus(200)
    assert.deepEqual(response.body().props.aacs, [
      { id: aac.id, code: '100', name: aac.name, bbox: [1, 45, 2, 46] },
    ])
  })
})
