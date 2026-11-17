import { test } from '@japa/runner'
import { AacCsvService } from '#services/aac_csv_service'
import { type AacService } from '#services/aac_service'
import { type AacJson } from '#types/aac'

const BOM = '\uFEFF'

function parseRows(csv: string): string[] {
  return csv.replace(BOM, '').split('\r\n')
}

function parseFields(row: string): string[] {
  return row.split(';')
}

// En-têtes et lignes de la première section du CSV, champs sans leurs guillemets
function parseCsvRecords(csv: string) {
  const unquote = (field: string) => field.replace(/^"|"$/g, '').replace(/""/g, '"')
  const [headerRow, ...dataRows] = parseRows(csv)
  const headers = parseFields(headerRow).map(unquote)
  const records = dataRows
    .filter((row) => row !== '')
    .map((row) =>
      Object.fromEntries(parseFields(row).map((field, index) => [headers[index], unquote(field)]))
    )
  return { headers, records }
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
    getAnalysesRobinetForExport: async () => [
      {
        code_installation: 'INST1',
        nom_installation: 'Installation 1',
        date_prelevement: '2024-03-15',
        parametre: 'Nitrates',
        valeur: 42,
      },
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
    assert.include(csv!, '"Point de prélèvement rattaché - Code"')
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

  test('keeps the existing columns first, and adds the new ones at the end', async ({ assert }) => {
    const service = new AacCsvService(createMockAacService(buildAacFixture()))
    const csv = await service.exportCaptages('12345')

    assert.deepEqual(parseCsvRecords(csv!).headers, [
      'Code',
      'Nom',
      'Code BSS',
      'Commune',
      'Département',
      'Type',
      'Nature',
      'Usage',
      'État',
      'Code PPE',
      'Prioritaire',
      'Point de prélèvement rattaché - Code',
      'Point de prélèvement rattaché - Nom',
      'Point de prélèvement rattaché - Code BSS',
      'Point de prélèvement rattaché - État',
      'Nouveau code BSS',
      'Origine du rattachement',
      'Recroisement géographique',
      'À part',
      'Point de prélèvement rattaché - Nouveau code BSS',
    ])
  })

  test('exports the fields of the November 2026 file', async ({ assert }) => {
    // D'après l'AAC 1694 La Couyère et l'AAC 5086 Apach (1)
    const fixture = buildAacFixture({
      installations: [
        {
          ...buildAacFixture().installations[0],
          code: '035000369',
          nom: 'PUITS DE LA COUYERE N°2',
          code_bss: '02833X0011/P2',
          code_bss_nouveau: 'BSS000VTYF',
          source_rattachement: 'sandre',
          recroisement_geographique: false,
          prioritaire: true,
          captages_rattaches: [
            {
              code: '035000777',
              nom: 'PUITS DE LA COUYERE N°3',
              code_bss: '02833X0023/P3',
              code_bss_nouveau: 'BSS000VTYR',
              etat: 'ACTIF',
            },
          ],
        },
        {
          ...buildAacFixture().installations[0],
          code: '057001111',
          nom: 'SOURCE APACH 1',
          code_bss: null,
          code_bss_nouveau: null,
          source_rattachement: 'point',
          recroisement_geographique: true,
          a_part: true,
          motif_a_part: 'abandon_aep',
          libelle_a_part: 'Abandonné pour l’eau potable',
          // Prioritaire par défaut seulement : un captage à part n'est pas présenté comme prioritaire
          prioritaire: true,
          captages_rattaches: null,
        },
      ],
    })
    const service = new AacCsvService(createMockAacService(fixture))
    const csv = await service.exportCaptages('12345')
    const { records } = parseCsvRecords(csv!)

    assert.lengthOf(records, 2)
    assert.include(records[0], {
      'Code BSS': '02833X0011/P2',
      'Prioritaire': 'Oui',
      'Point de prélèvement rattaché - Code': '035000777',
      'Nouveau code BSS': 'BSS000VTYF',
      'Origine du rattachement': 'Référentiel des AAC du Sandre',
      'Recroisement géographique': 'Non',
      'À part': '',
      'Point de prélèvement rattaché - Nouveau code BSS': 'BSS000VTYR',
    })
    assert.include(records[1], {
      'Code': '057001111',
      'Code BSS': '',
      'Prioritaire': 'Non',
      'Point de prélèvement rattaché - Code': '',
      'Nouveau code BSS': '',
      'Origine du rattachement': "Point de prélèvement situé dans l'AAC",
      'Recroisement géographique': 'Oui',
      'À part': 'Abandonné pour l’eau potable',
      'Point de prélèvement rattaché - Nouveau code BSS': '',
    })
  })

  test('leaves the new columns empty with a file older than November 2026', async ({ assert }) => {
    const service = new AacCsvService(createMockAacService(buildAacFixture()))
    const csv = await service.exportCaptages('12345')
    const { records } = parseCsvRecords(csv!)

    assert.include(records[0], {
      'Code': 'INST1',
      'Point de prélèvement rattaché - Code': 'CAP1',
      'Nouveau code BSS': '',
      'Origine du rattachement': '',
      'Recroisement géographique': '',
      'À part': '',
      'Point de prélèvement rattaché - Nouveau code BSS': '',
    })
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
      getAnalysesRobinetForExport: async () => [],
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

  test('continues gracefully when getAnalysesRobinetForExport throws', async ({ assert }) => {
    const mockService = {
      getByCode: async () => buildAacFixture() as unknown as Record<string, unknown>,
      getAnalysesRobinetForExport: async () => {
        throw new Error('S3 error')
      },
    } as unknown as AacService
    const service = new AacCsvService(mockService)
    const result = await service.exportQualiteEau('12345')
    assert.isNull(result)
  })
})
