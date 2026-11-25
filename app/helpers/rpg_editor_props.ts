import type { HttpContext } from '@adonisjs/core/http'
import app from '@adonisjs/core/services/app'
import env from '#start/env'
import { MAX_EMPRISE_DEGREES, RpgPacageService } from '#services/rpg_pacage_service'
import {
  rpgEmprisePacagesValidator,
  rpgExploitationPacagesValidator,
  rpgMillesimeValidator,
  rpgPacageValidator,
  rpgParcellePacageValidator,
} from '#validators/rpg_pacage'
import type { Bbox } from '#types/rpg'

/** Props du RPG de l'éditeur de parcelles, dans l'ordre de la documentation. */
export const RPG_EDITOR_PROPS = [
  'rpgZone',
  'rpgPacage',
  'rpgParcellePacage',
  'rpgEmprisePacages',
  'rpgExploitationPacages',
  'rpgZoneExploitations',
]

/**
 * Données du RPG pour l'éditeur de parcelles, à ajouter aux props de chaque page qui l'ouvre.
 * Toutes sont optionnelles : la page les demande par un rechargement partiel, avec leurs
 * paramètres (voir doc/front-end/parcelles-rpg.md).
 *
 * Une prop vaut `null` si ses paramètres manquent ou sont invalides, ou si elle lit les
 * Parquet du RPG alors qu'ils ne sont pas configurés (`rpgPacageSearch` faux). Le rechargement
 * partiel ne redirige donc jamais vers une erreur de validation.
 */
export function rpgEditorProps({
  request,
  auth,
  inertia,
}: Pick<HttpContext, 'request' | 'auth' | 'inertia'>) {
  const hasParquet = Boolean(env.get('RPG_PARQUET_URL'))
  const qs = () => request.qs()
  /** Recherche pour l'utilisateur connecté. */
  async function search<T>(task: (rpg: RpgPacageService, userId: string) => Promise<T>) {
    const rpg = await app.container.make(RpgPacageService)
    return task(rpg, auth.getUserOrFail().id)
  }

  return {
    rpgZone: inertia.optional(() => search((rpg, userId) => rpg.getZone(userId))),

    rpgPacage: inertia.optional(async () => {
      const [error, query] = await rpgPacageValidator.tryValidate(qs())
      if (error || !hasParquet) return null
      return search((rpg, userId) => rpg.searchByPacage(userId, query.millesime, query.pacage))
    }),

    rpgParcellePacage: inertia.optional(async () => {
      const [error, query] = await rpgParcellePacageValidator.tryValidate(qs())
      if (error || !hasParquet) return null
      const { millesime, rpgId, x, y } = query
      return search((rpg, userId) => rpg.searchByParcelle(userId, millesime, rpgId, { x, y }))
    }),

    rpgEmprisePacages: inertia.optional(async () => {
      const [error, query] = await rpgEmprisePacagesValidator.tryValidate(qs())
      if (error || !hasParquet) return null
      const emprise = parseEmprise(query.bbox)
      if (!emprise) return null
      return search((rpg, userId) => rpg.getEmprisePacages(userId, query.millesime, emprise))
    }),

    rpgExploitationPacages: inertia.optional(async () => {
      const [error, query] = await rpgExploitationPacagesValidator.tryValidate(qs())
      if (error || !hasParquet) return null
      const { millesime, exploitationId } = query
      return search((rpg, userId) => rpg.getExploitationPacages(userId, millesime, exploitationId))
    }),

    rpgZoneExploitations: inertia.optional(async () => {
      const [error, query] = await rpgMillesimeValidator.tryValidate(qs())
      if (error) return null
      return search((rpg, userId) => rpg.getZoneExploitations(userId, query.millesime))
    }),
  }
}

/**
 * Rechargement partiel qui ne demande que des props du RPG : l'éditeur cherche des parcelles,
 * l'utilisateur ne revisite pas la page. Les controllers n'enregistrent pas alors de visite.
 */
export function isRpgEditorReload(request: HttpContext['request']) {
  const only = request.header('x-inertia-partial-data')
  return Boolean(only) && only!.split(',').every((prop) => RPG_EDITOR_PROPS.includes(prop.trim()))
}

/** Emprise « ouest,sud,est,nord » valide, de côté MAX_EMPRISE_DEGREES au plus, sinon `null`. */
export function parseEmprise(value: string): Bbox | null {
  const [west, south, east, north] = value.split(',').map(Number)
  const isValid =
    west >= -180 &&
    east <= 180 &&
    south >= -90 &&
    north <= 90 &&
    west < east &&
    south < north &&
    east - west <= MAX_EMPRISE_DEGREES &&
    north - south <= MAX_EMPRISE_DEGREES
  return isValid ? [west, south, east, north] : null
}
