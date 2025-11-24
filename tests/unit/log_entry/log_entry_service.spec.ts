import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { LogEntryService } from '#services/log_entry_service'
import { ExploitationFactory } from '#database/factories/exploitation_factory'
import { UserFactory } from '#database/factories/user_factory'

test.group('LogEntryService', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('I can create a log entry', async ({ assert }) => {
    const user = await UserFactory.create()
    const exploitation = await ExploitationFactory.with('tags', 5, (builder) =>
      builder.merge({ userId: user.id })
    ).create()

    const logEntryService = new LogEntryService()
    const logData = {
      notes: 'This is a test log entry',
      userId: user.id,
      exploitationId: exploitation.id,
      tags: exploitation.tags.map((tag) => tag.id),
    }
    const logEntry = await logEntryService.createLogEntry(logData)
    await logEntry.load('tags')

    assert.exists(logEntry.id)
    assert.equal(logEntry.notes, logData.notes)
    assert.equal(logEntry.userId, logData.userId)
    assert.equal(logEntry.exploitationId, logData.exploitationId)
    assert.deepEqual(
      logEntry.tags.map((tag) => tag.id),
      logData.tags
    )
  })

  test('I can get log entries for an exploitation', async ({ assert }) => {
    const user = await UserFactory.create()
    const exploitation = await ExploitationFactory.with('tags', 5, (builder) =>
      builder.merge({ userId: user.id })
    ).create()
    const logEntryService = new LogEntryService()

    // Create multiple log entries
    for (let i = 0; i < 3; i++) {
      await logEntryService.createLogEntry({
        notes: `Log entry ${i + 1}`,
        userId: user.id,
        exploitationId: exploitation.id,
        tags: exploitation.tags.slice(0, 2).map((tag) => tag.id),
      })
    }
    const paginatedLogs = await logEntryService.getLogForExploitation(exploitation.id)
    const paginatedLogsJson = paginatedLogs.toJSON()

    assert.equal(paginatedLogsJson.meta?.total, 3)
    assert.equal(paginatedLogsJson.meta?.currentPage, 1)
    assert.equal(paginatedLogsJson?.data.length, 3)
  })

  test('I can update a log entry', async ({ assert }) => {
    const user = await UserFactory.create()
    const exploitation = await ExploitationFactory.with('tags', 5, (builder) =>
      builder.merge({ userId: user.id })
    ).create()
    const logEntryService = new LogEntryService()

    const logEntry = await logEntryService.createLogEntry({
      notes: 'Original log entry',
      userId: user.id,
      exploitationId: exploitation.id,
      tags: exploitation.tags.slice(0, 2).map((tag) => tag.id),
    })

    const updatedNotes = 'Updated log entry'
    const updatedLogEntry = await logEntryService.updateLogEntry(logEntry.id, {
      notes: updatedNotes,
    })

    assert.equal(updatedLogEntry.notes, updatedNotes)
  })

  test('I can update a log entry tags', async ({ assert }) => {
    const user = await UserFactory.create()
    const exploitation = await ExploitationFactory.with('tags', 5, (builder) =>
      builder.merge({ userId: user.id })
    ).create()
    const logEntryService = new LogEntryService()

    const logEntry = await logEntryService.createLogEntry({
      notes: 'Original log entry',
      userId: user.id,
      exploitationId: exploitation.id,
      tags: exploitation.tags.slice(0, 2).map((tag) => tag.id),
    })

    const newTagIds = exploitation.tags.slice(2, 4).map((tag) => tag.id)
    const updatedLogEntry = await logEntryService.updateLogEntry(logEntry.id, {
      tags: newTagIds,
    })
    await updatedLogEntry.load('tags')

    assert.deepEqual(
      updatedLogEntry.tags.map((tag) => tag.id),
      newTagIds
    )
  })

  test('I can delete a log entry', async ({ assert }) => {
    const user = await UserFactory.create()
    const exploitation = await ExploitationFactory.with('tags', 5, (builder) =>
      builder.merge({ userId: user.id })
    ).create()
    const logEntryService = new LogEntryService()

    const logEntry = await logEntryService.createLogEntry({
      notes: 'Log entry to be deleted',
      userId: user.id,
      exploitationId: exploitation.id,
    })

    const deletedLogEntry = await logEntryService.deleteLogEntry(logEntry.id)

    assert.equal(deletedLogEntry.id, logEntry.id)

    // Verify that the log entry no longer exists
    const fetchedLogEntry = await logEntryService.getLogForExploitation(exploitation.id)
    const fetchedLogEntryJson = fetchedLogEntry.toJSON()

    assert.equal(
      fetchedLogEntryJson.data.find((entry) => entry.id === logEntry.id),
      undefined
    )
  })
})
