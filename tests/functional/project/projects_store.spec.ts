import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import Project, { ProjectStatus } from '#models/project'
import Parcelle from '#models/parcelle'
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

  test('I can create a project with new standalone parcelles via millesime', async ({
    assert,
    client,
    route,
  }) => {
    const user = await UserFactory.with('territoires', 1).create()

    const response = await client
      .post(route('projets.store'))
      .loginAs(user)
      .json({
        name: 'Project with new standalone parcelles',
        millesime: '2024',
        parcelles: [
          { rpgId: 'RPGNEW001', surface: 2.5 },
          { rpgId: 'RPGNEW002', surface: 1.0 },
        ],
      })
      .withCsrfToken()

    response.assertStatus(201)

    // Both parcelles should have been created as standalone (no exploitation)
    const createdParcelles = await Parcelle.query()
      .whereIn('rpgId', ['RPGNEW001', 'RPGNEW002'])
      .andWhere('year', 2024)

    assert.lengthOf(createdParcelles, 2)
    createdParcelles.forEach((p) => assert.isNull(p.exploitationId))

    // Both should be attached to the project
    const body = response.body() as { data: { id: string } }
    const savedProject = await Project.findOrFail(body.data.id)
    await savedProject.load('parcelles')

    assert.equal(savedProject.parcelles.length, 2)
    const attachedRpgIds = savedProject.parcelles.map((p) => p.rpgId).sort()
    assert.deepEqual(attachedRpgIds, ['RPGNEW001', 'RPGNEW002'])
  })

  test('Creating a project via millesime reuses existing accessible parcelles without duplicating them', async ({
    assert,
    client,
    route,
  }) => {
    const territoire = await TerritoireFactory.create()
    const user = await UserFactory.create()
    await user.related('territoires').attach([territoire.id])

    const exploitation = await ExploitationFactory.create()
    await exploitation.related('territoires').attach([territoire.id])

    // Pre-existing parcelle for this rpgId / year
    const existingParcelle = await ParcelleFactory.merge({
      exploitationId: exploitation.id,
      year: 2024,
      rpgId: 'RPGEXST01',
    }).create()

    const response = await client
      .post(route('projets.store'))
      .loginAs(user)
      .json({
        name: 'Project reusing existing parcelle',
        millesime: '2024',
        parcelles: [{ rpgId: 'RPGEXST01', surface: 3.0 }],
      })
      .withCsrfToken()

    response.assertStatus(201)

    // No duplicate should have been created
    const allMatchingParcelles = await Parcelle.query()
      .where('rpgId', 'RPGEXST01')
      .andWhere('year', 2024)
    assert.lengthOf(allMatchingParcelles, 1)

    // The existing parcelle should be attached to the project
    const body = response.body() as { data: { id: string } }
    const savedProject = await Project.findOrFail(body.data.id)
    await savedProject.load('parcelles')

    assert.equal(savedProject.parcelles.length, 1)
    assert.equal(savedProject.parcelles[0].id, existingParcelle.id)
  })

  test("I can't create a project with parcelles but without a millesime", async ({
    client,
    route,
  }) => {
    const user = await UserFactory.with('territoires', 1).create()

    const response = await client
      .post(route('projets.store'))
      .loginAs(user)
      .json({
        name: 'Project missing millesime',
        parcelles: [{ rpgId: 'RPGNOMILL', surface: 1.5 }],
        // millesime intentionally omitted
      })
      .withCsrfToken()

    response.assertRedirectsTo(route('root'))
  })

  test("I can't create a project via millesime when an existing parcelle belongs to an inaccessible exploitation", async ({
    client,
    route,
  }) => {
    const user = await UserFactory.with('territoires', 1).create()

    // Exploitation with no shared territoire with the user
    const inaccessibleExploitation = await ExploitationFactory.create()
    await ParcelleFactory.merge({
      exploitationId: inaccessibleExploitation.id,
      year: 2024,
      rpgId: 'RPGINACC01',
    }).create()

    const response = await client
      .post(route('projets.store'))
      .loginAs(user)
      .json({
        name: 'Project with inaccessible millesime parcelle',
        millesime: '2024',
        parcelles: [{ rpgId: 'RPGINACC01', surface: 2.0 }],
      })
      .withCsrfToken()

    response.assertRedirectsTo(route('root'))
  })

  test('Duplicate parcelles input with same rpgId creates only one parcelle', async ({
    assert,
    client,
    route,
  }) => {
    const user = await UserFactory.with('territoires', 1).create()

    const rpgId = 'RPGDUP001'
    const response = await client
      .post(route('projets.store'))
      .loginAs(user)
      .json({
        name: 'Project with duplicated parcelles input',
        millesime: '2024',
        parcelles: [
          { rpgId, surface: 1.23 },
          { rpgId, surface: 4.56 },
        ],
      })
      .withCsrfToken()

    response.assertStatus(201)

    const createdParcelles = await Parcelle.query().where('rpgId', rpgId).andWhere('year', 2024)
    assert.lengthOf(createdParcelles, 1)

    const body = response.body() as { data: { id: string } }
    const savedProject = await Project.findOrFail(body.data.id)
    await savedProject.load('parcelles')

    assert.equal(savedProject.parcelles.length, 1)
    assert.equal(savedProject.parcelles[0].id, createdParcelles[0].id)
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
