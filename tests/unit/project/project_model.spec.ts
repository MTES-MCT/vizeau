import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { ProjectFactory } from '#database/factories/project_factory'
import { ExploitationFactory } from '#database/factories/exploitation_factory'
import { ParcelleFactory } from '#database/factories/parcelle_factory'
import { CaptageFactory } from '#database/factories/captage_factory'

test.group('Project model', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('I can attach parcelles, exploitations and captages to a project', async ({ assert }) => {
    const project = await ProjectFactory.with('user').create()
    const parcelles = await ParcelleFactory.createMany(2)
    const exploitations = await ExploitationFactory.createMany(2)
    const captages = await CaptageFactory.createMany(2)

    await project.related('parcelles').attach(parcelles.map((parcelle) => parcelle.id))
    await project
      .related('exploitations')
      .attach(exploitations.map((exploitation) => exploitation.id))
    await project.related('captages').attach(captages.map((captage) => captage.id))

    await project.load('parcelles')
    await project.load('exploitations')
    await project.load('captages')

    assert.deepEqual(
      project.parcelles.map((parcelle) => parcelle.id).sort(),
      parcelles.map((parcelle) => parcelle.id).sort()
    )
    assert.deepEqual(
      project.exploitations.map((exploitation) => exploitation.id).sort(),
      exploitations.map((exploitation) => exploitation.id).sort()
    )
    assert.deepEqual(
      project.captages.map((captage) => captage.id).sort(),
      captages.map((captage) => captage.id).sort()
    )
  })
})
