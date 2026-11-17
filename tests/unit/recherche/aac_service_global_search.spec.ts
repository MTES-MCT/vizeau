import { test } from '@japa/runner'
import { AacService } from '#services/aac_service'
import type { DuckdbService } from '#services/duckdb_service'

const AACS = [
  { code: '101', nom: 'AAC Auger' },
  { code: '10', nom: 'AAC Puits-la-Prade' },
  { code: '5463', nom: 'AAC de l’Urne' },
  { code: '7', nom: 'AAC Prélèvement' },
]

// Installations dépliées de chaque AAC, triées par code d'AAC comme le renvoie la requête.
// Format d'avant novembre 2026 : ni code_bss_nouveau, ni champs de rattachement.
const INSTALLATION_ROWS = [
  {
    aac_code: '101',
    installation: { code: '002000154', nom: 'Puits du jardin', code_bss: 'BSS000TYNZ' },
  },
  {
    aac_code: '5463',
    installation: { code: '002000809', nom: 'L’Urne à Magenta', code_bss: 'BSS02436X' },
  },
]

const URNE = {
  code: '002000809',
  nom: 'L’Urne à Magenta',
  code_bss: 'BSS02436X',
  code_bss_nouveau: null,
  aac_code: '5463',
  captage_rattache: null,
}
const PUITS = {
  code: '002000154',
  nom: 'Puits du jardin',
  code_bss: 'BSS000TYNZ',
  code_bss_nouveau: null,
  aac_code: '101',
  captage_rattache: null,
}

// Format de novembre 2026, d'après l'AAC 61 Maillebois 1 : le captage F3 est rangé dans les
// captages rattachés de l'installation F1 (même mélange)
const LEZEAU_F3 = {
  code: '028000382',
  nom: 'ST MARTIN DE LEZEAU F3',
  code_bss: '02165X0040/S3',
  code_bss_nouveau: 'BSS000LZFC',
  etat: 'ACTIF',
}
const LEZEAU_F1 = {
  code: '028000381',
  nom: 'ST MARTIN DE LEZEAU F1',
  code_bss: '02165X0039/S1',
  code_bss_nouveau: 'BSS000LZFB',
  source_rattachement: 'export',
  recroisement_geographique: false,
  captages_rattaches: [LEZEAU_F3],
}
const NEW_FORMAT_ROWS = [
  { aac_code: '61', installation: LEZEAU_F1 },
  // La même installation dans une autre AAC : un seul résultat, avec la première AAC
  { aac_code: '62', installation: LEZEAU_F1 },
  {
    aac_code: '61',
    installation: {
      code: '028000418',
      nom: 'ARPENTIGNY',
      code_bss: '02542X0004/PFAEP',
      code_bss_nouveau: null,
      a_part: true,
      // Captage rattaché qui est aussi une installation : il garde son propre résultat
      captages_rattaches: [{ code: '028000326', nom: 'LA HAYE', code_bss: null, etat: 'ACTIF' }],
    },
  },
  {
    aac_code: '70',
    installation: { code: '028000326', nom: 'LA HAYE', code_bss: null, code_bss_nouveau: null },
  },
  {
    aac_code: '70',
    // Captage récent, sans ancien code BSS
    installation: {
      code: '070000001',
      nom: 'FORAGE NEUF',
      code_bss: null,
      code_bss_nouveau: 'BSS004ABCD',
    },
  },
]

// Fake DuckDB: answers the AAC query or the installations query, and counts the calls
function createFakeDuckdbService({
  fail = false,
  installationRows = INSTALLATION_ROWS as unknown[],
} = {}) {
  const calls: string[] = []
  const duckdbService = {
    async query(sql: string) {
      calls.push(sql)
      if (fail) throw new Error('S3 indisponible')
      return sql.includes('unnest(installations)') ? installationRows : AACS
    },
  } as unknown as DuckdbService

  return { duckdbService, calls }
}

