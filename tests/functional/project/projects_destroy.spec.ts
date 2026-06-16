import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { UserFactory } from '#database/factories/user_factory'
import { ProjectFactory } from '#database/factories/project_factory'

test.group('Projects - Destroy Route', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('I can delete one of my projects', async ({ client, route }) => {
    const user = await UserFactory.with('territoires', 1).create()
    const project = await ProjectFactory.with('user').create()
    await project.related('user').associate(user)

    const response = await client
      .delete(route('projets.destroy', { projectId: project.id }))
      .loginAs(user)
      .withCsrfToken()

    response.assertStatus(200)
  })

  test("I can't delete another user's project", async ({ client, route }) => {
    const user = await UserFactory.with('territoires', 1).create()
    const project = await ProjectFactory.with('user').create()

    const response = await client
      .delete(route('projets.destroy', { projectId: project.id }))
      .header('Accept', 'application/json')
      .loginAs(user)
      .withCsrfToken()

    response.assertStatus(404)
  })

  test("I can't delete a project with an invalid id", async ({ client, route }) => {
    const user = await UserFactory.with('territoires', 1).create()

    const response = await client
      .delete(route('projets.destroy', { projectId: 'invalid-project-id' }))
      .header('Accept', 'application/json')
      .loginAs(user)
      .withCsrfToken()

    response.assertStatus(422)
  })
})
