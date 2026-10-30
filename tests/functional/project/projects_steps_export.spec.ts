import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import { ProjectFactory } from '#database/factories/project_factory'
import { ProjectStepFactory } from '#database/factories/project_step_factory'
import { UserFactory } from '#database/factories/user_factory'

test.group('Projects - Steps Export Route', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('I can export my project steps as CSV', async ({ assert, client, route }) => {
    const user = await UserFactory.with('territoires', 1).create()
    const project = await ProjectFactory.with('user').create()
    await project.related('user').associate(user)
    await ProjectStepFactory.merge({
      projectId: project.id,
      title: 'Phase de diagnostic',
      date: DateTime.now(),
    }).create()

    const response = await client
      .get(route('projets.steps.export', { projectId: project.id }))
      .loginAs(user)

    response.assertStatus(200)
    assert.equal(response.headers()['content-type'], 'text/csv; charset=utf-8')
    assert.include(
      response.headers()['content-disposition'],
      `attachment; filename="etapes-${project.name.replace(/[^a-zA-Z0-9]/g, '-').slice(0, 50)}`
    )
    assert.include(response.text(), 'Phase de diagnostic')
    assert.include(
      response.text(),
      '"Date";"Titre";"Notes";"Statut";"Étiquettes";"Créé le";"Modifié le"'
    )
  })

  test("I can't export another user's project steps", async ({ client, route }) => {
    const user = await UserFactory.with('territoires', 1).create()
    const project = await ProjectFactory.with('user').create()

    const response = await client
      .get(route('projets.steps.export', { projectId: project.id }))
      .loginAs(user)

    response.assertStatus(403)
  })

  test('I cannot export project steps with an invalid project id', async ({ client }) => {
    const user = await UserFactory.with('territoires', 1).create()

    const response = await client
      .get('projets/invalid-id/etapes/export')
      .header('Accept', 'application/json')
      .loginAs(user)

    response.assertStatus(422)
  })
})
