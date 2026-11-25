import { test } from '@japa/runner'
import testUtils from '@adonisjs/core/services/test_utils'
import { mkdtemp, mkdir, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { randomUUID } from 'node:crypto'
import { DuckDBInstance } from '@duckdb/node-api'
import Exploitation from '#models/exploitation'
import { ExploitationFactory } from '#database/factories/exploitation_factory'
import { ParcelleFactory } from '#database/factories/parcelle_factory'
import type { ExploitationService } from '#services/exploitation_service'
import { RpgDuckdbService } from '#services/rpg_duckdb_service'
import { enlarge, RpgPacageService, type Bbox } from '#services/rpg_pacage_service'
import type { TerritoireEmpriseService } from '#services/territoire_emprise_service'

/*
 * Parquet fictifs au format du projet rpg, autour d'une AAC :
 * - PACAGE 057000001 : deux parcelles dans la zone, une hors de la zone ;
 * - PACAGE 057000002 : une parcelle dans la zone ;
 * - PACAGE 057000003 : une parcelle hors de la zone seulement.
 */
const PARCELLES = `
  SELECT fid, id::BIGINT AS id, pacage, code_culture,
         COLUMNS(* EXCLUDE (fid, id, pacage, code_culture))::DOUBLE
  FROM (VALUES
    (1, 1001, '057000001', 'BTH', 10.5, 1, 5.02, 45.02, 5.01, 45.01, 5.03, 45.03),
    (2, 1002, '057000001', 'MIS', 3.214, 0, 5.05, 45.05, 5.04, 45.04, 5.06, 45.06),
    (3, 1003, '057000001', 'PPH', 1.0, 0, 7.0, 47.0, 6.99, 46.99, 7.01, 47.01),
    (4, 1004, '057000002', 'ORH', 4.0, 0, 5.08, 45.08, 5.07, 45.07, 5.09, 45.09),
    (5, 1005, '057000003', 'PPH', 2.0, 0, 7.1, 47.1, 7.09, 47.09, 7.11, 47.11)
  ) t(fid, id, pacage, code_culture, surface_geometrie, bio, cx, cy, xmin, ymin, xmax, ymax)`
const EXPLOITATIONS = `
  SELECT * FROM (VALUES
    ('057000001', [1, 2, 3]), ('057000002', [4]), ('057000003', [5])
  ) t(pacage, fids)`
const AAC_BBOX: Bbox = [5.0, 45.0, 5.1, 45.1]

let dir: string

class TestRpgDuckdbService extends RpgDuckdbService {
  protected baseUrl() {
    return dir
  }

  protected defaultMillesime() {
    return 2024
  }
}

function createService(bbox: Bbox | null = AAC_BBOX) {
  const territoireEmpriseService = {
    async getTerritoiresWithEmprises() {
      return { territoires: [{ code: 'AAC1' }], emprisesByCode: { AAC1: { bbox } } }
    },
  } as unknown as TerritoireEmpriseService
  // Toutes les exploitations sont accessibles
  const exploitationService = {
    queryActiveExploitations: () => Exploitation.query(),
  } as unknown as ExploitationService
  return new RpgPacageService(
    territoireEmpriseService,
    new TestRpgDuckdbService(),
    exploitationService
  )
}

const parcelle = (rpgId: string, cultureCode: string, surface: number, x: number, y: number) => ({
  rpgId,
  cultureCode,
  surface,
  bio: false,
  centroid: { x, y },
  exploitation: null,
})

test.group('RpgPacageService', (group) => {
  group.setup(async () => {
    dir = await mkdtemp(join(tmpdir(), 'rpg-pacage-'))
    const instance = await DuckDBInstance.create(':memory:')
    const connection = await instance.connect()
    // 2024 est le millésime par défaut, 2023 passe par l'instance des autres millésimes
    for (const millesime of [2023, 2024]) {
      await mkdir(join(dir, String(millesime)))
      await connection.run(`COPY (${PARCELLES}) TO '${dir}/${millesime}/parcelles.parquet'`)
      await connection.run(`COPY (${EXPLOITATIONS}) TO '${dir}/${millesime}/exploitations.parquet'`)
    }
    connection.closeSync()
    instance.closeSync()
  })
  group.teardown(async () => {
    await RpgDuckdbService.closeAll()
    await rm(dir, { recursive: true, force: true })
  })
  group.each.setup(() => testUtils.db().withGlobalTransaction())

  test('returns the parcelles of a PACAGE inside the user zone', async ({ assert }) => {
    const result = await createService().searchByPacage('user', 2024, '057000001')

    assert.deepEqual(result, {
      status: 'found',
      pacage: '057000001',
      millesime: '2024',
      exploitation: null,
      parcelles: [
        { ...parcelle('1001', 'BTH', 10.5, 5.02, 45.02), bio: true },
        // Surface au centième
        parcelle('1002', 'MIS', 3.21, 5.05, 45.05),
      ],
      bbox: [5.01, 45.01, 5.06, 45.06],
      parcellesHorsZone: 1,
    })
  })

  test('gives the Viz’Eau exploitation of attached parcelles', async ({ assert }) => {
    const exploitation = await ExploitationFactory.merge({ name: 'Ferme de test' }).create()
    await ParcelleFactory.merge({
      year: 2024,
      rpgId: '1002',
      exploitationId: exploitation.id,
    }).create()

    const result = await createService().searchByPacage('user', 2024, '057000001')

    const expected = { id: exploitation.id, name: 'Ferme de test' }
    assert.deepEqual(result.status === 'found' && result.exploitation, expected)
    assert.deepEqual(
      result.status === 'found' && result.parcelles.map((p) => [p.rpgId, p.exploitation]),
      [
        ['1001', null],
        ['1002', expected],
      ]
    )
  })

  test('reads a millésime other than the default one', async ({ assert }) => {
    const result = await createService().searchByPacage('user', 2023, '057000002')

    assert.deepEqual(result.status === 'found' && result.parcelles.map(({ rpgId }) => rpgId), [
      '1004',
    ])
  })

  test('tells an unknown PACAGE from a PACAGE outside the zone', async ({ assert }) => {
    const service = createService()

    assert.deepEqual(await service.searchByPacage('user', 2024, '057999999'), {
      status: 'notFound',
    })
    assert.deepEqual(await service.searchByPacage('user', 2024, '057000003'), {
      status: 'outsideZone',
    })
    // Sans AAC, l'utilisateur n'a pas de zone
    assert.deepEqual(await createService(null).searchByPacage('user', 2024, '057000001'), {
      status: 'outsideZone',
    })
  })

  test('finds the PACAGE of a parcelle from its id and centroid', async ({ assert }) => {
    const service = createService()

    const found = await service.searchByParcelle('user', 2024, '1004', { x: 5.08, y: 45.08 })
    const wrongPlace = await service.searchByParcelle('user', 2024, '1004', { x: 5.02, y: 45.02 })
    const outsideZone = await service.searchByParcelle('user', 2024, '1003', { x: 7.0, y: 47.0 })

    assert.deepEqual(found.status === 'found' && [found.pacage, found.parcelles[0].rpgId], [
      '057000002',
      '1004',
    ])
    assert.deepEqual(wrongPlace, { status: 'notFound' })
    assert.deepEqual(outsideZone, { status: 'outsideZone' })
  })

  test('groups the parcelles of an emprise by PACAGE, inside the zone only', async ({ assert }) => {
    const service = createService()

    const inside = await service.getEmprisePacages('user', 2024, [5.0, 45.0, 5.1, 45.1])
    // L'emprise déborde de la zone : la parcelle hors zone n'en fait pas partie
    const across = await service.getEmprisePacages('user', 2024, [5.0, 45.0, 7.2, 47.2])
    const outside = await service.getEmprisePacages('user', 2024, [6.9, 46.9, 7.2, 47.2])

    assert.deepEqual(inside, {
      pacages: [
        { pacage: '057000001', rpgIds: ['1001', '1002'] },
        { pacage: '057000002', rpgIds: ['1004'] },
      ],
    })
    assert.deepEqual(across, inside)
    assert.deepEqual(outside, { pacages: [] })
  })

  test('gives the PACAGE of the saved parcelles of an exploitation', async ({ assert }) => {
    const exploitation = await ExploitationFactory.create()
    const saved = (rpgId: string, centroid: { x: number; y: number } | null, year = 2024) => ({
      rpgId,
      centroid,
      year,
      exploitationId: exploitation.id,
    })
    await ParcelleFactory.merge([
      saved('1001', { x: 5.02, y: 45.02 }),
      saved('1004', { x: 5.08, y: 45.08 }),
      // Hors de la zone : son PACAGE n'est pas cherché
      saved('1005', { x: 7.1, y: 47.1 }),
      // Absente du RPG à cet endroit, ou sans centroïde
      saved('9999', { x: 5.03, y: 45.03 }),
      saved('9998', null),
      // Autre millésime : ignorée
      saved('1002', { x: 5.05, y: 45.05 }, 2023),
    ]).createMany(6)

    const result = await createService().getExploitationPacages('user', 2024, exploitation.id)

    assert.deepEqual(
      result?.pacages.map(({ pacage, parcelles }) => [
        pacage,
        parcelles.map(({ rpgId, exploitation: owner }) => [rpgId, owner?.id ?? null]),
      ]),
      [
        [
          '057000001',
          [
            ['1001', exploitation.id],
            ['1002', null],
          ],
        ],
        ['057000002', [['1004', exploitation.id]]],
      ]
    )
    assert.deepEqual(result?.horsZone, ['1005'])
    assert.sameMembers(result?.introuvables ?? [], ['9998', '9999'])
    // Exploitation inaccessible
    assert.isNull(await createService().getExploitationPacages('user', 2024, randomUUID()))
  })

  test('lists the Viz’Eau exploitations with parcelles in the user zone', async ({ assert }) => {
    const [grande, petite, lointaine] = await ExploitationFactory.merge([
      { name: 'Grande ferme' },
      { name: 'Petite ferme' },
      { name: 'Ferme lointaine' },
    ]).createMany(3)
    const near = { x: 5.05, y: 45.05 }
    await ParcelleFactory.merge([
      { year: 2024, rpgId: '2001', centroid: near, exploitationId: grande.id },
      { year: 2024, rpgId: '2002', centroid: near, exploitationId: grande.id },
      { year: 2024, rpgId: '2003', centroid: near, exploitationId: petite.id },
      // Hors de la zone, d'un autre millésime, ou sans exploitation : ignorées
      { year: 2024, rpgId: '2004', centroid: { x: 7, y: 47 }, exploitationId: lointaine.id },
      { year: 2023, rpgId: '2005', centroid: near, exploitationId: petite.id },
      { year: 2024, rpgId: '2006', centroid: near, exploitationId: null },
    ]).createMany(6)

    const exploitations = await createService().getZoneExploitations('user', 2024)

    assert.deepEqual(
      exploitations.map(({ name, rpgIds }) => [name, rpgIds]),
      [
        ['Grande ferme', ['2001', '2002']],
        ['Petite ferme', ['2003']],
      ]
    )
  })
})

test.group('enlarge', () => {
  test('adds the margin on each side, wider in longitude away from the equator', ({ assert }) => {
    const [west, south, east, north] = enlarge([5, 45, 5.1, 45.1], 10)

    assert.closeTo(45 - south, 0.0898, 0.0001)
    assert.closeTo(north - 45.1, 0.0898, 0.0001)
    // 10 km font environ 0,128° de longitude vers 45,2° de latitude
    assert.closeTo(5 - west, 0.128, 0.001)
    assert.closeTo(east - 5.1, 0.128, 0.001)
  })
})
