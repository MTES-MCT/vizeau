import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { LogEntryService } from '#services/log_entry_service'
import { ExploitationFactory } from '#database/factories/exploitation_factory'
import { UserFactory } from '#database/factories/user_factory'
import { LogEntryTagFactory } from '#database/factories/log_entry_tag_factory'
import { DateTime } from 'luxon'

test.group('LogEntryService', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('I can create a log entry', async ({ assert }) => {
    const user = await UserFactory.create()
    const exploitation = await ExploitationFactory.create()
    const tags = await LogEntryTagFactory.merge({
      userId: user.id,
      exploitationId: exploitation.id,
    }).createMany(5)

    const logEntryService = new LogEntryService()
    const logData = {
      notes: 'This is a test log entry',
      userId: user.id,
      exploitationId: exploitation.id,
    }
    const tagsIds = tags.slice(1, 3).map((tag) => tag.id)
    const logEntry = await logEntryService.createLogEntry(logData, tagsIds)
    await logEntry.load('tags')

    assert.exists(logEntry.id)
    assert.equal(logEntry.notes, logData.notes)
    assert.equal(logEntry.userId, logData.userId)
    assert.equal(logEntry.exploitationId, logData.exploitationId)
    assert.deepEqual(
      logEntry.tags.map((tag) => tag.id),
      tagsIds
    )
  })

  test('I can get log entries for an exploitation', async ({ assert }) => {
    const user = await UserFactory.create()
    const exploitation = await ExploitationFactory.create()
    const tags = await LogEntryTagFactory.merge({
      userId: user.id,
      exploitationId: exploitation.id,
    }).createMany(5)
    const logEntryService = new LogEntryService()

    // Create multiple log entries
    for (let i = 0; i < 3; i++) {
      await logEntryService.createLogEntry(
        {
          notes: `Log entry ${i + 1}`,
          userId: user.id,
          exploitationId: exploitation.id,
        },
        tags.slice(0, 2).map((tag) => tag.id)
      )
    }
    const paginatedLogs = await logEntryService.getLogForExploitation(exploitation.id)
    const paginatedLogsJson = paginatedLogs.toJSON()

    assert.equal(paginatedLogsJson.meta?.total, 3)
    assert.equal(paginatedLogsJson.meta?.currentPage, 1)
    assert.equal(paginatedLogsJson?.data.length, 3)
  })

  test('I can update a log entry', async ({ assert }) => {
    const user = await UserFactory.create()
    const exploitation = await ExploitationFactory.create()
    const tags = await LogEntryTagFactory.merge({
      userId: user.id,
      exploitationId: exploitation.id,
    }).createMany(5)
    const logEntryService = new LogEntryService()

    const logEntry = await logEntryService.createLogEntry(
      {
        notes: 'Original log entry',
        userId: user.id,
        exploitationId: exploitation.id,
      },
      tags.slice(0, 2).map((tag) => tag.id)
    )

    const updatedNotes = 'Updated log entry'
    const updatedLogEntry = await logEntryService.updateLogEntry(
      logEntry.id,
      user.id,
      exploitation.id,
      {
        notes: updatedNotes,
      }
    )

    assert.equal(updatedLogEntry.notes, updatedNotes)
  })

  test('I can mark a log entry as completed', async ({ assert }) => {
    const user = await UserFactory.create()
    const exploitation = await ExploitationFactory.create()
    const logEntryService = new LogEntryService()

    const logEntry = await logEntryService.createLogEntry({
      notes: 'Log entry to be completed',
      userId: user.id,
      exploitationId: exploitation.id,
      date: DateTime.now(), // A log entry must have a date to be marked as completed
    })

    const completedLogEntry = await logEntryService.updateLogEntry(
      logEntry.id,
      user.id,
      exploitation.id,
      { isCompleted: true }
    )

    assert.equal(completedLogEntry.isCompleted, true)
  })

  test('I cannot mark a log entry as completed if it does not have a date', async ({ assert }) => {
    const user = await UserFactory.create()
    const exploitation = await ExploitationFactory.create()
    const logEntryService = new LogEntryService()

    const logEntry = await logEntryService.createLogEntry({
      notes: 'Log entry to be completed',
      userId: user.id,
      exploitationId: exploitation.id,
    })

    try {
      await logEntryService.updateLogEntry(logEntry.id, user.id, exploitation.id, {
        isCompleted: true,
      })
      assert.fail('Should have thrown an error')
    } catch (error) {
      assert.equal(
        error.message,
        'Une note de journal doit avoir une date pour être marquée comme effectuée.'
      )
    }
  })

  test('I can update a log entry tags', async ({ assert }) => {
    const user = await UserFactory.create()
    const exploitation = await ExploitationFactory.create()
    const tags = await LogEntryTagFactory.merge({
      userId: user.id,
      exploitationId: exploitation.id,
    }).createMany(5)
    const logEntryService = new LogEntryService()

    const logEntry = await logEntryService.createLogEntry(
      {
        notes: 'Original log entry',
        userId: user.id,
        exploitationId: exploitation.id,
      },
      tags.slice(0, 2).map((tag) => tag.id)
    )

    const newTagIds = tags.slice(2, 4).map((tag) => tag.id)
    const updatedLogEntry = await logEntryService.updateLogEntry(
      logEntry.id,
      user.id,
      exploitation.id,
      {},
      newTagIds
    )
    await updatedLogEntry.load('tags')

    assert.deepEqual(
      updatedLogEntry.tags.map((tag) => tag.id),
      newTagIds
    )
  })

  test('I can delete a log entry', async ({ assert }) => {
    const user = await UserFactory.create()
    const exploitation = await ExploitationFactory.create()
    const logEntryService = new LogEntryService()

    const logEntry = await logEntryService.createLogEntry({
      notes: 'Log entry to be deleted',
      userId: user.id,
      exploitationId: exploitation.id,
    })

    const deletedLogEntry = await logEntryService.deleteLogEntry(
      logEntry.id,
      user.id,
      exploitation.id
    )

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
