import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { DateTime } from 'luxon'
import { LogEntryCsvService } from '#services/log_entry_csv_service'
import { LogEntryFactory } from '#database/factories/log_entry_factory'
import { LogEntryTagFactory } from '#database/factories/log_entry_tag_factory'
import { UserFactory } from '#database/factories/user_factory'
import { ExploitationFactory } from '#database/factories/exploitation_factory'

const BOM = '\uFEFF'

/**
 * Splits a CSV string into rows (strips BOM, splits on CRLF).
 */
function parseRows(csv: string): string[] {
  return csv.replace(BOM, '').split('\r\n')
}

/**
 * Naive field splitter — only use when no field contains a semicolon.
 */
function parseFields(row: string): string[] {
  return row.split(';')
}

test.group('LogEntryCsvService', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('generates only the header row for an empty list', ({ assert }) => {
    const csv = new LogEntryCsvService().generateCsv([])
    const rows = parseRows(csv)

    assert.lengthOf(rows, 1)
    assert.include(rows[0], '"Date"')
    assert.include(rows[0], '"Modifié le"')
  })

  test('output starts with UTF-8 BOM', async ({ assert }) => {
    const entry = await LogEntryFactory.with('author').with('exploitation').create()
    await entry.load('author')
    await entry.load('tags')

    const csv = new LogEntryCsvService().generateCsv([entry])

    assert.isTrue(csv.startsWith(BOM))
  })

  test('generates one data row per entry', async ({ assert }) => {
    const entries = await LogEntryFactory.with('author').with('exploitation').createMany(3)
    for (const entry of entries) {
      await entry.load('author')
      await entry.load('tags')
    }

    const csv = new LogEntryCsvService().generateCsv(entries)

    assert.lengthOf(parseRows(csv), 4) // 1 header + 3 data rows
  })

  test('sets status to "Effectuée" when isCompleted is true', async ({ assert }) => {
    const entry = await LogEntryFactory.merge({ isCompleted: true, date: DateTime.now() })
      .with('author')
      .with('exploitation')
      .create()
    await entry.load('author')
    await entry.load('tags')

    const csv = new LogEntryCsvService().generateCsv([entry])

    assert.include(csv, '"Effectuée"')
  })

  test('sets status to "Non effectuée" when isCompleted is false', async ({ assert }) => {
    const entry = await LogEntryFactory.merge({ isCompleted: false })
      .with('author')
      .with('exploitation')
      .create()
    await entry.load('author')
    await entry.load('tags')

    const csv = new LogEntryCsvService().generateCsv([entry])

    assert.include(csv, '"Non effectuée"')
  })

  test('uses author fullName when available', async ({ assert }) => {
    const user = await UserFactory.merge({ fullName: 'Jean Dupont' }).create()
    const entry = await LogEntryFactory.merge({ userId: user.id, notes: 'test notes', title: null })
      .with('exploitation')
      .create()
    await entry.load('author')
    await entry.load('tags')

    const fields = parseFields(parseRows(new LogEntryCsvService().generateCsv([entry]))[1])

    assert.equal(fields[3], '"Jean Dupont"')
  })

  test('falls back to email when fullName is null', async ({ assert }) => {
    const user = await UserFactory.merge({ fullName: null, email: 'jean@example.com' }).create()
    const entry = await LogEntryFactory.merge({ userId: user.id, notes: 'test notes', title: null })
      .with('exploitation')
      .create()
    await entry.load('author')
    await entry.load('tags')

    const fields = parseFields(parseRows(new LogEntryCsvService().generateCsv([entry]))[1])

    assert.equal(fields[3], '"jean@example.com"')
  })

  test('joins multiple tags with " | "', async ({ assert }) => {
    const user = await UserFactory.create()
    const exploitation = await ExploitationFactory.create()
    const [tag1, tag2] = await LogEntryTagFactory.merge({
      userId: user.id,
      exploitationId: exploitation.id,
    }).createMany(2)
    const entry = await LogEntryFactory.merge({
      userId: user.id,
      exploitationId: exploitation.id,
    }).create()
    await entry.related('tags').attach([tag1.id, tag2.id])
    await entry.load('author')
    await entry.load('tags')

    const expectedTags = entry.tags.map((t) => t.name).join(' | ')
    const csv = new LogEntryCsvService().generateCsv([entry])

    assert.include(csv, `"${expectedTags}"`)
  })

  test('outputs an empty tags field when entry has no tags', async ({ assert }) => {
    const entry = await LogEntryFactory.merge({ notes: 'test notes', title: null })
      .with('author')
      .with('exploitation')
      .create()
    await entry.load('author')
    await entry.load('tags')

    const fields = parseFields(parseRows(new LogEntryCsvService().generateCsv([entry]))[1])

    assert.equal(fields[5], '""')
  })

  test('outputs an empty date field when date is null', async ({ assert }) => {
    const entry = await LogEntryFactory.merge({ date: null, notes: 'test notes', title: null })
      .with('author', 1, (f) => f.merge({ fullName: 'Author' }))
      .with('exploitation')
      .create()
    await entry.load('author')
    await entry.load('tags')

    const fields = parseFields(parseRows(new LogEntryCsvService().generateCsv([entry]))[1])

    assert.equal(fields[0], '""')
  })

  test('formats date as dd/MM/yyyy', async ({ assert }) => {
    const entry = await LogEntryFactory.merge({
      date: DateTime.fromISO('2025-03-15'),
      notes: 'test notes',
      title: null,
    })
      .with('author', 1, (f) => f.merge({ fullName: 'Author' }))
      .with('exploitation')
      .create()
    await entry.load('author')
    await entry.load('tags')

    const fields = parseFields(parseRows(new LogEntryCsvService().generateCsv([entry]))[1])

    assert.equal(fields[0], '"15/03/2025"')
  })

  test('prefixes CSV injection characters with a single quote', async ({ assert }) => {
    const entry = await LogEntryFactory.merge({ notes: '=SUM(A1:B2)' })
      .with('author')
      .with('exploitation')
      .create()
    await entry.load('author')
    await entry.load('tags')

    const csv = new LogEntryCsvService().generateCsv([entry])

    assert.include(csv, '"\'=SUM(A1:B2)"')
  })

  test('escapes double quotes by doubling them', async ({ assert }) => {
    const entry = await LogEntryFactory.merge({ notes: 'He said "hello"' })
      .with('author')
      .with('exploitation')
      .create()
    await entry.load('author')
    await entry.load('tags')

    const csv = new LogEntryCsvService().generateCsv([entry])

    assert.include(csv, '"He said ""hello"""')
  })
})
