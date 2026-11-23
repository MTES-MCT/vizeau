import { DuckDBInstance, type DuckDBConnection } from '@duckdb/node-api'
import db from '@adonisjs/lucid/services/db'
import Parcelle from '#models/parcelle'
import { createAacS3Secret, sqlEscape } from '#services/duckdb_service'

/**
 * Passage des parcelles enregistrées à l'identifiant stable des tuiles du projet rpg.
 *
 * Chaque parcelle d'un millésime est retrouvée dans le fichier `parcelles.parquet` de ce
 * millésime, produit par le projet rpg, en deux passes :
 * 1. même culture, centroïde dans la parcelle ou à moins de 10 m, une seule candidate ;
 * 2. pour les parcelles restantes : même culture, surface géométrique à 2 % près (+ 0,01 ha),
 *    une seule candidate parmi les parcelles des PACAGE de l'exploitation (connus par la
 *    passe 1) et celles à moins de 500 m du centroïde.
 *
 * Ce fichier est privé, car il contient les PACAGE. Ils restent dans DuckDB : ils ne sont ni
 * renvoyés, ni affichés, ni écrits.
 *
 * Écrit pour DuckDB 1.4 : la version de `@duckdb/node-api` est fixée par package-lock.json,
 * mais package.json accepte toute 1.x, donc `npm update` peut la changer. Deux particularités
 * de la 1.4, absentes de la 2.0 qu'utilise le projet rpg, sont contournées :
 * - ST_Distance_Sphere attend (latitude, longitude) et se trompe sans erreur sur des points
 *   (longitude, latitude) : 1 112 m au lieu de 733 m. D'où la macro `distance_m` ;
 * - ST_ClosestPoint n'existe pas : on prend le début de ST_ShortestLine(parcelle, centroïde).
 */

export type RpgIdCorrespondance = {
  parcelleId: string
  /** Identifiant en base au moment du calcul */
  legacyRpgId: string
  /** Identifiant stable */
  rpgId: string
  passe: 1 | 2
}

export type RpgIdMatching = {
  correspondances: RpgIdCorrespondance[]
  /** Parcelles sans candidate unique : à rattacher à la main */
  unmatched: { parcelleId: string; cultureCode: string | null; surface: number | null }[]
}

export type RpgIdMigrationReport = {
  /** Parcelles dont l'identifiant est remplacé, ou le serait sans `apply` */
  migrated: RpgIdCorrespondance[]
  /** Parcelles qui portent déjà l'identifiant stable (enregistrées depuis les nouvelles tuiles) */
  upToDate: string[]
  /** Parcelles supprimées pendant le calcul */
  missing: string[]
  /** Correspondances qui ne s'appliquent pas : rien n'est écrit tant qu'il en reste */
  conflicts: { parcelleId: string; reason: string }[]
  applied: boolean
}

// Parcelles du Parquet lues autour de chaque centroïde, en degrés (environ 2 km)
const WINDOW = 0.02
// Côté des zones lues séparément, en degrés (environ 10 km)
const ZONE = 0.1
// Par défaut, DuckDB s'accorde 80 % de la mémoire du conteneur. Il en prend aussi hors de cette
// limite pour lire le Parquet, et Node a la sienne : la commande est alors tuée, quelle que soit
// la taille du conteneur. Avec cette valeur, elle tient dans 1 Go (conteneur L de Scalingo).
const MEMORY_LIMIT = '256MB'

