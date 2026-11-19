import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import app from '@adonisjs/core/services/app'
import { inertiaApiClient } from '@adonisjs/inertia/plugins/api_client'
import { UserFactory } from '#database/factories/user_factory'
import { TerritoireFactory } from '#database/factories/territoire_factory'
import { AacService, type AacEmprise } from '#services/aac_service'

const BBOX_BY_CODE: Record<string, AacEmprise['bbox']> = {
  '100': [1, 45, 2, 46],
  '200': [3, 47, 4, 48],
}

function createMockAacService(): AacService {
  return {
    // Autres props de la carte, sans intérêt ici
    async getAll() {
      return { data: [], total: 0 }
    },
    async getAllSurfaces() {
      return {}
    },
    async getEmprisesByCode(aacCodes: string[]) {
      return Object.fromEntries(
        aacCodes
          .filter((code) => code in BBOX_BY_CODE)
          .map((code) => [code, { bbox: BBOX_BY_CODE[code] }])
      )
    },
  } as unknown as AacService
}

test.group('Carte - Emprises des AAC pour l’éditeur de parcelles', (group) => {
  group.setup(async () => {
    await (inertiaApiClient(app) as () => Promise<void>)()
  })
  group.each.setup(() => {
    app.container.swap(AacService, () => createMockAacService())
    return () => app.container.restore(AacService)
  })
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('ne renvoie que les AAC de l’utilisateur, à la demande', async ({ assert, client }) => {
    const user = await UserFactory.create()
    const aac = await TerritoireFactory.merge({ code: '100' }).create()
    await user.related('territoires').attach([aac.id])

    // AAC d'un autre utilisateur, qui ne doit pas fuiter
    const otherUser = await UserFactory.create()
    const otherAac = await TerritoireFactory.merge({ code: '200' }).create()
    await otherUser.related('territoires').attach([otherAac.id])

    const response = await client
      .get('/visualisation?millesime=2024')
      .loginAs(user)
      .withInertiaPartialReload('visualisation', ['aacEmprises'])

    response.assertStatus(200)
    assert.deepEqual(response.body().props.aacEmprises, [
      { id: aac.id, code: '100', name: aac.name, bbox: [1, 45, 2, 46] },
    ])
  })

  test('ne charge pas les emprises à l’affichage de la carte', async ({ assert, client }) => {
    const user = await UserFactory.with('territoires', 1).create()

    const response = await client.get('/visualisation?millesime=2024').loginAs(user).withInertia()

    response.assertStatus(200)
    assert.notProperty(response.body().props, 'aacEmprises')
  })
})
