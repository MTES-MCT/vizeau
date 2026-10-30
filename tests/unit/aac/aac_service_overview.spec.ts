import { test } from '@japa/runner'
import { AacService } from '#services/aac_service'
import type { DuckdbService } from '#services/duckdb_service'

const installation = (code: string, nom: string) => ({
  code,
  nom,
  commune: `Commune ${nom}`,
  departement: '16',
})

const BOURG = installation('I1', 'Bourg')
const ABBAYE = installation('I2', 'Abbaye')
const SOURCE = installation('I3', 'Source')
const SANS_ANALYSE = installation('I4', 'Sans analyse')

const AACS = [
  { code: '1', nom: 'AAC Un', installations: [BOURG, ABBAYE] },
  { code: '2', nom: 'AAC Deux', installations: [ABBAYE, SOURCE] },
  { code: '3', nom: 'AAC Trois', installations: [SANS_ANALYSE] },
  { code: '4', nom: 'AAC Quatre', installations: [] },
]

// Dates de prélèvement par installation, comme les renvoie la requête sur les analyses
const DATE_COUNTS = [
  { code_installation: 'I1', total: 10, reglementaires: 2, alerte: 3, alerte_seule: 1 },
  { code_installation: 'I2', total: 5, reglementaires: 0, alerte: 2, alerte_seule: 2 },
  { code_installation: 'I3', total: 4, reglementaires: 0, alerte: 0, alerte_seule: 0 },
]

// Codes passés au filtre sur les installations : un paramètre $installationCode_N par code,
// ou la liste $installationCodes au-delà de 1 000 installations
function installationCodesOf(parameters: Record<string, unknown>): string[] {
  if (Array.isArray(parameters.installationCodes)) return parameters.installationCodes as string[]
  return Object.entries(parameters)
    .filter(([name]) => name.startsWith('installationCode_'))
    .map(([, code]) => code as string)
}

// Fake DuckDB: answers the AAC query or the analyses query, and records the parameters
function createFakeDuckdbService(aacs: Record<string, unknown>[], dateCounts = DATE_COUNTS) {
  const calls: Record<string, unknown>[] = []
  const sqls: string[] = []
  const duckdbService = {
    list: (values: unknown[]) => values,
    async query(sql: string, parameters: Record<string, unknown>) {
      calls.push(parameters)
      sqls.push(sql)
      const installationCodes = installationCodesOf(parameters)
      if (installationCodes.length > 0) {
        return dateCounts.filter((row) => installationCodes.includes(row.code_installation))
      }
      const aacCodes = (parameters.aacCodes as string[] | undefined) ?? []
      return aacs.filter((aac) => aacCodes.includes(aac.code as string))
    },
  } as unknown as DuckdbService

  return { duckdbService, calls, sqls }
}

const territoires = (codes: string[]) => codes.map((code) => ({ id: `t${code}`, code }))

test.group('AacService - getOverviewForTerritoires', () => {
  test('sums the dépassements of each AAC installations', async ({ assert }) => {
    const { duckdbService, calls } = createFakeDuckdbService(AACS)
    const service = new AacService(duckdbService)

    const overview = await service.getOverviewForTerritoires(territoires(['1', '2', '3', '4']))

    // Les analyses ne sont lues qu'une fois, pour les installations distinctes
    assert.lengthOf(calls, 2)
    assert.deepEqual(installationCodesOf(calls[1]), ['I1', 'I2', 'I3', 'I4'])

    const summary = (code: string) => {
      // eslint-disable-next-line @typescript-eslint/naming-convention
      const { depassements_alerte, depassements_reglementaires } = overview.summariesByCode[code]
      return { depassements_alerte, depassements_reglementaires }
    }
    // Résumés : une date en dépassement réglementaire et d'alerte compte en réglementaire
    assert.deepEqual(summary('1'), { depassements_alerte: 3, depassements_reglementaires: 2 })
    assert.deepEqual(summary('2'), { depassements_alerte: 2, depassements_reglementaires: 0 })
    assert.deepEqual(summary('3'), { depassements_alerte: 0, depassements_reglementaires: 0 })
    assert.deepEqual(summary('4'), { depassements_alerte: 0, depassements_reglementaires: 0 })

    // Conformité : toutes les dates en dépassement d'alerte, et seulement les AAC avec analyses
    assert.deepEqual(Object.fromEntries(overview.conformiteStatsByAacCode), {
      1: { total: 15, depassements_alerte: 5, depassements_reglementaires: 2 },
      2: { total: 9, depassements_alerte: 2, depassements_reglementaires: 0 },
    })
  })

  test('lists the captages en dépassement, the most critical first', async ({ assert }) => {
    const service = new AacService(createFakeDuckdbService(AACS).duckdbService)

    const { captagesAlertes } = await service.getOverviewForTerritoires(territoires(['1', '2']))

    assert.deepEqual(
      captagesAlertes.map((captage) => [captage.code, captage.aac_code]),
      [
        ['I1', '1'],
        ['I2', '1'],
        ['I2', '2'],
      ]
    )
    assert.deepEqual(captagesAlertes[0], {
      code: 'I1',
      nom: 'Bourg',
      commune: 'Commune Bourg',
      departement: '16',
      aac_code: '1',
      aac_nom: 'AAC Un',
      depassements_alerte: 1,
      depassements_reglementaires: 2,
    })
  })

  test('lists the AACs à risque in the territoires order, with their total', async ({ assert }) => {
    const aacs = Array.from({ length: 12 }, (_, i) => ({
      code: `${i + 1}`,
      nom: `AAC ${i + 1}`,
      installations: [installation(`I${i + 1}`, `Installation ${i + 1}`)],
    }))
    const dateCounts = aacs.map((_, i) => ({
      code_installation: `I${i + 1}`,
      total: 3,
      reglementaires: 0,
      alerte: 1,
      alerte_seule: 1,
    }))
    const service = new AacService(createFakeDuckdbService(aacs, dateCounts).duckdbService)
    const codes = aacs.map((aac) => aac.code).reverse()

    const { aacCodesARisque } = await service.getOverviewForTerritoires(territoires(codes))

    assert.deepEqual(aacCodesARisque, { codes: codes.slice(0, 10), total: 12 })
  })

  test('does not read the analyses when the AACs have no installation', async ({ assert }) => {
    const { duckdbService, calls } = createFakeDuckdbService(AACS)
    const service = new AacService(duckdbService)

    const overview = await service.getOverviewForTerritoires(territoires(['4']))

    assert.lengthOf(calls, 1)
    assert.deepEqual(overview.aacCodesARisque, { codes: [], total: 0 })
    assert.deepEqual(overview.captagesAlertes, [])
  })
})

