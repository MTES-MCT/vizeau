import { test } from '@japa/runner'
import { AacService } from '#services/aac_service'
import type { DuckdbService } from '#services/duckdb_service'

const AACS = [
  { code: '101', nom: 'AAC Auger' },
  { code: '10', nom: 'AAC Puits-la-Prade' },
  { code: '5463', nom: 'AAC de l’Urne' },
  { code: '7', nom: 'AAC Prélèvement' },
]

const INSTALLATIONS = [
  { code: '002000809', nom: 'L’Urne à Magenta', code_bss: 'BSS02436X', aac_code: '5463' },
  { code: '002000154', nom: 'Puits du jardin', code_bss: 'BSS000TYNZ', aac_code: '101' },
]

// Fake DuckDB: answers the AAC query or the installations query, and counts the calls
function createFakeDuckdbService({ fail = false } = {}) {
  const calls: string[] = []
  const duckdbService = {
    async query(sql: string) {
      calls.push(sql)
      if (fail) throw new Error('S3 indisponible')
      return sql.includes('unnest(installations)') ? INSTALLATIONS : AACS
    },
  } as unknown as DuckdbService

  return { duckdbService, calls }
}

test.group('AacService - global search', (group) => {
  group.each.setup(() => AacService.clearGlobalSearchIndex())

  test('matches AACs by name or code, ignoring case and accents', async ({ assert }) => {
    const service = new AacService(createFakeDuckdbService().duckdbService)

    const byName = await service.searchAacs('prelevement', 5)
    assert.deepEqual(byName, { data: [{ code: '7', nom: 'AAC Prélèvement' }], total: 1 })

    const byCode = await service.searchAacs('546', 5)
    assert.deepEqual(
      byCode.data.map((aac) => aac.code),
      ['5463']
    )
  })

  test('ranks the AAC whose code is exactly the query first', async ({ assert }) => {
    const service = new AacService(createFakeDuckdbService().duckdbService)

    const { data, total } = await service.searchAacs('10', 1)

    assert.equal(total, 2)
    assert.deepEqual(data, [{ code: '10', nom: 'AAC Puits-la-Prade' }])
  })

  test('matches installations by name or BSS code', async ({ assert }) => {
    const service = new AacService(createFakeDuckdbService().duckdbService)

    const byName = await service.searchInstallations('urne a', 5)
    assert.deepEqual(byName, { data: [INSTALLATIONS[0]], total: 1 })

    const byBssCode = await service.searchInstallations('bss000', 5)
    assert.deepEqual(byBssCode, { data: [INSTALLATIONS[1]], total: 1 })
  })

  test('loads the AAC dataset only once for successive searches', async ({ assert }) => {
    const { duckdbService, calls } = createFakeDuckdbService()

    await new AacService(duckdbService).searchAacs('aac', 5)
    await new AacService(duckdbService).searchInstallations('puits', 5)
    await new AacService(duckdbService).searchAacs('urne', 5)

    assert.lengthOf(calls, 2)
  })

  test('retries loading the AAC dataset after a failure', async ({ assert }) => {
    const failing = createFakeDuckdbService({ fail: true })
    await assert.rejects(() => new AacService(failing.duckdbService).searchAacs('aac', 5))

    const working = createFakeDuckdbService()
    const { total } = await new AacService(working.duckdbService).searchAacs('aac', 5)

    assert.equal(total, 4)
  })
})
