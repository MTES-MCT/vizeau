import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import Project, { ProjectStatus } from '#models/project'
import { UserFactory } from '#database/factories/user_factory'
import { ProjectFactory } from '#database/factories/project_factory'
import { ExploitationFactory } from '#database/factories/exploitation_factory'
import { ParcelleFactory } from '#database/factories/parcelle_factory'
import { CaptageFactory } from '#database/factories/captage_factory'
import { TerritoireFactory } from '#database/factories/territoire_factory'

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

  test('I can update a project with accessible exploitations', async ({
    assert,
    client,
    route,
  }) => {
    const territoire = await TerritoireFactory.create()
    const user = await UserFactory.create()
    await user.related('territoires').attach([territoire.id])

    const project = await ProjectFactory.with('user').create()
    await project.related('user').associate(user)

    const exploitation = await ExploitationFactory.create()
    await exploitation.related('territoires').attach([territoire.id])

    const response = await client
      .patch(route('projets.update', { projectId: project.id }))
      .loginAs(user)
      .json({ exploitationIds: [exploitation.id] })
      .withCsrfToken()

    response.assertStatus(200)

    await project.load('exploitations')
    assert.equal(project.exploitations.length, 1)
    assert.equal(project.exploitations[0].id, exploitation.id)
  })

  test("I can't update a project with inaccessible exploitations", async ({ client, route }) => {
    const user = await UserFactory.with('territoires', 1).create()
    const project = await ProjectFactory.with('user').create()
    await project.related('user').associate(user)

    const exploitation = await ExploitationFactory.create()
    // No shared territoire

    const response = await client
      .patch(route('projets.update', { projectId: project.id }))
      .loginAs(user)
      .json({ exploitationIds: [exploitation.id] })
      .withCsrfToken()

    response.assertRedirectsTo(route('root'))
  })

  test('I can update a project with accessible parcelles', async ({ assert, client, route }) => {
    const territoire = await TerritoireFactory.create()
    const user = await UserFactory.create()
    await user.related('territoires').attach([territoire.id])

    const project = await ProjectFactory.with('user').create()
    await project.related('user').associate(user)

    const exploitation = await ExploitationFactory.create()
    await exploitation.related('territoires').attach([territoire.id])
    const parcelle = await ParcelleFactory.merge({ exploitationId: exploitation.id }).create()

    const response = await client
      .patch(route('projets.update', { projectId: project.id }))
      .loginAs(user)
      .json({ parcelleIds: [parcelle.id] })
      .withCsrfToken()

    response.assertStatus(200)

    await project.load('parcelles')
    assert.equal(project.parcelles.length, 1)
    assert.equal(project.parcelles[0].id, parcelle.id)
  })

  test("I can't update a project with inaccessible parcelles", async ({ client, route }) => {
    const user = await UserFactory.with('territoires', 1).create()
    const project = await ProjectFactory.with('user').create()
    await project.related('user').associate(user)

    const exploitation = await ExploitationFactory.create()
    const parcelle = await ParcelleFactory.merge({ exploitationId: exploitation.id }).create()
    // No shared territoire between user and exploitation

    const response = await client
      .patch(route('projets.update', { projectId: project.id }))
      .loginAs(user)
      .json({ parcelleIds: [parcelle.id] })
      .withCsrfToken()

    response.assertRedirectsTo(route('root'))
  })

  test('I can update a project with existing captages', async ({ assert, client, route }) => {
    const user = await UserFactory.with('territoires', 1).create()
    const project = await ProjectFactory.with('user').create()
    await project.related('user').associate(user)

    const captage = await CaptageFactory.create()

    const response = await client
      .patch(route('projets.update', { projectId: project.id }))
      .loginAs(user)
      .json({ captageIds: [captage.id] })
      .withCsrfToken()

    response.assertStatus(200)

    await project.load('captages')
    assert.equal(project.captages.length, 1)
    assert.equal(project.captages[0].id, captage.id)
  })

  test("I can't update a project with nonexistent captage ids", async ({ client, route }) => {
    const user = await UserFactory.with('territoires', 1).create()
    const project = await ProjectFactory.with('user').create()
    await project.related('user').associate(user)

    const response = await client
      .patch(route('projets.update', { projectId: project.id }))
      .loginAs(user)
      .json({ captageIds: ['00000000-0000-0000-0000-000000000000'] })
      .withCsrfToken()

    response.assertRedirectsTo(route('root'))
  })

  test('Updating relations syncs and replaces previous ones', async ({ assert, client, route }) => {
    const territoire = await TerritoireFactory.create()
    const user = await UserFactory.create()
    await user.related('territoires').attach([territoire.id])

    const project = await ProjectFactory.with('user').create()
    await project.related('user').associate(user)

    const captageA = await CaptageFactory.create()
    const captageB = await CaptageFactory.create()
    await project.related('captages').attach([captageA.id])

    const response = await client
      .patch(route('projets.update', { projectId: project.id }))
      .loginAs(user)
      .json({ captageIds: [captageB.id] })
      .withCsrfToken()

    response.assertStatus(200)

    await project.load('captages')
    assert.equal(project.captages.length, 1)
    assert.equal(project.captages[0].id, captageB.id)
  })
})
