import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import Project from '#models/project'
import { UserFactory } from '#database/factories/user_factory'
import { ProjectFactory } from '#database/factories/project_factory'

test.group('Projects - Destroy Route', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('I can delete one of my projects', async ({ assert, client, route }) => {
    const user = await UserFactory.with('territoires', 1).create()
    const project = await ProjectFactory.with('user').create()
    await project.related('user').associate(user)

    const response = await client
      .delete(route('projets.destroy', { projectId: project.id }))
      .loginAs(user)
      .withCsrfToken()

    response.assertStatus(204)

    const deletedProject = await Project.find(project.id)
    assert.isNull(deletedProject)
  })

  test("I can't delete another user's project", async ({ assert, client, route }) => {
    const user = await UserFactory.with('territoires', 1).create()
    const project = await ProjectFactory.with('user').create()

    const response = await client
      .delete(route('projets.destroy', { projectId: project.id }))
      .header('Accept', 'application/json')
      .loginAs(user)
      .withCsrfToken()

    response.assertStatus(404)

    const remainingProject = await Project.find(project.id)
    assert.isNotNull(remainingProject)
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
