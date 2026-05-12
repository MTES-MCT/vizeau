import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import Project, { ProjectStatus } from '#models/project'
import { UserFactory } from '#database/factories/user_factory'
import { ProjectFactory } from '#database/factories/project_factory'

test.group('Projects - Update Route', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('I can partially update one of my projects', async ({ assert, client, route }) => {
    const user = await UserFactory.with('territoires', 1).create()
    const project = await ProjectFactory.with('user').create()
    await project.related('user').associate(user)

    const response = await client
      .patch(route('projets.update', { projectId: project.id }))
      .loginAs(user)
      .json({
        name: 'Updated project name',
        status: ProjectStatus.CURRENT,
      })
      .withCsrfToken()

    response.assertStatus(200)

    const updatedProject = await Project.findByOrFail('id', project.id)

    assert.equal(updatedProject.name, 'Updated project name')
    assert.equal(updatedProject.status, ProjectStatus.CURRENT)
    assert.equal(updatedProject.description, project.description)
    assert.equal(updatedProject.actionType, project.actionType)

    const body = response.body() as {
      data: {
        id: string
        name: string
        status: string
      }
    }

    assert.equal(body.data.id, project.id)
    assert.equal(body.data.name, 'Updated project name')
    assert.equal(body.data.status, ProjectStatus.CURRENT)
  })

  test('I can nullify nullable fields on one of my projects', async ({ assert, client, route }) => {
    const user = await UserFactory.with('territoires', 1).create()
    const project = await ProjectFactory.with('user').create()
    await project.related('user').associate(user)

    const response = await client
      .patch(route('projets.update', { projectId: project.id }))
      .loginAs(user)
      .json({
        description: null,
        actionType: null,
      })
      .withCsrfToken()

    response.assertStatus(200)

    const updatedProject = await Project.findByOrFail('id', project.id)

    assert.isNull(updatedProject.description)
    assert.isNull(updatedProject.actionType)
  })

  test("I can't update another user's project", async ({ assert, client, route }) => {
    const user = await UserFactory.with('territoires', 1).create()
    const project = await ProjectFactory.with('user').create()

    const response = await client
      .patch(route('projets.update', { projectId: project.id }))
      .header('Accept', 'application/json')
      .loginAs(user)
      .json({
        name: 'Should not update',
      })
      .withCsrfToken()

    response.assertStatus(404)

    const unchangedProject = await Project.findByOrFail('id', project.id)
    assert.notEqual(unchangedProject.name, 'Should not update')
  })

  test("I can't update a project with an invalid id", async ({ client, route }) => {
    const user = await UserFactory.with('territoires', 1).create()

    const response = await client
      .patch(route('projets.update', { projectId: 'invalid-project-id' }))
      .header('Accept', 'application/json')
      .loginAs(user)
      .json({
        name: 'Will fail validation',
      })
      .withCsrfToken()

    response.assertStatus(422)
  })
})
