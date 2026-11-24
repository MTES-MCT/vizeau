import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import app from '@adonisjs/core/services/app'
import { randomUUID } from 'node:crypto'
import { inertiaApiClient } from '@adonisjs/inertia/plugins/api_client'
import env from '#start/env'
import { UserFactory } from '#database/factories/user_factory'
import { TerritoireFactory } from '#database/factories/territoire_factory'
import { AacService } from '#services/aac_service'
import { EventLoggerService } from '#services/event_logger_service'
import { RpgPacageService } from '#services/rpg_pacage_service'

async function createUserWithTerritoire() {
  const territoire = await TerritoireFactory.create()
  const user = await UserFactory.create()
  await user.related('territoires').attach([territoire.id])
  return user
}

/** Service du RPG qui enregistre ses appels et renvoie des résultats fixes. */
function createMockService(calls: unknown[][]) {
  const record =
    (name: string, result: unknown) =>
    async (...args: unknown[]) => {
      calls.push([name, ...args])
      return result
    }
  return {
    getZone: record('getZone', [[1, 45, 2, 46]]),
    searchByPacage: record('searchByPacage', { status: 'notFound' }),
    searchByParcelle: record('searchByParcelle', { status: 'outsideZone' }),
    getEmprisePacages: record('getEmprisePacages', { pacages: [] }),
    getExploitationPacages: record('getExploitationPacages', null),
    getZoneExploitations: record('getZoneExploitations', [
      { id: 'e1', name: 'Ferme', rpgIds: ['1004'] },
    ]),
  } as unknown as RpgPacageService
}

