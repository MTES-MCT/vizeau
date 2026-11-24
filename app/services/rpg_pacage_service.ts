import { inject } from '@adonisjs/core'
import type { DuckDBConnection } from '@duckdb/node-api'
import Parcelle from '#models/parcelle'
import { ExploitationService } from '#services/exploitation_service'
import { RpgDuckdbService } from '#services/rpg_duckdb_service'
import { TerritoireEmpriseService } from '#services/territoire_emprise_service'
import type {
  Bbox,
  RpgEmprisePacages,
  RpgExploitation,
  RpgExploitationPacages,
  RpgPacageFound,
  RpgPacageResult,
  RpgParcelle,
  RpgZoneExploitation,
} from '#types/rpg'

export type { Bbox }

// L'utilisateur voit les parcelles détaillées autour de ses AAC, à cette distance près
const ZONE_MARGIN_KM = 10
const KM_PER_DEGREE = 111.32
// Marge autour du centroïde d'une parcelle, en degrés (environ 50 m) : les tuiles arrondissent
// les coordonnées
const CENTROID_MARGIN = 0.0005
/** Côté maximal d'une emprise dont on demande les PACAGE, en degrés (20 à 28 km). */
export const MAX_EMPRISE_DEGREES = 0.25
// Maille de regroupement des parcelles dont on cherche le PACAGE, en degrés (environ 5 km) :
// chaque requête ne lit que les groupes de lignes autour de ses parcelles
const LOOKUP_CELL_DEGREES = 0.05

/** Parcelle lue dans `parcelles.parquet`. */
type ParquetParcelle = Omit<RpgParcelle, 'exploitation'> & { bbox: Bbox }

type LocatedParcelle = { rpgId: string; centroid: { x: number; y: number } }

/**
 * Parcelles du RPG et leur PACAGE, lus dans les Parquet privés du projet rpg, limités à la zone
 * de l'utilisateur : l'emprise de ses AAC, élargie de ZONE_MARGIN_KM. Le PACAGE est une
 * indication de la déclaration à l'ASP ; les noms viennent des exploitations de Viz'eau.
 *
 * Une parcelle n'est détaillée, et son PACAGE cherché, que si son emprise touche la zone.
 */
@inject()
export class RpgPacageService {
  constructor(
    protected territoireEmpriseService: TerritoireEmpriseService,
    protected rpg: RpgDuckdbService,
    protected exploitationService: ExploitationService
  ) {}

  /** Zone de l'utilisateur : emprise de chacune de ses AAC, élargie de ZONE_MARGIN_KM. */
  async getZone(userId: string): Promise<Bbox[]> {
    const { territoires, emprisesByCode } =
      await this.territoireEmpriseService.getTerritoiresWithEmprises(userId)
    return territoires.flatMap(({ code }) => {
      const bbox = code ? emprisesByCode[code]?.bbox : null
      return bbox ? [enlarge(bbox, ZONE_MARGIN_KM)] : []
    })
  }

  /** Parcelles du PACAGE dans la zone de l'utilisateur. */
  async searchByPacage(
    userId: string,
    millesime: number,
    pacage: string
  ): Promise<RpgPacageResult> {
    const zone = await this.getZone(userId)
    // Sans AAC, pas de zone : inutile de lire le Parquet
    if (zone.length === 0) return { status: 'outsideZone' }

    const parcelles = await this.rpg.withMillesime(millesime, (connection) =>
      this.readPacage(connection, millesime, pacage)
    )
    return this.toResult(zone, millesime, pacage, parcelles)
  }

  /** PACAGE d'une parcelle choisie sur la carte, avec toutes ses parcelles de la zone. */
  async searchByParcelle(
    userId: string,
    millesime: number,
    rpgId: string,
    centroid: { x: number; y: number }
  ): Promise<RpgPacageResult> {
    const zone = await this.getZone(userId)
    if (!touches(around(centroid), zone)) return { status: 'outsideZone' }

    const found = await this.rpg.withMillesime(millesime, async (connection) => {
      const pacages = await this.lookupPacages(connection, millesime, [{ rpgId, centroid }])
      const pacage = pacages.get(rpgId)
      return pacage && { pacage, parcelles: await this.readPacage(connection, millesime, pacage) }
    })
    if (!found) return { status: 'notFound' }
    return this.toResult(zone, millesime, found.pacage, found.parcelles)
  }

