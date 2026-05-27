import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { ProjectStepService } from '#services/project_step_service'
import { UserFactory } from '#database/factories/user_factory'
import { ProjectFactory } from '#database/factories/project_factory'
import { ProjectStepTagFactory } from '#database/factories/project_step_tag_factory'
import ProjectStepDocument from '#models/project_step_document'

test.group('ProjectStepService', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('I can create a step', async ({ assert }) => {
    const user = await UserFactory.create()
    const project = await ProjectFactory.merge({ userId: user.id }).create()
    const tags = await ProjectStepTagFactory.merge({ userId: user.id }).createMany(3)

    const service = new ProjectStepService()
    const step = await service.createStep(
      project,
      { title: 'Step 1', note: 'A note' },
      tags.map((t) => t.id)
    )
    await step.load('tags')

    assert.exists(step.id)
    assert.equal(step.title, 'Step 1')
    assert.equal(step.note, 'A note')
    assert.equal(step.projectId, project.id)
    assert.equal(step.tags.length, 3)
  })

  test('I can get all steps for a project', async ({ assert }) => {
    const user = await UserFactory.create()
    const project = await ProjectFactory.merge({ userId: user.id }).create()

    const service = new ProjectStepService()
    await service.createStep(project, { title: 'Step 1' })
    await service.createStep(project, { title: 'Step 2' })
    await service.createStep(project, { title: 'Step 3' })

    const steps = await service.getStepsForProject(project)

    assert.equal(steps.length, 3)
    // Tags and documents should be preloaded
    assert.isArray(steps[0].tags)
    assert.isArray(steps[0].documents)
  })

  test('I can update a step', async ({ assert }) => {
    const user = await UserFactory.create()
    const project = await ProjectFactory.merge({ userId: user.id }).create()

    const service = new ProjectStepService()
    const step = await service.createStep(project, { title: 'Original title' })

    const updated = await service.updateStep(step.id, project, {
      title: 'Updated title',
      isValidated: true,
    })

    assert.equal(updated.title, 'Updated title')
    assert.equal(updated.isValidated, true)
  })

  test('I can update the tags of a step', async ({ assert }) => {
    const user = await UserFactory.create()
    const project = await ProjectFactory.merge({ userId: user.id }).create()
    const initialTags = await ProjectStepTagFactory.merge({ userId: user.id }).createMany(2)
    const newTags = await ProjectStepTagFactory.merge({ userId: user.id }).createMany(2)

    const service = new ProjectStepService()
    const step = await service.createStep(
      project,
      { title: 'Step' },
      initialTags.map((t) => t.id)
    )

    const updated = await service.updateStep(
      step.id,
      project,
      {},
      newTags.map((t) => t.id)
    )
    await updated.load('tags')

    assert.deepEqual(
      updated.tags.map((t) => t.id),
      newTags.map((t) => t.id)
    )
  })

  test('I can delete a step', async ({ assert }) => {
    const user = await UserFactory.create()
    const project = await ProjectFactory.merge({ userId: user.id }).create()

    const service = new ProjectStepService()
    const step = await service.createStep(project, { title: 'To delete' })

    const deleted = await service.deleteStep(step.id, project)
    assert.equal(deleted.id, step.id)

    const remaining = await service.getStepsForProject(project)
    assert.equal(remaining.length, 0)
  })

  test('I can find a document that belongs to one of my steps', async ({ assert }) => {
    const user = await UserFactory.create()
    const project = await ProjectFactory.merge({ userId: user.id }).create()

    const service = new ProjectStepService()
    const step = await service.createStep(project, { title: 'Step with doc' })

    const doc = await ProjectStepDocument.create({
      projectStepId: step.id,
      name: 'file.pdf',
      s3Key: 's3/file.pdf',
      sizeInBytes: 512,
    })

    const found = await service.findDocument(doc.id, user.id)

    assert.isNotNull(found)
    assert.equal(found!.id, doc.id)
  })

  test('I cannot find a document that belongs to another user', async ({ assert }) => {
    const user = await UserFactory.create()
    const otherUser = await UserFactory.create()
    const project = await ProjectFactory.merge({ userId: otherUser.id }).create()

    const service = new ProjectStepService()
    const step = await service.createStep(project, { title: 'Step' })

    const doc = await ProjectStepDocument.create({
      projectStepId: step.id,
      name: 'secret.pdf',
      s3Key: 's3/secret.pdf',
      sizeInBytes: 1024,
    })

    const found = await service.findDocument(doc.id, user.id)

    assert.isNull(found)
  })
})