function createService(installationRows: unknown[] = NEW_FORMAT_ROWS) {
  return new AacService(createFakeDuckdbService({ installationRows }).duckdbService)
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
    assert.deepEqual(byName, { data: [URNE], total: 1 })

    const byBssCode = await service.searchInstallations('bss000', 5)
    assert.deepEqual(byBssCode, { data: [PUITS], total: 1 })
  })

  test('finds a captage rattaché by its name, linked to the installation that contains it', async ({
    assert,
  }) => {
    const { data, total } = await createService().searchInstallations('LEZEAU F3', 5)

    assert.equal(total, 1)
    assert.deepEqual(data[0], {
      code: '028000381',
      nom: 'ST MARTIN DE LEZEAU F1',
      code_bss: '02165X0039/S1',
      code_bss_nouveau: 'BSS000LZFB',
      aac_code: '61',
      captage_rattache: {
        code: '028000382',
        nom: 'ST MARTIN DE LEZEAU F3',
        code_bss: '02165X0040/S3',
        code_bss_nouveau: 'BSS000LZFC',
      },
    })
  })

  test('finds a captage rattaché by its code or BSS codes', async ({ assert }) => {
    const service = createService()

    for (const query of ['028000382', '02165X0040', 'BSS000LZFC']) {
      const { data } = await service.searchInstallations(query, 5)
      assert.deepEqual(
        data.map((result) => result.captage_rattache?.code),
        ['028000382'],
        query
      )
    }
  })

  test('returns an installation once, even when it belongs to several AACs', async ({ assert }) => {
    const { data } = await createService().searchInstallations('LEZEAU', 5)

    // F1, et son captage rattaché F3, dans la première AAC
    assert.deepEqual(
      data.map((result) => [result.captage_rattache?.nom ?? result.nom, result.aac_code]),
      [
        ['ST MARTIN DE LEZEAU F1', '61'],
        ['ST MARTIN DE LEZEAU F3', '61'],
      ]
    )
  })

  test('keeps the installation result of a captage rattaché that is also an installation', async ({
    assert,
  }) => {
    const { data, total } = await createService().searchInstallations('la haye', 5)

    assert.equal(total, 1)
    assert.include(data[0], { code: '028000326', aac_code: '70', captage_rattache: null })
  })

  test('finds an installation by the indice of its old BSS code, and ranks it first', async ({
    assert,
  }) => {
    const service = createService()

    // L'indice seul, sans la désignation (/S1) : correspondance exacte
    const byIndice = await service.searchInstallations('02165x0039', 1)
    assert.equal(byIndice.data[0].code, '028000381')

    const byFullCode = await service.searchInstallations('02165X0039/S1', 5)
    assert.equal(byFullCode.data[0].code, '028000381')
  })

  test('finds an installation without old BSS code by its new BSS code', async ({ assert }) => {
    const service = createService()

    const { data } = await service.searchInstallations('bss004abcd', 5)
    assert.deepEqual(data, [
      {
        code: '070000001',
        nom: 'FORAGE NEUF',
        code_bss: null,
        code_bss_nouveau: 'BSS004ABCD',
        aac_code: '70',
        captage_rattache: null,
      },
    ])
  })

  test('ranks the installation whose new BSS code is exactly the query first', async ({
    assert,
  }) => {
    const { data } = await createService().searchInstallations('BSS000LZFB', 1)

    assert.equal(data[0].code, '028000381')
    assert.isNull(data[0].captage_rattache)
  })

  test('loads the AAC dataset only once for successive searches', async ({ assert }) => {
    const { duckdbService, calls } = createFakeDuckdbService()

    await new AacService(duckdbService).searchAacs('aac', 5)
    await new AacService(duckdbService).searchInstallations('puits', 5)
    await new AacService(duckdbService).searchAacs('urne', 5)

    assert.lengthOf(calls, 2)
  })

  test('reads the installations as a whole, without naming fields absent from older files', async ({
    assert,
  }) => {
    const { duckdbService, calls } = createFakeDuckdbService()

    await new AacService(duckdbService).searchInstallations('puits', 5)

    const installationsQuery = calls.find((sql) => sql.includes('unnest(installations)'))
    assert.exists(installationsQuery)
    assert.notInclude(installationsQuery!, 'installation.')
  })

  test('retries loading the AAC dataset after a failure', async ({ assert }) => {
    const failing = createFakeDuckdbService({ fail: true })
    await assert.rejects(() => new AacService(failing.duckdbService).searchAacs('aac', 5))

    const working = createFakeDuckdbService()
    const { total } = await new AacService(working.duckdbService).searchAacs('aac', 5)

    assert.equal(total, 4)
  })
})
