import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import app from '@adonisjs/core/services/app'
import { DateTime } from 'luxon'
import { UserFactory } from '#database/factories/user_factory'
import { TerritoireFactory } from '#database/factories/territoire_factory'
import { ExploitationFactory } from '#database/factories/exploitation_factory'
import { ProjectFactory } from '#database/factories/project_factory'
import { ProjectStepFactory } from '#database/factories/project_step_factory'
import { LogEntryFactory } from '#database/factories/log_entry_factory'
import { AacService } from '#services/aac_service'
import type { GlobalSearchGroupJson } from '#types/recherche'

function createMockAacService(
  overrides: Partial<Pick<AacService, 'searchAacs' | 'searchInstallations'>> = {}
): AacService {
  return {
    async searchAacs() {
      return { data: [], total: 0 }
    },
    async searchInstallations() {
      return { data: [], total: 0 }
    },
    ...overrides,
  } as unknown as AacService
}

async function createUserWithTerritoire() {
  const territoire = await TerritoireFactory.create()
  const user = await UserFactory.create()
  await user.related('territoires').attach([territoire.id])
  return { user, territoire }
}

test.group('Recherche - Index Route', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.teardown(() => app.container.restore(AacService))

  test('requires an authenticated user', async ({ client, route }) => {
    const response = await client
      .get(route('recherche.index', {}, { qs: { q: 'urne' } }))
      .header('Accept', 'application/json')

    response.assertStatus(401)
  })

  test('rejects a query shorter than 2 characters', async ({ client, route }) => {
    const { user } = await createUserWithTerritoire()

    const response = await client
      .get(route('recherche.index', {}, { qs: { q: ' u ' } }))
      .header('Accept', 'application/json')
      .loginAs(user)

    response.assertStatus(422)
  })

  test('accepts a single digit, to search by code', async ({ assert, client, route }) => {
    const { user } = await createUserWithTerritoire()
    const searchedCodes: string[] = []
    app.container.swap(AacService, () =>
      createMockAacService({
        async searchAacs(recherche: string) {
          searchedCodes.push(recherche)
          return { data: [{ code: '7', nom: 'AAC de test' }], total: 1 }
        },
      })
    )

    const response = await client
      .get(route('recherche.index', {}, { qs: { q: '7' } }))
      .header('Accept', 'application/json')
      .loginAs(user)

    response.assertStatus(200)
    assert.deepEqual(searchedCodes, ['7'])
  })

  test('returns every category, in display order, with links to the results', async ({
    assert,
    client,
    route,
  }) => {
    const { user, territoire } = await createUserWithTerritoire()
    app.container.swap(AacService, () =>
      createMockAacService({
        async searchAacs() {
          return { data: [{ code: '5463', nom: 'L’Urne' }], total: 12 }
        },
        async searchInstallations() {
          return {
            data: [
              {
                code: '002000809',
                nom: 'L’Urne à Magenta',
                code_bss: 'BSS02436X',
                aac_code: '5463',
              },
            ],
            total: 1,
          }
        },
      })
    )

    const exploitation = await ExploitationFactory.merge({
      name: 'Ferme de l’Urne',
      commune: 'Magenta',
      postalCode: '51530',
    }).create()
    await exploitation.related('territoires').attach([territoire.id])
    const project = await ProjectFactory.merge({ userId: user.id, name: 'Suivi Urne' }).create()
    const step = await ProjectStepFactory.merge({
      projectId: project.id,
      title: 'Rédiger rapport Urne',
      date: DateTime.fromISO('2026-10-01'),
    }).create()
    const logEntry = await LogEntryFactory.merge({
      userId: user.id,
      exploitationId: exploitation.id,
      title: 'Appeler au sujet de l’Urne',
      date: DateTime.fromISO('2026-11-01'),
    }).create()

    const response = await client
      .get(route('recherche.index', {}, { qs: { q: 'urne' } }))
      .header('Accept', 'application/json')
      .loginAs(user)

    response.assertStatus(200)
    const groups = response.body() as GlobalSearchGroupJson[]
    assert.deepEqual(
      groups.map((g) => g.category),
      ['exploitations', 'aac', 'points', 'projets', 'taches']
    )

    const [exploitations, aacs, points, projets, taches] = groups
    assert.deepEqual(exploitations.items, [
      {
        id: exploitation.id,
        title: 'Ferme de l’Urne',
        subtitle: 'Magenta · 51530',
        href: `/exploitations/${exploitation.id}`,
      },
    ])
    assert.equal(aacs.total, 12)
    assert.equal(aacs.items[0].href, '/aac/5463')
    assert.equal(aacs.items[0].subtitle, 'Code SANDRE : 5463')
    assert.equal(points.items[0].href, '/aac/5463/installations/002000809')
    assert.equal(points.items[0].subtitle, 'BSS02436X')
    assert.equal(projets.items[0].href, `/projets/${project.id}`)

    // Project steps and log entries are merged, most recent first
    assert.equal(taches.total, 2)
    assert.deepEqual(
      taches.items.map((item) => item.href),
      [
        `/exploitations/${exploitation.id}/journal/${logEntry.id}`,
        `/projets/${project.id}/etapes/${step.id}`,
      ]
    )
    assert.equal(taches.items[1].subtitle, 'Projet : Suivi Urne')
  })

  test('only returns exploitations and projects accessible to the user', async ({
    assert,
    client,
    route,
  }) => {
    const { user } = await createUserWithTerritoire()
    const otherUser = await UserFactory.create()
    app.container.swap(AacService, () => createMockAacService())

    await ExploitationFactory.merge({ name: 'Ferme de l’Urne' }).with('territoires', 1).create()
    await ProjectFactory.merge({ userId: otherUser.id, name: 'Suivi Urne' }).create()

    const response = await client
      .get(route('recherche.index', {}, { qs: { q: 'urne' } }))
      .header('Accept', 'application/json')
      .loginAs(user)

    response.assertStatus(200)
    const groups = response.body() as GlobalSearchGroupJson[]
    for (const searchGroup of groups) {
      assert.equal(searchGroup.total, 0, searchGroup.category)
      assert.lengthOf(searchGroup.items, 0, searchGroup.category)
    }
  })

  test('still answers when the AAC dataset is unavailable', async ({ assert, client, route }) => {
    const { user, territoire } = await createUserWithTerritoire()
    app.container.swap(AacService, () =>
      createMockAacService({
        async searchAacs() {
          throw new Error('S3 indisponible')
        },
        async searchInstallations() {
          throw new Error('S3 indisponible')
        },
      })
    )
    const exploitation = await ExploitationFactory.merge({ name: 'Ferme de l’Urne' }).create()
    await exploitation.related('territoires').attach([territoire.id])

    const response = await client
      .get(route('recherche.index', {}, { qs: { q: 'urne' } }))
      .header('Accept', 'application/json')
      .loginAs(user)

    response.assertStatus(200)
    const groups = response.body() as GlobalSearchGroupJson[]
    const byCategory = Object.fromEntries(groups.map((g) => [g.category, g]))
    assert.equal(byCategory.exploitations.total, 1)
    assert.equal(byCategory.aac.total, 0)
    assert.equal(byCategory.points.total, 0)
  })
})