export class ParcelleRpgIdService {
  /**
   * Calcule l'identifiant stable des parcelles du millésime qui n'ont pas encore été migrées.
   * `parquet` est un chemin local ou une URL s3://, lue avec la clé AAC_FILES_S3_*.
   */
  async match(millesime: number, parquet: string): Promise<RpgIdMatching> {
    const parcelles = await Parcelle.query()
      .where('year', millesime)
      .whereNull('legacyRpgId')
      .whereNotNull('rpgId')
      .select('id', 'exploitationId', 'rpgId', 'surface', 'cultureCode', 'centroid')
    if (parcelles.length === 0) return { correspondances: [], unmatched: [] }

    const instance = await DuckDBInstance.create(':memory:', { memory_limit: MEMORY_LIMIT })
    const connection = await instance.connect()
    try {
      await connection.run('INSTALL spatial; LOAD spatial;')
      if (parquet.startsWith('s3://')) {
        await connection.run('INSTALL httpfs; LOAD httpfs;')
        await createAacS3Secret(connection)
      }
      await this.loadParcelles(connection, parcelles)
      await this.matchParcelles(connection, `read_parquet('${sqlEscape(parquet)}')`, parcelles)

      const reader = await connection.runAndReadAll(`
        SELECT v.id, v.rpg_id, v.culture_code, v.surface,
               coalesce(p1.nouvel_id, p2.nouvel_id)::VARCHAR AS nouvel_id,
               CASE WHEN p1.id IS NOT NULL THEN 1 WHEN p2.id IS NOT NULL THEN 2 END AS passe
        FROM v LEFT JOIN p1 USING (id) LEFT JOIN p2 USING (id)
        ORDER BY v.id`)
      const rows = reader.getRowObjectsJson() as {
        id: string
        rpg_id: string
        culture_code: string | null
        surface: number | null
        nouvel_id: string | null
        passe: 1 | 2 | null
      }[]

      const matching: RpgIdMatching = { correspondances: [], unmatched: [] }
      for (const row of rows) {
        if (row.nouvel_id && row.passe) {
          matching.correspondances.push({
            parcelleId: row.id,
            legacyRpgId: row.rpg_id,
            rpgId: row.nouvel_id,
            passe: row.passe,
          })
        } else {
          matching.unmatched.push({
            parcelleId: row.id,
            cultureCode: row.culture_code,
            surface: row.surface,
          })
        }
      }
      return matching
    } finally {
      connection.closeSync()
      instance.closeSync()
    }
  }

  // Table `v` : parcelles de la base, avec leur centroïde (longitude, latitude)
  private async loadParcelles(connection: DuckDBConnection, parcelles: Parcelle[]) {
    await connection.run(`CREATE TABLE base (id VARCHAR, exploitation_id VARCHAR, rpg_id VARCHAR,
      surface DOUBLE, culture_code VARCHAR, x DOUBLE, y DOUBLE)`)
    const appender = await connection.createAppender('base')
    for (const parcelle of parcelles) {
      const optional = (value: string | number | null | undefined) => {
        if (value === null || value === undefined) appender.appendNull()
        else if (typeof value === 'number') appender.appendDouble(value)
        else appender.appendVarchar(value)
      }
      appender.appendVarchar(parcelle.id)
      optional(parcelle.exploitationId)
      appender.appendVarchar(parcelle.rpgId!)
      optional(parcelle.surface === null ? null : Number(parcelle.surface))
      optional(parcelle.cultureCode)
      optional(parcelle.centroid?.x)
      optional(parcelle.centroid?.y)
      appender.endRow()
    }
    appender.closeSync()
    await connection.run(`CREATE TABLE v AS
      SELECT * EXCLUDE (x, y), CASE WHEN x IS NOT NULL THEN ST_Point(x, y) END AS pt FROM base`)
  }

