import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { DateTime } from 'luxon'
import { GlobalSearchService, GLOBAL_SEARCH_LIMIT } from '#services/global_search_service'
import { ExploitationService } from '#services/exploitation_service'
import { ProjectService } from '#services/project_service'
import { ProjectStepDocumentService } from '#services/project_step_document_service'
import { LogEntryService } from '#services/log_entry_service'
import type { AacService } from '#services/aac_service'
import { UserFactory } from '#database/factories/user_factory'
import { TerritoireFactory } from '#database/factories/territoire_factory'
import { ExploitationFactory } from '#database/factories/exploitation_factory'
import { ProjectFactory } from '#database/factories/project_factory'
import { ProjectStepFactory } from '#database/factories/project_step_factory'
import { LogEntryFactory } from '#database/factories/log_entry_factory'

// Les résultats AAC (DuckDB) sont testés dans aac_service_global_search.spec.ts
const emptyAacService = {
  async searchAacs() {
    return { data: [], total: 0 }
  },
  async searchInstallations() {
    return { data: [], total: 0 }
  },
} as unknown as AacService

function createService() {
  return new GlobalSearchService(
    new ExploitationService(),
    new ProjectService(new ProjectStepDocumentService()),
    new LogEntryService(),
    emptyAacService
  )
}

async function createUserWithTerritoire() {
  const territoire = await TerritoireFactory.create()
  const user = await UserFactory.create()
  await user.related('territoires').attach([territoire.id])
  return { user, territoire }
}

test.group('GlobalSearchService', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('matches accessible exploitations by name, commune or postal code', async ({ assert }) => {
    const { user, territoire } = await createUserWithTerritoire()

    // Explicit values on every searched field, so that faker data cannot match by accident
    const neutral = { name: 'Ferme', commune: 'Lyon', postalCode: '69001' }
    const byName = await ExploitationFactory.merge({ ...neutral, name: 'Ferme Urielle' }).create()
    const byCommune = await ExploitationFactory.merge({
      ...neutral,
      commune: 'Saint-Urbain',
    }).create()
    const byPostalCode = await ExploitationFactory.merge({
      ...neutral,
      postalCode: '89232',
    }).create()
    const deleted = await ExploitationFactory.merge({
      ...neutral,
      name: 'Ferme Urane',
      isDeleted: true,
    }).create()
    for (const exploitation of [byName, byCommune, byPostalCode, deleted]) {
      await exploitation.related('territoires').attach([territoire.id])
    }
    // Not shared with the user
    await ExploitationFactory.merge({ ...neutral, name: 'Ferme Urbaine' }).create()

    const service = createService()

    const { exploitations } = await service.search('ur', user.id)
    assert.equal(exploitations.total, 2)
    assert.sameMembers(
      exploitations.data.map((e) => e.id),
      [byName.id, byCommune.id]
    )

    const byPostalCodeResults = await service.search('892', user.id)
    assert.deepEqual(
      byPostalCodeResults.exploitations.data.map((e) => e.id),
      [byPostalCode.id]
    )
  })

  test('limits the results of a category but counts all matches', async ({ assert }) => {
    const { user, territoire } = await createUserWithTerritoire()

    const names = ['Ferme G', 'Ferme A', 'Ferme F', 'Ferme B', 'Ferme E', 'Ferme C', 'Ferme D']
    const exploitations = await ExploitationFactory.merge(
      names.map((name) => ({ name }))
    ).createMany(names.length)
    for (const exploitation of exploitations) {
      await exploitation.related('territoires').attach([territoire.id])
    }

    const result = await createService().search('ferme', user.id)

    assert.equal(result.exploitations.total, names.length)
    assert.deepEqual(
      result.exploitations.data.map((e) => e.name),
      names.toSorted().slice(0, GLOBAL_SEARCH_LIMIT)
    )
  })

  test('matches accessible projects by name', async ({ assert }) => {
    const { user, territoire } = await createUserWithTerritoire()
    const otherUser = await UserFactory.create()

    await ProjectFactory.merge({ userId: user.id, name: 'Accompagnement AAC Urne' }).create()
    const sharedProject = await ProjectFactory.merge({
      userId: otherUser.id,
      name: 'Suivi Urne',
    }).create()
    await sharedProject.related('territoires').attach([territoire.id])
    // Neither authored by nor shared with the user
    await ProjectFactory.merge({ userId: otherUser.id, name: 'Travaux Urne' }).create()
    await ProjectFactory.merge({ userId: user.id, name: 'Autre projet' }).create()

    const { projects } = await createService().search('urne', user.id)

    assert.equal(projects.total, 2)
    assert.sameMembers(
      projects.data.map((project) => project.name),
      ['Accompagnement AAC Urne', 'Suivi Urne']
    )
  })

  test('matches dated steps of accessible projects by title', async ({ assert }) => {
    const { user } = await createUserWithTerritoire()
    const otherUser = await UserFactory.create()
    const project = await ProjectFactory.merge({ userId: user.id }).create()
    const otherProject = await ProjectFactory.merge({ userId: otherUser.id }).create()
    const date = DateTime.now()

    const matchingStep = await ProjectStepFactory.merge({
      projectId: project.id,
      title: 'Rédiger rapport',
      date,
    }).create()
    await ProjectStepFactory.merge({
      projectId: project.id,
      title: 'Rédiger compte rendu',
    }).create()
    await ProjectStepFactory.merge({ projectId: project.id, title: 'Réunion', date }).create()
    await ProjectStepFactory.merge({
      projectId: otherProject.id,
      title: 'Rédiger synthèse',
      date,
    }).create()

    const { projectSteps } = await createService().search('rédiger', user.id)

    assert.equal(projectSteps.total, 1)
    assert.deepEqual(
      projectSteps.data.map((step) => step.id),
      [matchingStep.id]
    )
    assert.equal(projectSteps.data[0].project.id, project.id)
  })

  test('matches dated entries of accessible exploitations by title', async ({ assert }) => {
    const { user, territoire } = await createUserWithTerritoire()
    const exploitation = await ExploitationFactory.create()
    await exploitation.related('territoires').attach([territoire.id])
    const otherExploitation = await ExploitationFactory.create()
    const date = DateTime.now()

    const matchingEntry = await LogEntryFactory.merge({
      title: 'Appeler l’exploitant',
      date,
      userId: user.id,
      exploitationId: exploitation.id,
    }).create()
    await LogEntryFactory.merge({
      title: 'Appeler la mairie',
      userId: user.id,
      exploitationId: exploitation.id,
    }).create()
    await LogEntryFactory.merge({
      title: 'Appeler le voisin',
      date,
      userId: user.id,
      exploitationId: otherExploitation.id,
    }).create()

    const { logEntries } = await createService().search('appeler', user.id)

    assert.equal(logEntries.total, 1)
    assert.deepEqual(
      logEntries.data.map((entry) => entry.id),
      [matchingEntry.id]
    )
    assert.equal(logEntries.data[0].exploitation.id, exploitation.id)
  })
})
