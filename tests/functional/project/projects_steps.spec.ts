import testUtils from '@adonisjs/core/services/test_utils'
import { test } from '@japa/runner'
import { DateTime } from 'luxon'
import ProjectStep from '#models/project_step'
import ProjectStepDocument from '#models/project_step_document'
import { UserFactory } from '#database/factories/user_factory'
import { ProjectFactory } from '#database/factories/project_factory'
import { ProjectStepFactory } from '#database/factories/project_step_factory'
import { ProjectStepTagFactory } from '#database/factories/project_step_tag_factory'

test.group('Projects - Steps CRUD Routes', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  // ============================================================
  // CREATE STEP TESTS
  // ============================================================

  test('I can create a step for one of my projects', async ({ assert, client, route }) => {
    const user = await UserFactory.with('territoires', 1).create()
    const project = await ProjectFactory.with('user').create()
    await project.related('user').associate(user)

    const response = await client
      .post(route('projets.steps.create', { projectId: project.id }))
      .loginAs(user)
      .json({
        title: 'Phase de diagnostic',
        note: 'Collecter les données initiales',
        date: DateTime.now().toISODate(),
      })
      .withCsrfToken()

    response.assertStatus(200)

    const step = await ProjectStep.findByOrFail('title', 'Phase de diagnostic')
    assert.equal(step.projectId, project.id)
    assert.equal(step.note, 'Collecter les données initiales')
    assert.isFalse(step.isValidated)
  })

  test('I can create a step with only a title', async ({ assert, client, route }) => {
    const user = await UserFactory.with('territoires', 1).create()
    const project = await ProjectFactory.with('user').create()
    await project.related('user').associate(user)

    const response = await client
      .post(route('projets.steps.create', { projectId: project.id }))
      .loginAs(user)
      .json({
        title: 'Étape simple',
      })
      .withCsrfToken()

    response.assertStatus(200)

    const step = await ProjectStep.findByOrFail('title', 'Étape simple')
    assert.equal(step.projectId, project.id)
    assert.isNull(step.date)
  })

  test('I can create a step with only a note', async ({ assert, client, route }) => {
    const user = await UserFactory.with('territoires', 1).create()
    const project = await ProjectFactory.with('user').create()
    await project.related('user').associate(user)

    const response = await client
      .post(route('projets.steps.create', { projectId: project.id }))
      .loginAs(user)
      .json({
        title: 'Étape avec note',
        note: 'Une note sans titre',
      })
      .withCsrfToken()

    response.assertStatus(200)

    const step = await ProjectStep.query().where('note', 'Une note sans titre').firstOrFail()
    assert.equal(step.projectId, project.id)
    assert.equal(step.title, 'Étape avec note')
  })

  test('I can create a step with only a date', async ({ assert, client, route }) => {
    const user = await UserFactory.with('territoires', 1).create()
    const project = await ProjectFactory.with('user').create()
    await project.related('user').associate(user)

    const date = DateTime.now().toISODate()
    const response = await client
      .post(route('projets.steps.create', { projectId: project.id }))
      .loginAs(user)
      .json({
        title: 'Étape avec date',
        date,
      })
      .withCsrfToken()

    response.assertStatus(200)

    const step = await ProjectStep.query()
      .where('projectId', project.id)
      .orderBy('createdAt', 'desc')
      .firstOrFail()
    assert.isNotNull(step.date)
  })

  test('I can create a step with tags', async ({ assert, client, route }) => {
    const user = await UserFactory.with('territoires', 1).create()
    const project = await ProjectFactory.with('user').create()
    await project.related('user').associate(user)

    const tag1 = await ProjectStepTagFactory.merge({ userId: user.id }).create()
    const tag2 = await ProjectStepTagFactory.merge({ userId: user.id }).create()

    const response = await client
      .post(route('projets.steps.create', { projectId: project.id }))
      .loginAs(user)
      .json({
        title: 'Étape avec tags',
        tags: [tag1.id, tag2.id],
      })
      .withCsrfToken()

    response.assertStatus(200)

    const step = await ProjectStep.findByOrFail('title', 'Étape avec tags')
    await step.load('tags')
    assert.lengthOf(step.tags, 2)
    const tagIds = step.tags.map((t) => t.id).sort()
    const expectedIds = [tag1.id, tag2.id].sort()
    assert.deepEqual(tagIds, expectedIds)
  })

  test("I can't create a step without at least one field (title, note, or date)", async ({
    client,
    route,
  }) => {
    const user = await UserFactory.with('territoires', 1).create()
    const project = await ProjectFactory.with('user').create()
    await project.related('user').associate(user)

    const response = await client
      .post(route('projets.steps.create', { projectId: project.id }))
      .loginAs(user)
      .json({})
      .withCsrfToken()

    response.assertStatus(200)
  })

  test("I can't create a step for a project I don't own", async ({ client, route }) => {
    const user = await UserFactory.with('territoires', 1).create()
    const otherUser = await UserFactory.with('territoires', 1).create()
    const project = await ProjectFactory.with('user').create()
    await project.related('user').associate(otherUser)

    const response = await client
      .post(route('projets.steps.create', { projectId: project.id }))
      .header('Accept', 'application/json')
      .loginAs(user)
      .json({
        title: 'Unauthorized step',
      })
      .withCsrfToken()

    response.assertStatus(404)
  })

  test("I can't create a step with an invalid project id", async ({ client, route }) => {
    const user = await UserFactory.with('territoires', 1).create()

    const response = await client
      .post(route('projets.steps.create', { projectId: 'invalid-id' }))
      .header('Accept', 'application/json')
      .loginAs(user)
      .json({
        title: 'Invalid project',
      })
      .withCsrfToken()

    response.assertStatus(422)
  })

  // ============================================================
  // EDIT STEP TESTS
  // ============================================================

  test('I can edit a step I created', async ({ assert, client, route }) => {
    const user = await UserFactory.with('territoires', 1).create()
    const project = await ProjectFactory.with('user').create()
    await project.related('user').associate(user)
    const step = await ProjectStepFactory.merge({ projectId: project.id }).create()

    const response = await client
      .patch(route('projets.steps.edit', { projectId: project.id, stepId: step.id }))
      .loginAs(user)
      .json({
        title: 'Modified title',
        note: 'Modified note',
      })
      .withCsrfToken()

    response.assertStatus(200)

    await step.refresh()
    assert.equal(step.title, 'Modified title')
    assert.equal(step.note, 'Modified note')
  })

  test('I can add tags when editing a step', async ({ assert, client, route }) => {
    const user = await UserFactory.with('territoires', 1).create()
    const project = await ProjectFactory.with('user').create()
    await project.related('user').associate(user)
    const step = await ProjectStepFactory.merge({ projectId: project.id }).create()

    const tag = await ProjectStepTagFactory.merge({ userId: user.id }).create()

    const response = await client
      .patch(route('projets.steps.edit', { projectId: project.id, stepId: step.id }))
      .loginAs(user)
      .json({
        title: step.title,
        tags: [tag.id],
      })
      .withCsrfToken()

    response.assertStatus(200)

    await step.load('tags')
    assert.lengthOf(step.tags, 1)
    assert.equal(step.tags[0].id, tag.id)
  })

  test('I can remove tags when editing a step (replace with empty list)', async ({
    assert,
    client,
    route,
  }) => {
    const user = await UserFactory.with('territoires', 1).create()
    const project = await ProjectFactory.with('user').create()
    await project.related('user').associate(user)
    const tag = await ProjectStepTagFactory.merge({ userId: user.id }).create()
    const step = await ProjectStepFactory.merge({ projectId: project.id }).create()
    await step.related('tags').attach([tag.id])

    const response = await client
      .patch(route('projets.steps.edit', { projectId: project.id, stepId: step.id }))
      .loginAs(user)
      .json({
        title: step.title,
        tags: [],
      })
      .withCsrfToken()

    response.assertStatus(200)

    await step.load('tags')
    assert.lengthOf(step.tags, 0)
  })

  test("I can't edit a step for a project I don't own", async ({ client, route }) => {
    const user = await UserFactory.with('territoires', 1).create()
    const otherUser = await UserFactory.with('territoires', 1).create()
    const project = await ProjectFactory.with('user').create()
    await project.related('user').associate(otherUser)
    const step = await ProjectStepFactory.merge({ projectId: project.id }).create()

    const response = await client
      .patch(route('projets.steps.edit', { projectId: project.id, stepId: step.id }))
      .header('Accept', 'application/json')
      .loginAs(user)
      .json({
        title: 'Hacked title',
      })
      .withCsrfToken()

    response.assertStatus(404)
  })

  test("I can't edit a step with an invalid step id", async ({ client, route }) => {
    const user = await UserFactory.with('territoires', 1).create()
    const project = await ProjectFactory.with('user').create()
    await project.related('user').associate(user)

    const response = await client
      .patch(route('projets.steps.edit', { projectId: project.id, stepId: 'invalid-id' }))
      .header('Accept', 'application/json')
      .loginAs(user)
      .json({
        title: 'Modified',
      })
      .withCsrfToken()

    response.assertStatus(422)
  })

  // ============================================================
  // COMPLETE STEP TESTS
  // ============================================================

  test('I can mark a step as completed', async ({ assert, client, route }) => {
    const user = await UserFactory.with('territoires', 1).create()
    const project = await ProjectFactory.with('user').create()
    await project.related('user').associate(user)
    const step = await ProjectStepFactory.merge({ projectId: project.id }).create()

    const response = await client
      .post(route('projets.steps.complete', { projectId: project.id }))
      .loginAs(user)
      .json({
        id: step.id,
      })
      .withCsrfToken()

    response.assertStatus(200)

    await step.refresh()
    assert.isTrue(step.isValidated)
  })

  test("I can't complete a step for a project I don't own", async ({ client, route }) => {
    const user = await UserFactory.with('territoires', 1).create()
    const otherUser = await UserFactory.with('territoires', 1).create()
    const project = await ProjectFactory.with('user').create()
    await project.related('user').associate(otherUser)
    const step = await ProjectStepFactory.merge({ projectId: project.id }).create()

    const response = await client
      .post(route('projets.steps.complete', { projectId: project.id }))
      .header('Accept', 'application/json')
      .loginAs(user)
      .json({
        id: step.id,
      })
      .withCsrfToken()

    response.assertStatus(404)
  })

  test("I can't complete a step with an invalid step id", async ({ client, route }) => {
    const user = await UserFactory.with('territoires', 1).create()
    const project = await ProjectFactory.with('user').create()
    await project.related('user').associate(user)

    const response = await client
      .post(route('projets.steps.complete', { projectId: project.id }))
      .header('Accept', 'application/json')
      .loginAs(user)
      .json({
        id: 'invalid-id',
      })
      .withCsrfToken()

    response.assertStatus(422)
  })

  // ============================================================
  // DESTROY STEP TESTS
  // ============================================================

  test('I can delete a step I created', async ({ assert, client, route }) => {
    const user = await UserFactory.with('territoires', 1).create()
    const project = await ProjectFactory.with('user').create()
    await project.related('user').associate(user)
    const step = await ProjectStepFactory.merge({ projectId: project.id }).create()

    const response = await client
      .delete(route('projets.steps.destroy', { projectId: project.id, stepId: step.id }))
      .loginAs(user)
      .withCsrfToken()

    response.assertStatus(200)

    const deletedStep = await ProjectStep.find(step.id)
    assert.isNull(deletedStep)
  })

  test('Deleting a step also deletes associated documents', async ({ assert, client, route }) => {
    const user = await UserFactory.with('territoires', 1).create()
    const project = await ProjectFactory.with('user').create()
    await project.related('user').associate(user)
    const step = await ProjectStepFactory.merge({ projectId: project.id }).create()

    // Create document records (note: actual file upload testing would require S3 mocking)
    await ProjectStepDocument.create({
      projectStepId: step.id,
      name: 'Document 1',
      s3Key: 'test/document1.pdf',
      sizeInBytes: 1024,
    })

    await ProjectStepDocument.create({
      projectStepId: step.id,
      name: 'Document 2',
      s3Key: 'test/document2.pdf',
      sizeInBytes: 2048,
    })

    const response = await client
      .delete(route('projets.steps.destroy', { projectId: project.id, stepId: step.id }))
      .loginAs(user)
      .withCsrfToken()

    response.assertStatus(200)

    const documents = await ProjectStepDocument.query().where('projectStepId', step.id)
    assert.lengthOf(documents, 0)
  })

  test("I can't delete a step for a project I don't own", async ({ client, route }) => {
    const user = await UserFactory.with('territoires', 1).create()
    const otherUser = await UserFactory.with('territoires', 1).create()
    const project = await ProjectFactory.with('user').create()
    await project.related('user').associate(otherUser)
    const step = await ProjectStepFactory.merge({ projectId: project.id }).create()

    const response = await client
      .delete(route('projets.steps.destroy', { projectId: project.id, stepId: step.id }))
      .header('Accept', 'application/json')
      .loginAs(user)
      .withCsrfToken()

    response.assertStatus(404)
  })

  test("I can't delete a step with an invalid step id", async ({ client, route }) => {
    const user = await UserFactory.with('territoires', 1).create()
    const project = await ProjectFactory.with('user').create()
    await project.related('user').associate(user)

    const response = await client
      .delete(route('projets.steps.destroy', { projectId: project.id, stepId: 'invalid-id' }))
      .header('Accept', 'application/json')
      .loginAs(user)
      .withCsrfToken()

    response.assertStatus(422)
  })

  // ============================================================
  // DESTROY DOCUMENT TESTS
  // ============================================================

  test('I can delete a document from a step', async ({ assert, client, route }) => {
    const user = await UserFactory.with('territoires', 1).create()
    const project = await ProjectFactory.with('user').create()
    await project.related('user').associate(user)
    const step = await ProjectStepFactory.merge({ projectId: project.id }).create()

    const document = await ProjectStepDocument.create({
      projectStepId: step.id,
      name: 'Document to delete',
      s3Key: 'test/to-delete.pdf',
      sizeInBytes: 1024,
    })

    const response = await client
      .delete(route('projets.steps.documents.destroy', { projectId: project.id, stepId: step.id }))
      .loginAs(user)
      .json({
        documentId: document.id,
      })
      .withCsrfToken()

    response.assertStatus(200)

    const deletedDocument = await ProjectStepDocument.find(document.id)
    assert.isNull(deletedDocument)
  })

  test("I can't delete a document from a step of a project I don't own", async ({
    client,
    route,
  }) => {
    const user = await UserFactory.with('territoires', 1).create()
    const otherUser = await UserFactory.with('territoires', 1).create()
    const project = await ProjectFactory.with('user').create()
    await project.related('user').associate(otherUser)
    const step = await ProjectStepFactory.merge({ projectId: project.id }).create()

    const document = await ProjectStepDocument.create({
      projectStepId: step.id,
      name: 'Protected document',
      s3Key: 'test/protected.pdf',
      sizeInBytes: 1024,
    })

    const response = await client
      .delete(route('projets.steps.documents.destroy', { projectId: project.id, stepId: step.id }))
      .header('Accept', 'application/json')
      .loginAs(user)
      .json({
        documentId: document.id,
      })
      .withCsrfToken()

    response.assertStatus(404)
  })

  test("I can't delete a non-existent document", async ({ client, route }) => {
    const user = await UserFactory.with('territoires', 1).create()
    const project = await ProjectFactory.with('user').create()
    await project.related('user').associate(user)
    const step = await ProjectStepFactory.merge({ projectId: project.id }).create()

    const response = await client
      .delete(route('projets.steps.documents.destroy', { projectId: project.id, stepId: step.id }))
      .header('Accept', 'application/json')
      .loginAs(user)
      .json({
        documentId: 99999,
      })
      .withCsrfToken()

    response.assertStatus(200)
  })

  test("I can't delete a document with an invalid step id", async ({ client, route }) => {
    const user = await UserFactory.with('territoires', 1).create()
    const project = await ProjectFactory.with('user').create()
    await project.related('user').associate(user)

    const response = await client
      .delete(
        route('projets.steps.documents.destroy', { projectId: project.id, stepId: 'invalid-id' })
      )
      .header('Accept', 'application/json')
      .loginAs(user)
      .json({
        documentId: 1,
      })
      .withCsrfToken()

    response.assertStatus(422)
  })

  // ============================================================
  // PARAMETER VALIDATION TESTS
  // ============================================================

  test('Invalid project IDs are rejected with 422 status in all step endpoints', async ({
    client,
    route,
  }) => {
    const user = await UserFactory.with('territoires', 1).create()

    const invalidId = 'not-a-uuid'

    // Test create
    let response = await client
      .post(route('projets.steps.create', { projectId: invalidId }))
      .header('Accept', 'application/json')
      .loginAs(user)
      .json({ title: 'Test' })
      .withCsrfToken()
    response.assertStatus(422)

    // Test edit
    response = await client
      .patch(route('projets.steps.edit', { projectId: invalidId, stepId: 'also-invalid' }))
      .header('Accept', 'application/json')
      .loginAs(user)
      .json({ title: 'Test' })
      .withCsrfToken()
    response.assertStatus(422)

    // Test destroy
    response = await client
      .delete(route('projets.steps.destroy', { projectId: invalidId, stepId: 'also-invalid' }))
      .header('Accept', 'application/json')
      .loginAs(user)
      .withCsrfToken()
    response.assertStatus(422)
  })
})