  // Tables `p1` et `p2` : identifiant stable trouvé à chaque passe (id, nouvel_id)
  private async matchParcelles(
    connection: DuckDBConnection,
    source: string,
    parcelles: Parcelle[]
  ) {
    // Distance en mètres entre deux points (longitude, latitude). ST_Distance_Sphere n'attend
    // pas le même ordre des axes selon les versions de DuckDB : la formule est écrite ici.
    await connection.run(`CREATE MACRO distance_m(a, b) AS 2 * 6371008.8 * asin(sqrt(
      pow(sin(radians(ST_Y(b) - ST_Y(a)) / 2), 2)
      + cos(radians(ST_Y(a))) * cos(radians(ST_Y(b))) * pow(sin(radians(ST_X(b) - ST_X(a)) / 2), 2)))`)

    // Une lecture par zone de ZONE degrés qui contient des centroïdes, avec l'emprise de ses
    // fenêtres en constantes : DuckDB ne lit que les groupes de lignes du Parquet qui la touchent.
    // Une seule emprise pour toutes les parcelles couvrirait plus de la moitié du fichier dès
    // qu'elles sont réparties sur plusieurs territoires.
    const zones = new Map<string, { xmin: number; xmax: number; ymin: number; ymax: number }>()
    for (const { centroid } of parcelles) {
      if (!centroid) continue
      const { x, y } = centroid
      const key = `${Math.floor(x / ZONE)}:${Math.floor(y / ZONE)}`
      const zone = zones.get(key)
      if (zone) {
        zone.xmin = Math.min(zone.xmin, x)
        zone.xmax = Math.max(zone.xmax, x)
        zone.ymin = Math.min(zone.ymin, y)
        zone.ymax = Math.max(zone.ymax, y)
      } else {
        zones.set(key, { xmin: x, xmax: x, ymin: y, ymax: y })
      }
    }
    const emprises =
      zones.size === 0
        ? ['false']
        : [...zones.values()].map(
            ({ xmin, xmax, ymin, ymax }) =>
              `p.xmin <= ${xmax + WINDOW} AND p.xmax >= ${xmin - WINDOW}
               AND p.ymin <= ${ymax + WINDOW} AND p.ymax >= ${ymin - WINDOW}`
          )
    const lectures = emprises.map(
      (emprise) => `
      SELECT p.id AS nouvel_id, p.pacage, p.code_culture AS code, p.surface_geometrie AS surf_geo, p.geom
      FROM ${source} p
      WHERE ${emprise} AND EXISTS (SELECT 1 FROM v WHERE v.pt IS NOT NULL
        AND p.xmin <= ST_X(v.pt) + ${WINDOW} AND p.xmax >= ST_X(v.pt) - ${WINDOW}
        AND p.ymin <= ST_Y(v.pt) + ${WINDOW} AND p.ymax >= ST_Y(v.pt) - ${WINDOW})`
    )
    // Le pied du fichier, qui décrit ses groupes de lignes, n'est lu qu'une fois pour toutes les
    // zones. Deux zones voisines peuvent lire la même parcelle : elle n'est gardée qu'une fois.
    await connection.run('SET parquet_metadata_cache = true')
    await connection.run(`CREATE TABLE rpg AS
      SELECT DISTINCT ON (nouvel_id) * FROM (${lectures.join('\nUNION ALL\n')})`)

    // Passe 1 : même culture, centroïde dans la parcelle ou à moins de 10 m, candidate unique.
    // Le début de la ligne la plus courte est le point de la parcelle le plus proche du
    // centroïde (le centroïde lui-même s'il est dans la parcelle).
    await connection.run(`CREATE TABLE p1 AS
      SELECT v.id, v.exploitation_id, r.nouvel_id, r.pacage
      FROM v JOIN rpg r
        ON ST_XMin(r.geom) <= ST_X(v.pt) + 0.0002 AND ST_XMax(r.geom) >= ST_X(v.pt) - 0.0002
       AND ST_YMin(r.geom) <= ST_Y(v.pt) + 0.0002 AND ST_YMax(r.geom) >= ST_Y(v.pt) - 0.0002
      WHERE r.code = v.culture_code AND distance_m(v.pt, ST_StartPoint(ST_ShortestLine(r.geom, v.pt))) <= 10
      QUALIFY count(*) OVER (PARTITION BY v.id) = 1`)

    // Passe 2, pour les parcelles restantes : même culture, surface géométrique à 2 % près,
    // dans un PACAGE de l'exploitation ou à moins de 500 m, candidate unique
    await connection.run(`CREATE TABLE p2 (id VARCHAR, nouvel_id BIGINT)`)
    // PACAGE des seules exploitations qui ont des parcelles restantes : moins il y en a, moins
    // DuckDB lit de groupes de lignes pour trouver leurs parcelles
    await connection.run(`CREATE TABLE pac AS
      SELECT exploitation_id, list(DISTINCT pacage) AS pacages
      FROM p1
      WHERE exploitation_id IN (SELECT exploitation_id FROM v WHERE id NOT IN (SELECT id FROM p1))
      GROUP BY 1`)
    const counts = await connection.runAndReadAll(`SELECT
      (SELECT count(*) FROM v WHERE id NOT IN (SELECT id FROM p1))::INTEGER AS restantes,
      (SELECT count(*) FROM pac)::INTEGER AS exploitations`)
    const [{ restantes, exploitations }] = counts.getRowObjectsJson() as {
      restantes: number
      exploitations: number
    }[]
    if (restantes === 0) return

    // Parcelles des PACAGE de l'exploitation : la colonne pacage est lue dans tout le fichier
    const parPacage =
      exploitations === 0
        ? ''
        : `UNION SELECT p.pacage, p.id, p.code_culture, p.surface_geometrie, p.geom FROM ${source} p
           WHERE p.pacage IN (SELECT unnest(pacages) FROM pac)`
    await connection.run(`CREATE TABLE cand AS
      SELECT pacage, nouvel_id, code, surf_geo, geom FROM rpg ${parPacage}`)
    await connection.run(`INSERT INTO p2
      SELECT r.id, c.nouvel_id
      FROM v r LEFT JOIN pac p USING (exploitation_id) JOIN cand c
        ON c.code = r.culture_code AND abs(c.surf_geo - r.surface) <= 0.02 * r.surface + 0.01
       AND (list_contains(p.pacages, c.pacage)
            OR (r.pt IS NOT NULL AND ST_DWithin(c.geom, r.pt, 0.007)
                AND distance_m(r.pt, ST_Centroid(c.geom)) <= 500))
      WHERE r.id NOT IN (SELECT id FROM p1)
      QUALIFY count(*) OVER (PARTITION BY r.id) = 1`)
  }

