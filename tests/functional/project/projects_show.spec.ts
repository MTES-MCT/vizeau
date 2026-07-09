import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { UserFactory } from '#database/factories/user_factory'
import { ProjectFactory } from '#database/factories/project_factory'

test.group('Projects - Show Route', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test("I can't fetch another user's project", async ({ client }) => {
    const user = await UserFactory.with('territoires', 1).create()
    const project = await ProjectFactory.with('user').create()

    const response = await client
      .get(`projets/${project.id}`)
      .header('Accept', 'application/json')
      .loginAs(user)

    response.assertStatus(404)
  })
})
