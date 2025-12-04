import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { ExploitationFactory } from '#database/factories/exploitation_factory'
import { UserFactory } from '#database/factories/user_factory'
import { LogEntryTagService } from '#services/log_entry_tag_service'

test.group('Log entry tag service', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('I can create a log entry tag', async ({ assert }) => {
    const user = await UserFactory.create()
    const exploitation = await ExploitationFactory.create()
    const logEntryTagService = new LogEntryTagService()

    const tag = await logEntryTagService.createTagForExploitation(
      exploitation.id,
      user.id,
      'Urgent'
    )

    assert.exists(tag.id)
  })

  test('I can fetch log entry tags', async ({ assert }) => {
    const user = await UserFactory.create()
    const exploitation = await ExploitationFactory.create()
    const logEntryTagService = new LogEntryTagService()

    await logEntryTagService.createTagForExploitation(exploitation.id, user.id, 'Urgent')
    await logEntryTagService.createTagForExploitation(exploitation.id, user.id, 'Follow-up')

    const tags = await logEntryTagService.getTagsForExploitation(exploitation.id)

    assert.lengthOf(tags, 2)
  })

  test('I can update a log entry tag', async ({ assert }) => {
    const user = await UserFactory.create()
    const exploitation = await ExploitationFactory.create()
    const logEntryTagService = new LogEntryTagService()

    const tag = await logEntryTagService.createTagForExploitation(
      exploitation.id,
      user.id,
      'Urgent'
    )

    const updatedTag = await logEntryTagService.updateTag(tag.id, 'High Priority')

    assert.equal(updatedTag.name, 'High Priority')
  })

  test('I can delete a log entry tag', async ({ assert }) => {
    const user = await UserFactory.create()
    const exploitation = await ExploitationFactory.create()
    const logEntryTagService = new LogEntryTagService()

    const tag = await logEntryTagService.createTagForExploitation(
      exploitation.id,
      user.id,
      'Urgent'
    )

    await logEntryTagService.deleteTag(tag.id, exploitation.id)

    const tags = await logEntryTagService.getTagsForExploitation(exploitation.id)

    assert.lengthOf(tags, 0)
  })
})
