import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { UserFactory } from '#database/factories/user_factory'
import { TerritoireFactory } from '#database/factories/territoire_factory'
import { ProjectFactory } from '#database/factories/project_factory'

test.group('Projects - Index Route', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('I can list projects', async ({ assert, client, route }) => {
    const territoire = await TerritoireFactory.create()
    const user = await UserFactory.create()
    await user.related('territoires').attach([territoire.id])

    const projects = await ProjectFactory.with('user').createMany(2)
    const otherUserProject = await ProjectFactory.with('user').create()

    for (const project of projects) {
      await project.related('user').associate(user)
    }

    const response = await client
      .get(route('projets.index'))
      .accept('application/json')
      .loginAs(user)

    response.assertStatus(200)

    const body = response.body() as {
      data: Array<{
        id: string
        name: string
        description: string | null
        actionType: string | null
        status: string
        closedAt: string | null
        createdAt: string | null
        updatedAt: string | null
      }>
    }

    assert.equal(body.data.length, 2)
    assert.notInclude(
      body.data.map((project) => project.id),
      otherUserProject.id
    )
    assert.deepEqual(
      body.data.map((project) => project.id).sort(),
      projects.map((project) => project.id).sort()
    )
    assert.sameMembers(
      body.data.map((project) => project.status),
      projects.map((project) => project.status)
    )
  })
})