  /**
   * PACAGE des parcelles d'une emprise (de côté MAX_EMPRISE_DEGREES au plus) qui touchent la
   * zone : de quoi regrouper une sélection ou colorer la carte par PACAGE.
   */
  async getEmprisePacages(
    userId: string,
    millesime: number,
    emprise: Bbox
  ): Promise<RpgEmprisePacages> {
    const zone = await this.getZone(userId)
    if (!touches(emprise, zone)) return { pacages: [] }

    // Emprise en constantes : DuckDB ne lit que les groupes de lignes qui la touchent
    const [west, south, east, north] = emprise
    const rows = await this.rpg.withMillesime(millesime, async (connection) => {
      const reader = await connection.runAndReadAll(
        `SELECT id::VARCHAR AS rpg_id, pacage, xmin, ymin, xmax, ymax
         FROM read_parquet($url)
         WHERE xmin <= ${east} AND xmax >= ${west} AND ymin <= ${north} AND ymax >= ${south}
         ORDER BY fid`,
        { url: this.rpg.fileUrl(millesime, 'parcelles.parquet') }
      )
      return reader.getRowObjectsJson()
    })

    const rpgIdsByPacage = new Map<string, string[]>()
    for (const row of rows) {
      const bbox = [row.xmin, row.ymin, row.xmax, row.ymax].map(Number) as Bbox
      if (!row.pacage || !touches(bbox, zone)) continue
      const pacage = String(row.pacage)
      rpgIdsByPacage.set(pacage, [...(rpgIdsByPacage.get(pacage) ?? []), String(row.rpg_id)])
    }
    return {
      pacages: [...rpgIdsByPacage]
        .map(([pacage, rpgIds]) => ({ pacage, rpgIds }))
        .sort((a, b) => b.rpgIds.length - a.rpgIds.length || a.pacage.localeCompare(b.pacage)),
    }
  }

  /**
   * PACAGE des parcelles enregistrées d'une exploitation Viz'Eau pour le millésime, chacun avec
   * toutes ses parcelles de la zone : de quoi regrouper la sélection par PACAGE et proposer les
   * parcelles qui manquent. `null` si l'utilisateur n'a pas accès à l'exploitation.
   */
  async getExploitationPacages(
    userId: string,
    millesime: number,
    exploitationId: string
  ): Promise<RpgExploitationPacages | null> {
    const exploitation = await this.exploitationService
      .queryActiveExploitations(userId)
      .where('id', exploitationId)
      .first()
    if (!exploitation) return null

    const [zone, saved] = await Promise.all([
      this.getZone(userId),
      Parcelle.query()
        .where('exploitationId', exploitationId)
        .where('year', millesime)
        .whereNotNull('rpgId')
        .select('rpgId', 'centroid')
        .orderBy('rpgId'),
    ])
    const horsZone: string[] = []
    const introuvables: string[] = []
    const located: LocatedParcelle[] = []
    for (const { rpgId, centroid } of saved) {
      if (!centroid) introuvables.push(rpgId!)
      else if (!touches(around(centroid), zone)) horsZone.push(rpgId!)
      else located.push({ rpgId: rpgId!, centroid })
    }
    if (located.length === 0) return { pacages: [], horsZone, introuvables }

    const { pacageByRpgId, parcellesByPacage } = await this.rpg.withMillesime(
      millesime,
      async (connection) => {
        const pacages = await this.lookupPacages(connection, millesime, located)
        const parcelles = new Map<string, ParquetParcelle[]>()
        for (const pacage of new Set(pacages.values())) {
          parcelles.set(pacage, await this.readPacage(connection, millesime, pacage))
        }
        return { pacageByRpgId: pacages, parcellesByPacage: parcelles }
      }
    )

    for (const { rpgId } of located) if (!pacageByRpgId.has(rpgId)) introuvables.push(rpgId)
    const pacages: RpgPacageFound[] = []
    for (const [pacage, parcelles] of parcellesByPacage) {
      const result = await this.toResult(zone, millesime, pacage, parcelles)
      if (result.status === 'found') pacages.push(result)
    }
    pacages.sort(
      (a, b) => b.parcelles.length - a.parcelles.length || a.pacage.localeCompare(b.pacage)
    )
    return { pacages, horsZone, introuvables }
  }