test.group('RPG - props de l’éditeur de parcelles', (group) => {
  let calls: unknown[][]
  let events: unknown[]

  group.setup(async () => {
    await (inertiaApiClient(app) as () => Promise<void>)()
  })
  group.each.setup(() => {
    const parquetUrl = env.get('RPG_PARQUET_URL')
    env.set('RPG_PARQUET_URL', '/rpg')
    calls = []
    events = []
    app.container.swap(RpgPacageService, () => createMockService(calls))
    // Emprises des AAC, chargées par une visite de la page
    app.container.swap(
      AacService,
      () =>
        ({
          getEmprisesByCode: async (codes: string[]) =>
            Object.fromEntries(codes.map((code) => [code, { bbox: [1, 45, 2, 46] }])),
        }) as unknown as AacService
    )
    app.container.swap(
      EventLoggerService,
      () => ({ logEvent: (event: unknown) => events.push(event) }) as unknown as EventLoggerService
    )
    return () => {
      env.set('RPG_PARQUET_URL', parquetUrl ?? '')
      app.container.restore(RpgPacageService)
      app.container.restore(AacService)
      app.container.restore(EventLoggerService)
    }
  })
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('loads each prop with its parameters, for the logged in user', async ({
    assert,
    client,
    route,
  }) => {
    const user = await createUserWithTerritoire()
    const exploitationId = randomUUID()
    const reload = (prop: string, qs: Record<string, unknown>) =>
      client
        .get(route('exploitations.create'))
        .qs(qs)
        .loginAs(user)
        .withInertiaPartialReload('exploitations/creation', [prop as never])

    const zone = await reload('rpgZone', {})
    const pacage = await reload('rpgPacage', { millesime: 2024, pacage: '057000001' })
    // PACAGE corses : département 02A ou 02B
    await reload('rpgPacage', { millesime: 2024, pacage: '02A000001' })
    await reload('rpgParcellePacage', { millesime: 2024, rpgId: '1004', x: 5.08, y: 45.08 })
    await reload('rpgEmprisePacages', { millesime: 2023, bbox: '5,45,5.1,45.1' })
    await reload('rpgExploitationPacages', { millesime: 2024, exploitationId })
    const exploitations = await reload('rpgZoneExploitations', { millesime: 2024 })

    zone.assertStatus(200)
    assert.deepEqual(zone.body().props.rpgZone, [[1, 45, 2, 46]])
    assert.deepEqual(pacage.body().props.rpgPacage, { status: 'notFound' })
    assert.deepEqual(exploitations.body().props.rpgZoneExploitations, [
      { id: 'e1', name: 'Ferme', rpgIds: ['1004'] },
    ])
    assert.deepEqual(calls, [
      ['getZone', user.id],
      ['searchByPacage', user.id, 2024, '057000001'],
      ['searchByPacage', user.id, 2024, '02A000001'],
      ['searchByParcelle', user.id, 2024, '1004', { x: 5.08, y: 45.08 }],
      ['getEmprisePacages', user.id, 2023, [5, 45, 5.1, 45.1]],
      ['getExploitationPacages', user.id, 2024, exploitationId],
      ['getZoneExploitations', user.id, 2024],
    ])
  })

  test('returns null without searching when the parameters are invalid', async ({
    assert,
    client,
    route,
  }) => {
    const user = await createUserWithTerritoire()
    const reload = async (prop: string, qs: Record<string, unknown>) => {
      const response = await client
        .get(route('exploitations.create'))
        .qs(qs)
        .loginAs(user)
        .withInertiaPartialReload('exploitations/creation', [prop as never])
      response.assertStatus(200)
      return response.body().props[prop]
    }

    const values = [
      await reload('rpgPacage', { millesime: 2024, pacage: '12345' }),
      await reload('rpgPacage', { millesime: 2024, pacage: '05A000001' }),
      // Millésime absent de RPG_MILLESIMES, ou manquant
      await reload('rpgPacage', { millesime: 1999, pacage: '057000001' }),
      await reload('rpgParcellePacage', { rpgId: '1004', x: 5.08, y: 45.08 }),
      await reload('rpgParcellePacage', { millesime: 2024, rpgId: 'abc', x: 5.08, y: 45.08 }),
      // Emprise mal formée, inversée ou trop grande
      await reload('rpgEmprisePacages', { millesime: 2024, bbox: '5,45,5.1' }),
      await reload('rpgEmprisePacages', { millesime: 2024, bbox: '5.1,45,5,45.1' }),
      await reload('rpgEmprisePacages', { millesime: 2024, bbox: '5,45,6,45.1' }),
      await reload('rpgExploitationPacages', { millesime: 2024, exploitationId: 'abc' }),
      await reload('rpgZoneExploitations', {}),
    ]

    assert.deepEqual(values, Array(values.length).fill(null))
    assert.deepEqual(calls, [])
  })

  test('returns null for the Parquet props when the Parquet are not configured', async ({
    assert,
    client,
    route,
  }) => {
    const user = await createUserWithTerritoire()
    env.set('RPG_PARQUET_URL', '')

    const response = await client
      .get(route('exploitations.create'))
      .qs({ millesime: 2024, pacage: '057000001' })
      .loginAs(user)
      .withInertiaPartialReload('exploitations/creation', [
        'rpgPacage',
        'rpgZoneExploitations',
      ] as never[])

    assert.isNull(response.body().props.rpgPacage)
    assert.lengthOf(response.body().props.rpgZoneExploitations, 1)
  })

  test('sends no RPG prop on a regular visit', async ({ assert, client, route }) => {
    const user = await createUserWithTerritoire()

    const response = await client
      .get(route('exploitations.create'))
      .qs({ millesime: 2024, pacage: '057000001' })
      .loginAs(user)
      .withInertia()

    response.assertStatus(200)
    assert.isTrue(response.body().props.rpgPacageSearch)
    for (const prop of ['rpgZone', 'rpgPacage', 'rpgZoneExploitations']) {
      assert.notProperty(response.body().props, prop)
    }
    assert.deepEqual(calls, [])
  })

  test('is offered on the pages that open the parcel editor, without logging a visit', async ({
    assert,
    client,
    route,
  }) => {
    const user = await createUserWithTerritoire()
    const pages = [
      [route('exploitations.create'), 'exploitations/creation'],
      [route('visualisation.index'), 'visualisation'],
      [route('projets.create'), 'projets/creation'],
    ] as const

    for (const [url, component] of pages) {
      const response = await client
        .get(url)
        .qs({ millesime: 2024, pacage: '057000001' })
        .loginAs(user)
        .withInertiaPartialReload(component, ['rpgPacage'] as never[])
      response.assertStatus(200)
      assert.deepEqual(response.body().props.rpgPacage, { status: 'notFound' }, component)
    }
    assert.lengthOf(calls, pages.length)
    // Ni visite, ni PACAGE dans le journal
    assert.deepEqual(events, [])

    // Une vraie visite reste enregistrée
    await client.get(route('exploitations.create')).loginAs(user).withInertia()
    assert.lengthOf(events, 1)
  })
})
