import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import Project, { ProjectStatus } from '#models/project'
import { UserFactory } from '#database/factories/user_factory'
import { ExploitationFactory } from '#database/factories/exploitation_factory'
import { ParcelleFactory } from '#database/factories/parcelle_factory'
import { CaptageFactory } from '#database/factories/captage_factory'
import { TerritoireFactory } from '#database/factories/territoire_factory'

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

  test('I can create a project with accessible exploitations', async ({
    assert,
    client,
    route,
  }) => {
    const territoire = await TerritoireFactory.create()
    const user = await UserFactory.create()
    await user.related('territoires').attach([territoire.id])

    const exploitation = await ExploitationFactory.create()
    await exploitation.related('territoires').attach([territoire.id])

    const response = await client
      .post(route('projets.store'))
      .loginAs(user)
      .json({
        name: 'Project with exploitations',
        exploitationIds: [exploitation.id],
      })
      .withCsrfToken()

    response.assertStatus(201)

    const body = response.body() as { data: { id: string } }
    const savedProject = await Project.findOrFail(body.data.id)
    await savedProject.load('exploitations')

    assert.equal(savedProject.exploitations.length, 1)
    assert.equal(savedProject.exploitations[0].id, exploitation.id)
  })

  test("I can't create a project with exploitations not accessible to the user", async ({
    client,
    route,
  }) => {
    const user = await UserFactory.with('territoires', 1).create()
    const exploitation = await ExploitationFactory.create()
    // No shared territoire between user and exploitation

    const response = await client
      .post(route('projets.store'))
      .loginAs(user)
      .json({
        name: 'Project with inaccessible exploitations',
        exploitationIds: [exploitation.id],
      })
      .withCsrfToken()

    response.assertRedirectsTo(route('root'))
  })

  test('I can create a project with accessible parcelles', async ({ assert, client, route }) => {
    const territoire = await TerritoireFactory.create()
    const user = await UserFactory.create()
    await user.related('territoires').attach([territoire.id])

    const exploitation = await ExploitationFactory.create()
    await exploitation.related('territoires').attach([territoire.id])

    const parcelle = await ParcelleFactory.merge({ exploitationId: exploitation.id }).create()

    const response = await client
      .post(route('projets.store'))
      .loginAs(user)
      .json({
        name: 'Project with parcelles',
        parcelleIds: [parcelle.id],
      })
      .withCsrfToken()

    response.assertStatus(201)

    const body = response.body() as { data: { id: string } }
    const savedProject = await Project.findOrFail(body.data.id)
    await savedProject.load('parcelles')

    assert.equal(savedProject.parcelles.length, 1)
    assert.equal(savedProject.parcelles[0].id, parcelle.id)
  })

  test("I can't create a project with parcelles not accessible to the user", async ({
    client,
    route,
  }) => {
    const user = await UserFactory.with('territoires', 1).create()
    // Exploitation without shared territoire with the user
    const exploitation = await ExploitationFactory.create()
    const parcelle = await ParcelleFactory.merge({ exploitationId: exploitation.id }).create()

    const response = await client
      .post(route('projets.store'))
      .loginAs(user)
      .json({
        name: 'Project with inaccessible parcelles',
        parcelleIds: [parcelle.id],
      })
      .withCsrfToken()

    response.assertRedirectsTo(route('root'))
  })

  test('I can create a project with existing captages', async ({ assert, client, route }) => {
    const user = await UserFactory.with('territoires', 1).create()
    const captage = await CaptageFactory.create()

    const response = await client
      .post(route('projets.store'))
      .loginAs(user)
      .json({
        name: 'Project with captages',
        captageIds: [captage.id],
      })
      .withCsrfToken()

    response.assertStatus(201)

    const body = response.body() as { data: { id: string } }
    const savedProject = await Project.findOrFail(body.data.id)
    await savedProject.load('captages')

    assert.equal(savedProject.captages.length, 1)
    assert.equal(savedProject.captages[0].id, captage.id)
  })

  test("I can't create a project with nonexistent captage ids", async ({ client, route }) => {
    const user = await UserFactory.with('territoires', 1).create()

    const response = await client
      .post(route('projets.store'))
      .loginAs(user)
      .json({
        name: 'Project with bad captages',
        captageIds: ['00000000-0000-0000-0000-000000000000'],
      })
      .withCsrfToken()

    response.assertRedirectsTo(route('root'))
  })
})
