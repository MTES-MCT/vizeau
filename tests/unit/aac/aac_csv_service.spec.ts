import { test } from '@japa/runner'
import { AacCsvService } from '#services/aac_csv_service'
import { AacService } from '#services/aac_service'
import { AacJson } from '../../../types/aac.js'

const BOM = '\uFEFF'

function parseRows(csv: string): string[] {
  return csv.replace(BOM, '').split('\r\n')
}

function parseFields(row: string): string[] {
  return row.split(';')
}

function buildAacFixture(overrides: Partial<AacJson> = {}): AacJson {
  return {
    code: '12345',
    nom: 'AAC Test',
    prioritaire: true,
    date_creation: '2020-01-01',
    date_maj: '2024-06-15',
    bbox: null,
    surface: 150.5,
    nb_captages_actifs: 3,
    nb_installations: 2,
    surface_agricole: 120,
    nb_parcelles: 45,
    communes: { nb_communes: 2, communes: {} },
    surface_agricole_utile: {
      Blé: { nb_parcelles: 10, surface: 50, SAU: 40 },
    },
    surface_agricole_ppe: null,
    surface_agricole_ppr: null,
    surface_agricole_bio: {
      nb_parcelles: 5,
      surface: 30,
      part_bio: 25,
      evolution: [{ annee: 2023, nb_parcelles: 4, surface: 28 }],
    },
    culture_evolution: null,
    installations: [
      {
        code: 'INST1',
        nom: 'Installation 1',
        code_bss: 'BSS001',
        commune: 'Commune A',
        departement: '01',
        type: 'Forage',
        nature: 'Souterrain',
        usage: 'AEP',
        etat: 'Actif',
        code_ppe: 'PPE1',
        prioritaire: true,
        captages_rattaches: [
          { code: 'CAP1', nom: 'Captage 1', code_bss: 'BSS_CAP1', etat: 'Actif' },
        ],
      },
    ],
    ...overrides,
  }
}

function createMockAacService(fixture: AacJson | null): AacService {
  return {
    getByCode: async () => (fixture ? (fixture as unknown as Record<string, unknown>) : null),
    getAnalysesRobinetYears: async () => ['2024', '2023'],
    getAnalysesRobinet: async (_code: string, year: number) => [
      { date_prelevement: `${year}-03-15`, parametre: 'Nitrates', valeur: 42 },
    ],
  } as unknown as AacService
}

test.group('AacCsvService - exportInfoGenerale', () => {
  test('returns null when AAC not found', async ({ assert }) => {
    const service = new AacCsvService(createMockAacService(null))
    const result = await service.exportInfoGenerale('99999')
    assert.isNull(result)
  })

  test('output starts with UTF-8 BOM', async ({ assert }) => {
    const service = new AacCsvService(createMockAacService(buildAacFixture()))
    const csv = await service.exportInfoGenerale('12345')
    assert.isTrue(csv!.startsWith(BOM))
  })

  test('contains general info headers', async ({ assert }) => {
    const service = new AacCsvService(createMockAacService(buildAacFixture()))
    const csv = await service.exportInfoGenerale('12345')
    assert.include(csv!, '"Code"')
    assert.include(csv!, '"Surface (ha)"')
    assert.include(csv!, '"Date MAJ"')
  })

  test('contains prioritaire as Oui when true', async ({ assert }) => {
    const service = new AacCsvService(createMockAacService(buildAacFixture({ prioritaire: true })))
    const csv = await service.exportInfoGenerale('12345')
    const rows = parseRows(csv!)
    const dataRow = rows[1]
    assert.include(dataRow, '"Oui"')
  })

  test('contains prioritaire as Non when false', async ({ assert }) => {
    const service = new AacCsvService(createMockAacService(buildAacFixture({ prioritaire: false })))
    const csv = await service.exportInfoGenerale('12345')
    const rows = parseRows(csv!)
    const dataRow = rows[1]
    assert.include(dataRow, '"Non"')
  })
})