  /**
   * Remplace `rpg_id` par l'identifiant stable et garde l'ancien dans `legacy_rpg_id`, en une
   * transaction. Une parcelle dont l'identifiant a changé pendant le calcul, ou dont le nouvel
   * identifiant est déjà pris la même année, est un conflit : rien n'est écrit.
   */
  async migrate(
    correspondances: RpgIdCorrespondance[],
    { apply }: { apply: boolean }
  ): Promise<RpgIdMigrationReport> {
    return db.transaction(async (trx) => {
      const report: RpgIdMigrationReport = {
        migrated: [],
        upToDate: [],
        missing: [],
        conflicts: [],
        applied: false,
      }
      const parcelleIds = correspondances.map(({ parcelleId }) => parcelleId)
      const newRpgIds = correspondances.map(({ rpgId }) => rpgId)

      const parcellesQuery = Parcelle.query({ client: trx }).whereIn('id', parcelleIds)
      const parcelles = await (apply ? parcellesQuery.forUpdate() : parcellesQuery)
      const parcelleById = new Map(parcelles.map((parcelle) => [parcelle.id, parcelle]))

      // Identifiants déjà portés par d'autres parcelles, par millésime
      const holders = await Parcelle.query({ client: trx })
        .whereIn('rpgId', newRpgIds)
        .select('id', 'year', 'rpgId')
      const holderByKey = new Map(
        holders.map((holder) => [`${holder.year}:${holder.rpgId}`, holder.id])
      )
      const claimedKeys = new Map<string, string>()

      for (const correspondance of correspondances) {
        const { parcelleId, legacyRpgId, rpgId } = correspondance
        const parcelle = parcelleById.get(parcelleId)

        if (!parcelle) {
          report.missing.push(parcelleId)
          continue
        }
        if (parcelle.rpgId === rpgId) {
          report.upToDate.push(parcelleId)
          continue
        }
        if (parcelle.rpgId !== legacyRpgId || parcelle.legacyRpgId !== null) {
          report.conflicts.push({
            parcelleId,
            reason: `identifiant modifié pendant le calcul (${legacyRpgId}, maintenant ${parcelle.rpgId})`,
          })
          continue
        }

        const key = `${parcelle.year}:${rpgId}`
        const holder = holderByKey.get(key) ?? claimedKeys.get(key)
        if (holder && holder !== parcelleId) {
          report.conflicts.push({
            parcelleId,
            reason: `nouvel identifiant ${rpgId} déjà pris en ${parcelle.year} par la parcelle ${holder}`,
          })
          continue
        }
        claimedKeys.set(key, parcelleId)
        report.migrated.push(correspondance)
      }

      if (apply && report.conflicts.length === 0) {
        for (const { parcelleId, legacyRpgId, rpgId } of report.migrated) {
          await Parcelle.query({ client: trx })
            .where('id', parcelleId)
            .update({ rpgId, legacyRpgId })
        }
        report.applied = true
      }

      return report
    })
  }
}
