import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import Project, { ProjectStatus } from '#models/project'
import { UserFactory } from '#database/factories/user_factory'

test.group('Projects - Store Route', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('I can create a project for the authenticated user', async ({ assert, client, route }) => {
    const user = await UserFactory.with('territoires', 1).create()

    const response = await client
      .post(route('projets.store'))
      .loginAs(user)
      .json({
        name: 'Protect groundwater catchments',
        description: 'Initial scoping and planning',
        actionType: 'study',
      })
      .withCsrfToken()

    response.assertStatus(201)

    const savedProject = await Project.findByOrFail('name', 'Protect groundwater catchments')

    assert.equal(savedProject.userId, user.id)
    assert.equal(savedProject.status, ProjectStatus.TO_BE_STARTED)
    assert.equal(savedProject.description, 'Initial scoping and planning')
    assert.equal(savedProject.actionType, 'study')

    const body = response.body() as {
      data: {
        id: string
        name: string
        description: string | null
        actionType: string | null
        status: string
        closedAt: string | null
      }
    }

    assert.equal(body.data.id, savedProject.id)
    assert.equal(body.data.name, savedProject.name)
    assert.equal(body.data.status, ProjectStatus.TO_BE_STARTED)
    assert.isNull(body.data.closedAt)
  })

  test('The authenticated user is always used as the project owner', async ({
    assert,
    client,
    route,
  }) => {
    const user = await UserFactory.with('territoires', 1).create()
    const otherUser = await UserFactory.create()

    const response = await client
      .post(route('projets.store'))
      .loginAs(user)
      .json({
        name: 'Ownership is derived from auth',
        userId: otherUser.id,
        status: ProjectStatus.CURRENT,
      })
      .withCsrfToken()

    response.assertStatus(201)

    const savedProject = await Project.findByOrFail('name', 'Ownership is derived from auth')

    assert.equal(savedProject.userId, user.id)
    assert.equal(savedProject.status, ProjectStatus.CURRENT)
  })

  test("I can't create a project without a name", async ({ client, route }) => {
    const user = await UserFactory.with('territoires', 1).create()

    const response = await client
      .post(route('projets.store'))
      .header('Accept', 'application/json')
      .loginAs(user)
      .json({
        description: 'Missing required name',
      })
      .withCsrfToken()

    response.assertStatus(422)
  })
})
