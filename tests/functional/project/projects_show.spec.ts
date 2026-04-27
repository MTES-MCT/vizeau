import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { UserFactory } from '#database/factories/user_factory'
import { ProjectFactory } from '#database/factories/project_factory'

test.group('Projects - Show Route', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('I can fetch one of my projects', async ({ assert, client, route }) => {
    const user = await UserFactory.with('territoires', 1).create()
    const project = await ProjectFactory.with('user').create()
    await project.related('user').associate(user)

    const response = await client
      .get(route('projets.show', { projectId: project.id }))
      .loginAs(user)

    response.assertStatus(200)

    const body = response.body() as {
      data: {
        id: string
        name: string
      }
    }

    assert.equal(body.data.id, project.id)
    assert.equal(body.data.name, project.name)
  })

  test("I can't fetch another user's project", async ({ client, route }) => {
    const user = await UserFactory.with('territoires', 1).create()
    const project = await ProjectFactory.with('user').create()

    const response = await client
      .get(route('projets.show', { projectId: project.id }))
      .header('Accept', 'application/json')
      .loginAs(user)

    response.assertStatus(404)
  })
})