  /**
   * Exploitations Viz'Eau qui ont des parcelles dans la zone de l'utilisateur pour ce millésime,
   * avec ces parcelles, repérées par leur centroïde : de quoi colorer la carte par exploitation
   * et nommer l'exploitation d'une parcelle survolée. Les plus grandes d'abord.
   */
  async getZoneExploitations(userId: string, millesime: number): Promise<RpgZoneExploitation[]> {
    const zone = await this.getZone(userId)
    if (zone.length === 0) return []

    const parcelles = await Parcelle.query()
      .where('year', millesime)
      .whereNotNull('exploitationId')
      .whereNotNull('rpgId')
      .where((query) => {
        for (const [west, south, east, north] of zone) {
          query.orWhereRaw('centroid <@ box(point(?, ?), point(?, ?))', [west, south, east, north])
        }
      })
      .select('rpgId', 'exploitationId')
      .orderBy('rpgId')
      .preload('exploitation', (query) => query.select('id', 'name'))

    const byId = new Map<string, RpgZoneExploitation>()
    for (const { rpgId, exploitation } of parcelles) {
      const entry = byId.get(exploitation.id) ?? {
        id: exploitation.id,
        name: exploitation.name,
        rpgIds: [],
      }
      entry.rpgIds.push(rpgId!)
      byId.set(exploitation.id, entry)
    }
    return [...byId.values()].sort(
      (a, b) => b.rpgIds.length - a.rpgIds.length || a.name.localeCompare(b.name, 'fr')
    )
  }

  /** Résultat d'une recherche de PACAGE, d'après toutes ses parcelles lues dans le Parquet. */
  private async toResult(
    zone: Bbox[],
    millesime: number,
    pacage: string,
    parcelles: ParquetParcelle[]
  ): Promise<RpgPacageResult> {
    if (parcelles.length === 0) return { status: 'notFound' }
    const inZone = parcelles.filter(({ bbox }) => touches(bbox, zone))
    if (inZone.length === 0) return { status: 'outsideZone' }

    const withExploitations = await this.withExploitations(millesime, inZone)
    return {
      status: 'found',
      pacage,
      millesime: String(millesime),
      exploitation: mostFrequent(withExploitations.map(({ exploitation }) => exploitation)),
      parcelles: withExploitations,
      bbox: union(inZone.map(({ bbox }) => bbox)),
      parcellesHorsZone: parcelles.length - inZone.length,
    }
  }

  /** Toutes les parcelles du PACAGE dans le millésime, dans et hors de la zone. */
  private async readPacage(
    connection: DuckDBConnection,
    millesime: number,
    pacage: string
  ): Promise<ParquetParcelle[]> {
    // La table des exploitations sert d'index : elle donne les fid des parcelles du PACAGE
    const exploitations = await connection.runAndReadAll(
      'SELECT fids FROM read_parquet($url) WHERE pacage = $pacage',
      { url: this.rpg.fileUrl(millesime, 'exploitations.parquet'), pacage }
    )
    const fids = exploitations
      .getRowObjectsJson()
      .flatMap(({ fids: list }) => (Array.isArray(list) ? list : []))
      .filter((fid): fid is number => Number.isInteger(fid))
    if (fids.length === 0) return []

    // fid en constantes : DuckDB ne lit que les groupes de lignes qui les contiennent. Pas de
    // condition sur pacage, qui lui ferait tester les filtres de Bloom de tout le fichier : le
    // PACAGE des lignes lues est contrôlé ensuite.
    const reader = await connection.runAndReadAll(
      `SELECT id::VARCHAR AS rpg_id, pacage, code_culture, surface_geometrie, bio, cx, cy,
              xmin, ymin, xmax, ymax
       FROM read_parquet($url) WHERE fid IN (${fids.join(', ')})
       ORDER BY fid`,
      { url: this.rpg.fileUrl(millesime, 'parcelles.parquet') }
    )
    return reader
      .getRowObjectsJson()
      .filter((row) => row.pacage === pacage)
      .map((row) => ({
        rpgId: String(row.rpg_id),
        cultureCode: row.code_culture as string | null,
        // En hectares, au centième comme dans les tuiles
        surface:
          row.surface_geometrie === null
            ? null
            : Math.round(Number(row.surface_geometrie) * 100) / 100,
        bio: Number(row.bio) === 1,
        centroid: { x: Number(row.cx), y: Number(row.cy) },
        bbox: [row.xmin, row.ymin, row.xmax, row.ymax].map(Number) as Bbox,
      }))
  }

