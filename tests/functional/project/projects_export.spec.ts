import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { ExploitationFactory } from '#database/factories/exploitation_factory'
import { ProjectFactory } from '#database/factories/project_factory'
import { UserFactory } from '#database/factories/user_factory'

test.group('Projects - Exploitations Export Route', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('I can export my project exploitations as CSV', async ({ assert, client, route }) => {
    const user = await UserFactory.with('territoires', 1).create()
    const project = await ProjectFactory.with('user').create()
    await project.related('user').associate(user)
    const exploitation = await ExploitationFactory.merge({
      name: 'Ferme export test',
      siret: '12345678901234',
    }).create()
    await project.related('exploitations').attach([exploitation.id])

    const response = await client
      .get(route('projets.exploitations.export', { projectId: project.id }))
      .loginAs(user)

    response.assertStatus(200)
    assert.equal(response.headers()['content-type'], 'text/csv; charset=utf-8')
    assert.include(
      response.headers()['content-disposition'],
      `attachment; filename="exploitations-${project.name.replace(/[^a-zA-Z0-9]/g, '-').slice(0, 50)}`
    )
    assert.include(response.text(), 'Ferme export test')
    assert.include(response.text(), '"Nom";"Dénomination légale";"SIRET"')
  })

  test("I can't export another user's project exploitations", async ({ client, route }) => {
    const user = await UserFactory.with('territoires', 1).create()
    const project = await ProjectFactory.with('user').create()

    const response = await client
      .get(route('projets.exploitations.export', { projectId: project.id }))
      .loginAs(user)

    response.assertStatus(403)
  })

  test('I cannot export project exploitations with an invalid project id', async ({ client }) => {
    const user = await UserFactory.with('territoires', 1).create()

    const response = await client
      .get('projets/invalid-id/exploitations/export')
      .header('Accept', 'application/json')
      .loginAs(user)

    response.assertStatus(422)
  })
})