test.group('AacService - filtre sur les installations', () => {
  test('passes each distinct installation code as its own IN parameter', async ({ assert }) => {
    const { duckdbService, calls, sqls } = createFakeDuckdbService(AACS)
    const service = new AacService(duckdbService)

    await service.getAnalysesSummary(['I1', 'I2', 'I1'])

    // Une liste IN de paramètres, et non `= ANY($liste)` : sur le fichier trié, DuckDB
    // ne lit alors que les row groups qui contiennent l'une des installations
    assert.include(sqls[0], 'code_installation IN ($installationCode_0, $installationCode_1)')
    assert.notInclude(sqls[0], 'ANY(')
    assert.deepInclude(calls[0], { installationCode_0: 'I1', installationCode_1: 'I2' })
    assert.notProperty(calls[0], 'installationCode_2')
  })

  test('keeps = ANY beyond 1 000 installations', async ({ assert }) => {
    const { duckdbService, calls, sqls } = createFakeDuckdbService(AACS)
    const service = new AacService(duckdbService)
    const codes = Array.from({ length: 1001 }, (_, i) => `I${i}`)

    await service.getAnalysesSummary([...codes, 'I0'])

    assert.include(sqls[0], 'code_installation = ANY($installationCodes)')
    assert.deepEqual(calls[0].installationCodes, codes)
    assert.notProperty(calls[0], 'installationCode_0')
  })
})

test.group('AacService - agrégats par date', () => {
  test('reads the conformité of installations from the per-date file', async ({ assert }) => {
    const { duckdbService, calls, sqls } = createFakeDuckdbService(AACS)
    const service = new AacService(duckdbService)

    const stats = await service.getConformiteStatsByInstallation(['I1', 'I2', 'I1', 'I4'])

    // Fichier en un seul row group : une simple liste suffit, sans paramètre par code
    assert.lengthOf(calls, 1)
    assert.match(calls[0].path as string, /\/analyses_robinet_par_date\.parquet$/)
    assert.include(sqls[0], 'code_installation = ANY($installationCodes)')
    assert.deepEqual(calls[0].installationCodes, ['I1', 'I2', 'I4'])

    // Une date en dépassement réglementaire et d'alerte ne compte qu'en réglementaire
    assert.deepEqual(Object.fromEntries(stats), {
      I1: { total: 10, depassements_reglementaires: 2, depassements_alerte: 1 },
      I2: { total: 5, depassements_reglementaires: 0, depassements_alerte: 2 },
    })
  })

  test('does not query DuckDB without installations', async ({ assert }) => {
    const { duckdbService, calls } = createFakeDuckdbService(AACS)
    const service = new AacService(duckdbService)

    const stats = await service.getConformiteStatsByInstallation([])

    assert.equal(stats.size, 0)
    assert.lengthOf(calls, 0)
  })

  test('reads the installations with a dépassement from the per-date flags', async ({ assert }) => {
    const { duckdbService, calls, sqls } = createFakeDuckdbService(AACS)
    const service = new AacService(duckdbService)

    await service.getInstallationCodesWithDepassement('reglementaire')
    await service.getInstallationCodesWithDepassement('alerte')

    assert.match(calls[0].path as string, /\/analyses_robinet_par_date\.parquet$/)
    assert.match(sqls[0], /WHERE dep_regl$/)
    assert.match(sqls[1], /WHERE dep_alerte$/)
  })
})
