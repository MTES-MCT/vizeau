import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import db from '@adonisjs/lucid/services/db'
import Env from '#start/env'
import Captage from '#models/captage'
import CaptageSeeder from '#database/seeders/9_captage_seeder'
import { DuckdbService } from '#services/duckdb_service'
import { CaptageFactory } from '#database/factories/captage_factory'
import { ProjectFactory } from '#database/factories/project_factory'
import { UserFactory } from '#database/factories/user_factory'

const installation = (overrides: Record<string, unknown>) => ({
  code: '028000381',
  nom: 'ST MARTIN DE LEZEAU F1',
  code_bss: '02165X0039/S1',
  code_bss_nouveau: 'BSS000LZFB',
  etat: 'ACTIF',
  commune: 'SAINT-MARTIN-DE-LEZEAU',
  type: 'FORAGE',
  prioritaire: null,
  ...overrides,
})

// Installations dépliées d'aac.parquet, au format de novembre 2026
const INSTALLATION_ROWS = [
  // Prioritaire dans l'AAC 62 seulement : le captage est prioritaire
  { installation: installation({ prioritaire: null }) },
  { installation: installation({ prioritaire: true }) },
  // Sans aucun code BSS
  {
    installation: installation({
      code: '038008657',
      nom: 'CAPTAGE DE LA RUA',
      code_bss: null,
      code_bss_nouveau: null,
    }),
  },
  // Même ancien code BSS que le précédent captage F1, autre code SISE-Eaux
  {
    installation: installation({
      code: '028000382',
      nom: 'ST MARTIN DE LEZEAU F3',
      code_bss_nouveau: null,
    }),
  },
  // À part (abandonné pour l'eau potable) : jamais prioritaire, même si le fichier le marque ainsi
  {
    installation: installation({
      code: '028000418',
      nom: 'ARPENTIGNY',
      etat: 'ABANDONNÉ (SANS PRÉCISION)',
      a_part: true,
      prioritaire: true,
    }),
  },
]

function runSeeder() {
  return new CaptageSeeder(db.connection()).run()
}

test.group('Captage seeder', (group) => {
  group.each.setup(() => testUtils.db().withGlobalTransaction())
  group.each.setup(() => {
    const query = DuckdbService.prototype.query
    DuckdbService.prototype.query = (async () => INSTALLATION_ROWS) as typeof query
    return () => {
      DuckdbService.prototype.query = query
      Env.set('DRY_RUN', false)
    }
  })

  test('it stores one captage per installation code, with both BSS codes', async ({ assert }) => {
    await runSeeder()

    const captages = await Captage.query().orderBy('code')
    assert.deepEqual(
      captages.map((c) => [c.code, c.bssCode, c.newBssCode, c.prioritaire]),
      [
        ['028000381', '02165X0039/S1', 'BSS000LZFB', true],
        ['028000382', '02165X0039/S1', null, false],
        ['028000418', '02165X0039/S1', 'BSS000LZFB', false],
        ['038008657', null, null, false],
      ]
    )
  })

  test('it updates existing captages and keeps those missing from the file', async ({ assert }) => {
    const existing = await CaptageFactory.merge({
      code: '028000381',
      bssCode: '02165X0039',
      newBssCode: null,
    }).create()
    const missing = await CaptageFactory.merge({ code: '099999999' }).create()

    await runSeeder()

    await existing.refresh()
    assert.equal(existing.bssCode, '02165X0039/S1')
    assert.equal(existing.newBssCode, 'BSS000LZFB')
    assert.exists(await Captage.find(missing.id))
  })

  test('it writes nothing with DRY_RUN, and lists the missing captages', async ({ assert }) => {
    Env.set('DRY_RUN', true)
    const missing = await CaptageFactory.merge({
      code: '099999999',
      name: 'Captage retiré',
    }).create()
    const user = await UserFactory.create()
    const project = await ProjectFactory.merge({ userId: user.id }).create()
    await project.related('captages').attach([missing.id])

    const tables: unknown[] = []
    const table = console.table
    const log = console.log
    console.table = (data: unknown) => tables.push(data)
    console.log = () => {}
    try {
      await runSeeder()
    } finally {
      console.table = table
      console.log = log
    }

    assert.lengthOf(await Captage.all(), 1)
    assert.deepInclude(tables, [
      { code: '099999999', name: 'Captage retiré', state: missing.state, projects: 1 },
    ])
  })
})
