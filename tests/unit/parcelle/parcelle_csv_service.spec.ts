import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { ParcelleCsvService } from '#services/parcelle_csv_service'
import { ParcelleFactory } from '#database/factories/parcelle_factory'
import { ParcelleCommentFactory } from '#database/factories/parcelle_comment_factory'
import { UserFactory } from '#database/factories/user_factory'
import Parcelle from '#models/parcelle'

const BOM = '\uFEFF'

function parseRows(csv: string): string[] {
  return csv.replace(BOM, '').split('\r\n')
}

function parseFields(row: string): string[] {
  return row.split(';')
}

test.group('ParcelleCsvService', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('generates only the header row for an empty list', ({ assert }) => {
    const csv = new ParcelleCsvService().generateCsv([])
    const rows = parseRows(csv)

    assert.lengthOf(rows, 1)
    assert.include(rows[0], '"Identifiant RPG"')
    assert.include(rows[0], '"Surface (ha)"')
  })

  test('output starts with UTF-8 BOM', async ({ assert }) => {
    const parcelle = await ParcelleFactory.with('exploitation').create()
    const csv = new ParcelleCsvService().generateCsv([parcelle])
    assert.isTrue(csv.startsWith(BOM))
  })

  test('generates one data row per parcelle', async ({ assert }) => {
    const parcelles = await ParcelleFactory.with('exploitation').createMany(3)
    const csv = new ParcelleCsvService().generateCsv(parcelles)
    assert.lengthOf(parseRows(csv), 4) // 1 header + 3 data rows
  })

  test('includes year, rpgId and surface in the row', async ({ assert }) => {
    const parcelle = await ParcelleFactory.merge({
      year: 2025,
      rpgId: '1234567890',
      surface: '12.5',
    })
      .with('exploitation')
      .create()

    const csv = new ParcelleCsvService().generateCsv([parcelle])
    const fields = parseFields(parseRows(csv)[1])

    assert.equal(fields[0], '"2025"')
    assert.equal(fields[1], '"1234567890"')
    assert.equal(fields[2], '"12.5"')
  })

  test('outputs empty field when surface is null', async ({ assert }) => {
    const parcelle = await ParcelleFactory.merge({ surface: null }).with('exploitation').create()
    const csv = new ParcelleCsvService().generateCsv([parcelle])
    const fields = parseFields(parseRows(csv)[1])
    assert.equal(fields[2], '""')
  })

  test('outputs empty field when user has no comment', async ({ assert }) => {
    const user = await UserFactory.create()
    const parcelle = await ParcelleFactory.with('exploitation').create()

    const reloaded = await Parcelle.query()
      .where('id', parcelle.id)
      .preload('comments', (q) => q.where('userId', user.id))
      .firstOrFail()

    const csv = new ParcelleCsvService().generateCsv([reloaded])
    const fields = parseFields(parseRows(csv)[1])
    // Commentaire is at index 5
    assert.equal(fields[5], '""')
  })

  test('includes comment when present', async ({ assert }) => {
    const user = await UserFactory.create()
    const parcelle = await ParcelleFactory.with('exploitation').create()
    await ParcelleCommentFactory.merge({
      parcelleId: parcelle.id,
      userId: user.id,
      comment: 'Terrain argileux',
    }).create()

    const reloaded = await Parcelle.query()
      .where('id', parcelle.id)
      .preload('comments', (q) => q.where('userId', user.id))
      .firstOrFail()

    const csv = new ParcelleCsvService().generateCsv([reloaded])
    assert.include(csv, '"Terrain argileux"')
  })

  test('prefixes CSV injection characters with a single quote', async ({ assert }) => {
    const user = await UserFactory.create()
    const parcelle = await ParcelleFactory.with('exploitation').create()
    await ParcelleCommentFactory.merge({
      parcelleId: parcelle.id,
      userId: user.id,
      comment: '=SUM(A1:B2)',
    }).create()

    const reloaded = await Parcelle.query()
      .where('id', parcelle.id)
      .preload('comments', (q) => q.where('userId', user.id))
      .firstOrFail()

    const csv = new ParcelleCsvService().generateCsv([reloaded])
    assert.include(csv, '"\'=SUM(A1:B2)"')
  })

  test('escapes double quotes by doubling them', async ({ assert }) => {
    const user = await UserFactory.create()
    const parcelle = await ParcelleFactory.with('exploitation').create()
    await ParcelleCommentFactory.merge({
      parcelleId: parcelle.id,
      userId: user.id,
      comment: 'dit "attention"',
    }).create()

    const reloaded = await Parcelle.query()
      .where('id', parcelle.id)
      .preload('comments', (q) => q.where('userId', user.id))
      .firstOrFail()

    const csv = new ParcelleCsvService().generateCsv([reloaded])
    assert.include(csv, '"dit ""attention"""')
  })

  test('outputs empty culture fields when cultureCode is null', async ({ assert }) => {
    const parcelle = await ParcelleFactory.merge({ cultureCode: null })
      .with('exploitation')
      .create()
    const csv = new ParcelleCsvService().generateCsv([parcelle])
    const fields = parseFields(parseRows(csv)[1])
    // Code culture (index 3) and Culture label (index 4)
    assert.equal(fields[3], '""')
    assert.equal(fields[4], '""')
  })
})