test.group('AacCsvService - exportCaptages', () => {
  test('returns null when AAC not found', async ({ assert }) => {
    const service = new AacCsvService(createMockAacService(null))
    const result = await service.exportCaptages('99999')
    assert.isNull(result)
  })

  test('contains captage headers', async ({ assert }) => {
    const service = new AacCsvService(createMockAacService(buildAacFixture()))
    const csv = await service.exportCaptages('12345')
    assert.include(csv!, '"Code BSS"')
    assert.include(csv!, '"Captage rattaché - Code"')
  })

  test('includes installation and captage rattaché data', async ({ assert }) => {
    const service = new AacCsvService(createMockAacService(buildAacFixture()))
    const csv = await service.exportCaptages('12345')
    assert.include(csv!, '"INST1"')
    assert.include(csv!, '"CAP1"')
    assert.include(csv!, '"Captage 1"')
  })

  test('outputs empty fields when no captages rattachés', async ({ assert }) => {
    const fixture = buildAacFixture({
      installations: [
        {
          code: 'INST2',
          nom: 'Installation 2',
          code_bss: 'BSS002',
          commune: 'Commune B',
          departement: '02',
          type: 'Source',
          nature: 'Surface',
          usage: 'AEP',
          etat: 'Actif',
          code_ppe: 'PPE2',
          prioritaire: false,
          captages_rattaches: [],
        },
      ],
    })
    const service = new AacCsvService(createMockAacService(fixture))
    const csv = await service.exportCaptages('12345')
    const rows = parseRows(csv!)
    const dataRow = rows[1]
    const fields = parseFields(dataRow)
    assert.equal(fields[fields.length - 1], '""')
    assert.equal(fields[fields.length - 2], '""')
  })
})

test.group('AacCsvService - exportAssolement', () => {
  test('returns null when AAC not found', async ({ assert }) => {
    const service = new AacCsvService(createMockAacService(null))
    const result = await service.exportAssolement('99999')
    assert.isNull(result)
  })

  test('contains assolement headers', async ({ assert }) => {
    const service = new AacCsvService(createMockAacService(buildAacFixture()))
    const csv = await service.exportAssolement('12345')
    assert.include(csv!, '"Zone"')
    assert.include(csv!, '"Culture"')
    assert.include(csv!, '"SAU (%)"')
  })

  test('includes SAU zone data', async ({ assert }) => {
    const service = new AacCsvService(createMockAacService(buildAacFixture()))
    const csv = await service.exportAssolement('12345')
    assert.include(csv!, 'SAU (Surface Agricole Utile)')
    assert.include(csv!, '"Blé"')
  })

  test('includes bio data', async ({ assert }) => {
    const service = new AacCsvService(createMockAacService(buildAacFixture()))
    const csv = await service.exportAssolement('12345')
    assert.include(csv!, 'Bio (global)')
    assert.include(csv!, 'Bio (évolution)')
  })

  test('includes culture evolution section when present', async ({ assert }) => {
    const fixture = buildAacFixture({
      culture_evolution: {
        aac: '12345',
        nom: 'AAC Test',
        repartition: {
          Blé: { '2023': { surface_ha: 50, nb_parcelles: 10 } },
        },
      },
    })
    const service = new AacCsvService(createMockAacService(fixture))
    const csv = await service.exportAssolement('12345')
    assert.include(csv!, '"2023"')
  })
})

test.group('AacCsvService - exportQualiteEau', () => {
  test('returns null when AAC not found', async ({ assert }) => {
    const service = new AacCsvService(createMockAacService(null))
    const result = await service.exportQualiteEau('99999')
    assert.isNull(result)
  })

  test('returns null when no analyses available', async ({ assert }) => {
    const mockService = {
      getByCode: async () => buildAacFixture() as unknown as Record<string, unknown>,
      getAnalysesRobinetYears: async () => [],
      getAnalysesRobinet: async () => [],
    } as unknown as AacService
    const service = new AacCsvService(mockService)
    const result = await service.exportQualiteEau('12345')
    assert.isNull(result)
  })

  test('contains analyses data from all years', async ({ assert }) => {
    const service = new AacCsvService(createMockAacService(buildAacFixture()))
    const csv = await service.exportQualiteEau('12345')
    assert.isNotNull(csv)
    assert.include(csv!, '"INST1"')
    assert.include(csv!, '"42"')
  })

  test('continues gracefully when getAnalysesRobinetYears throws', async ({ assert }) => {
    const mockService = {
      getByCode: async () => buildAacFixture() as unknown as Record<string, unknown>,
      getAnalysesRobinetYears: async () => {
        throw new Error('S3 error')
      },
      getAnalysesRobinet: async () => [],
    } as unknown as AacService
    const service = new AacCsvService(mockService)
    const result = await service.exportQualiteEau('12345')
    assert.isNull(result)
  })

  test('continues gracefully when getAnalysesRobinet throws', async ({ assert }) => {
    const mockService = {
      getByCode: async () => buildAacFixture() as unknown as Record<string, unknown>,
      getAnalysesRobinetYears: async () => ['2024'],
      getAnalysesRobinet: async () => {
        throw new Error('S3 error')
      },
    } as unknown as AacService
    const service = new AacCsvService(mockService)
    const result = await service.exportQualiteEau('12345')
    assert.isNull(result)
  })
})
