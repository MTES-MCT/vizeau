import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { UserFactory } from '#database/factories/user_factory'
import { ProjectFactory } from '#database/factories/project_factory'
import { ProjectStepTagFactory } from '#database/factories/project_step_tag_factory'
import { ProjectStepTagService } from '#services/project_step_tag_service'
import { ProjectStepService } from '#services/project_step_service'

test.group('ProjectStepTagService', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('I can create a tag for a user', async ({ assert }) => {
    const user = await UserFactory.create()
    const service = new ProjectStepTagService()

    const tag = await service.createTagForUser(user.id, 'Urgent')

    assert.exists(tag.id)
    assert.equal(tag.name, 'Urgent')
    assert.equal(tag.userId, user.id)
  })

  test('I can fetch tags for a user', async ({ assert }) => {
    const user = await UserFactory.create()
    const service = new ProjectStepTagService()

    await service.createTagForUser(user.id, 'Urgent')
    await service.createTagForUser(user.id, 'Follow-up')

    const tags = await service.getTagsForUser(user.id)

    assert.lengthOf(tags, 2)
  })

  test('Tags from another user are not returned', async ({ assert }) => {
    const user1 = await UserFactory.create()
    const user2 = await UserFactory.create()
    const service = new ProjectStepTagService()

    await service.createTagForUser(user1.id, 'Urgent')
    await service.createTagForUser(user2.id, 'Follow-up')

    const tags = await service.getTagsForUser(user1.id)

    assert.lengthOf(tags, 1)
    assert.equal(tags[0].name, 'Urgent')
  })

  test('I can filter tags by search query', async ({ assert }) => {
    const user = await UserFactory.create()
    const service = new ProjectStepTagService()

    await service.createTagForUser(user.id, 'Urgent')
    await service.createTagForUser(user.id, 'Follow-up')
    await service.createTagForUser(user.id, 'Urge me')

    const tags = await service.getTagsForUser(user.id, 'Urge')

    assert.lengthOf(tags, 2)
  })

  test('I can limit the number of tags returned', async ({ assert }) => {
    const user = await UserFactory.create()
    const service = new ProjectStepTagService()

    await service.createTagForUser(user.id, 'Tag 1')
    await service.createTagForUser(user.id, 'Tag 2')
    await service.createTagForUser(user.id, 'Tag 3')

    const tags = await service.getTagsForUser(user.id, undefined, 2)

    assert.lengthOf(tags, 2)
  })

  test('I can get tags for a step', async ({ assert }) => {
    const user = await UserFactory.create()
    const project = await ProjectFactory.merge({ userId: user.id }).create()
    const tags = await ProjectStepTagFactory.merge({ userId: user.id }).createMany(2)

    const stepService = new ProjectStepService()
    const step = await stepService.createStep(
      project,
      { title: 'Step' },
      tags.map((t) => t.id)
    )

    const service = new ProjectStepTagService()
    const stepTags = await service.getTagsForStep(step.id)

    assert.lengthOf(stepTags, 2)
    assert.deepEqual(stepTags.map((t) => t.id).sort(), tags.map((t) => t.id).sort())
  })

  test('getTagsForStep returns empty array when stepId is undefined', async ({ assert }) => {
    const service = new ProjectStepTagService()

    const tags = await service.getTagsForStep(undefined)

    assert.deepEqual(tags, [])
  })

  test('I can update a tag', async ({ assert }) => {
    const user = await UserFactory.create()
    const service = new ProjectStepTagService()

    const tag = await service.createTagForUser(user.id, 'Urgent')
    const updated = await service.updateTag(tag.id, 'High Priority', user.id)

    assert.equal(updated.name, 'High Priority')
  })

  test("I cannot update a tag that doesn't belong to me", async ({ assert }) => {
    const user1 = await UserFactory.create()
    const user2 = await UserFactory.create()
    const service = new ProjectStepTagService()

    const tag = await service.createTagForUser(user1.id, 'Urgent')

    await assert.rejects(async () => {
      await service.updateTag(tag.id, 'High Priority', user2.id)
    })
  })

  test('I can delete a tag', async ({ assert }) => {
    const user = await UserFactory.create()
    const service = new ProjectStepTagService()

    const tag = await service.createTagForUser(user.id, 'Urgent')
    await service.deleteTag(tag.id, user.id)

    const tags = await service.getTagsForUser(user.id)
    assert.lengthOf(tags, 0)
  })

  test("I cannot delete a tag that doesn't belong to me", async ({ assert }) => {
    const user1 = await UserFactory.create()
    const user2 = await UserFactory.create()
    const service = new ProjectStepTagService()

    const tag = await service.createTagForUser(user1.id, 'Urgent')

    await assert.rejects(async () => {
      await service.deleteTag(tag.id, user2.id)
    })
  })
})