  /**
   * PACAGE de parcelles repérées par leur identifiant et leur centroïde. Les parcelles sont
   * regroupées par maille : une requête par maille, limitée à l'emprise de ses centroïdes, pour
   * que DuckDB ne lise que les groupes de lignes autour. Une parcelle absente du résultat n'est
   * pas dans le RPG du millésime à cet endroit.
   */
  private async lookupPacages(
    connection: DuckDBConnection,
    millesime: number,
    parcelles: LocatedParcelle[]
  ): Promise<Map<string, string>> {
    const cells = new Map<string, LocatedParcelle[]>()
    for (const parcelle of parcelles) {
      const { x, y } = parcelle.centroid
      const cell = `${Math.floor(x / LOOKUP_CELL_DEGREES)}:${Math.floor(y / LOOKUP_CELL_DEGREES)}`
      cells.set(cell, [...(cells.get(cell) ?? []), parcelle])
    }

    const pacages = new Map<string, string>()
    for (const cell of cells.values()) {
      const [west, south, east, north] = union(cell.map(({ centroid }) => around(centroid)))
      const ids = cell.map(({ rpgId }) => BigInt(rpgId))
      const reader = await connection.runAndReadAll(
        `SELECT id::VARCHAR AS rpg_id, pacage FROM read_parquet($url)
         WHERE xmin <= ${east} AND xmax >= ${west} AND ymin <= ${north} AND ymax >= ${south}
           AND id IN (${ids.join(', ')})`,
        { url: this.rpg.fileUrl(millesime, 'parcelles.parquet') }
      )
      for (const row of reader.getRowObjectsJson()) {
        if (row.pacage) pacages.set(String(row.rpg_id), String(row.pacage))
      }
    }
    return pacages
  }

  /** Ajoute à chaque parcelle l'exploitation Viz'Eau à laquelle elle est rattachée. */
  private async withExploitations(
    millesime: number,
    parcelles: ParquetParcelle[]
  ): Promise<RpgParcelle[]> {
    const rattachees = await Parcelle.query()
      .where('year', millesime)
      .whereIn(
        'rpgId',
        parcelles.map(({ rpgId }) => rpgId)
      )
      .whereNotNull('exploitationId')
      .preload('exploitation', (query) => query.select('id', 'name'))
    const byRpgId = new Map<string, RpgExploitation>(
      rattachees.map(({ rpgId, exploitation }) => [
        rpgId!,
        { id: exploitation.id, name: exploitation.name },
      ])
    )
    return parcelles.map(({ bbox: _, ...parcelle }) => ({
      ...parcelle,
      exploitation: byRpgId.get(parcelle.rpgId) ?? null,
    }))
  }
}

/** Petite emprise autour d'un centroïde. */
function around({ x, y }: { x: number; y: number }): Bbox {
  return [x - CENTROID_MARGIN, y - CENTROID_MARGIN, x + CENTROID_MARGIN, y + CENTROID_MARGIN]
}

function intersects(a: Bbox, b: Bbox) {
  return a[0] <= b[2] && a[2] >= b[0] && a[1] <= b[3] && a[3] >= b[1]
}

/** L'emprise touche-t-elle la zone ? */
function touches(bbox: Bbox, zone: Bbox[]) {
  return zone.some((area) => intersects(bbox, area))
}

function union(bboxes: Bbox[]): Bbox {
  return [
    Math.min(...bboxes.map((bbox) => bbox[0])),
    Math.min(...bboxes.map((bbox) => bbox[1])),
    Math.max(...bboxes.map((bbox) => bbox[2])),
    Math.max(...bboxes.map((bbox) => bbox[3])),
  ]
}

/** Exploitation la plus fréquente, la première rencontrée en cas d'égalité. */
function mostFrequent(exploitations: (RpgExploitation | null)[]): RpgExploitation | null {
  const counts = new Map<string, { exploitation: RpgExploitation; count: number }>()
  for (const exploitation of exploitations) {
    if (!exploitation) continue
    const entry = counts.get(exploitation.id) ?? { exploitation, count: 0 }
    entry.count++
    counts.set(exploitation.id, entry)
  }
  let best: { exploitation: RpgExploitation; count: number } | null = null
  for (const entry of counts.values()) if (!best || entry.count > best.count) best = entry
  return best?.exploitation ?? null
}

/** Élargit l'emprise de `km` kilomètres de chaque côté. */
export function enlarge([west, south, east, north]: Bbox, km: number): Bbox {
  const dy = km / KM_PER_DEGREE
  // Un degré de longitude raccourcit vers les pôles : on le mesure au bord le plus éloigné de
  // l'équateur, pour que la marge fasse au moins `km` partout
  const latitude = Math.min(89, Math.max(Math.abs(south), Math.abs(north)) + dy)
  const dx = km / (KM_PER_DEGREE * Math.cos((latitude * Math.PI) / 180))
  return [west - dx, south - dy, east + dx, north + dy]
}
