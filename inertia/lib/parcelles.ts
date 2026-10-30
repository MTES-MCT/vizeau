/**
 * Helpers pour l'étape d'association de parcelles.
 * La recherche PACAGE reste FACTICE (pas de back), mais la recherche par n° RPG
 * interroge le WFS RPG de la Géoplateforme IGN (parcelles graphiques par millésime).
 */
import { getCentroid } from '~/functions/map'

export type FetchedParcelle = {
  rpgId: string | null
  section: string | null
  numero: string | null
  surface: number | null
  cultureCode: string | null
  isBio: boolean | null
  centroid: { x: number; y: number } | undefined
  year: number
}

export type PacageSearchResult =
  | { ok: true; parcelles: FetchedParcelle[] }
  | { ok: false; reason: 'invalid' | 'empty' | 'network' }

export type CadastreSearchResult =
  { ok: true; parcelle: FetchedParcelle } | { ok: false; reason: 'not-found' | 'network' }

/**
 * FACTICE — Recherche des parcelles d'un n° PACAGE dans le RPG.
 * Retourne une parcelle fixe en attendant l'implémentation du back PACAGE.
 */
export async function searchParcellesByPacage(
  pacage: string,
  options?: { millesime?: number }
): Promise<PacageSearchResult> {
  if (!/^\d{9}$/.test(pacage)) {
    return { ok: false, reason: 'invalid' }
  }

  const year = options?.millesime ?? 2024
  const parcelles: FetchedParcelle[] = [
    {
      rpgId: '7320925',
      section: null,
      numero: null,
      surface: 11.42,
      cultureCode: 'ORP',
      isBio: true,
      centroid: { x: 2.5417542227598524, y: 48.21043204946747 },
      year,
    },
    {
      rpgId: '5317167',
      section: null,
      numero: null,
      surface: 8.3,
      cultureCode: 'BTH',
      isBio: false,
      centroid: { x: 2.550479926626171, y: 48.19914219139775 },
      year,
    },
    {
      rpgId: '11386355',
      section: null,
      numero: null,
      surface: 15.81,
      cultureCode: 'TRN',
      isBio: true,
      centroid: { x: 2.591685887367204, y: 48.19919635411275 },
      year,
    },
  ]
  return { ok: true, parcelles }
}

/** WFS RPG de la Géoplateforme IGN — parcelles graphiques, une couche par millésime. */
const RPG_WFS_URL = 'https://data.geopf.fr/wfs/ows'

/**
 * Marge (en degrés) ajoutée autour de l'emprise du territoire pour ne pas manquer
 * une parcelle qui déborderait légèrement de l'AAC.
 */
const BBOX_MARGIN_DEG = 0.05

/**
 * Recherche une parcelle RPG par son `id_parcel` (rpgId) pour un millésime donné.
 * Source réelle : WFS RPG.{millesime}:parcelles_graphiques de la Géoplateforme.
 *
 * `bbox` (emprise du territoire/AAC de l'utilisateur, `[minLng, minLat, maxLng, maxLat]`)
 * est ajoutée au filtre CQL : sans elle le WFS scanne toute la France (~20 s), avec elle
 * l'index spatial ramène la recherche à ~0,2 s.
 */
export async function searchParcelleByRpgId(
  rpgId: string,
  millesime: number,
  bbox?: [number, number, number, number]
): Promise<CadastreSearchResult> {
  // rpgId provient d'un champ filtré sur les chiffres ; on rejette tout le reste
  // pour éviter toute injection dans le filtre CQL.
  if (!/^[0-9]+$/.test(rpgId)) {
    return { ok: false, reason: 'not-found' }
  }

  let cqlFilter = `id_parcel='${rpgId}'`
  if (bbox) {
    const [minLng, minLat, maxLng, maxLat] = bbox
    // Axe CQL BBOX pour cette couche EPSG:4326 = lat, lon (minLat, minLon, maxLat, maxLon).
    const m = BBOX_MARGIN_DEG
    cqlFilter += ` AND BBOX(geom,${minLat - m},${minLng - m},${maxLat + m},${maxLng + m})`
  }

  const params = new URLSearchParams({
    SERVICE: 'WFS',
    VERSION: '2.0.0',
    REQUEST: 'GetFeature',
    TYPENAMES: `RPG.${millesime}:parcelles_graphiques`,
    CQL_FILTER: cqlFilter,
    OUTPUTFORMAT: 'application/json',
    COUNT: '1',
    SRSNAME: 'EPSG:4326',
  })

  let data: {
    features?: Array<{
      geometry?: GeoJSON.Geometry
      properties?: { id_parcel?: string; surf_parc?: number; code_cultu?: string }
    }>
  }
  try {
    const response = await fetch(`${RPG_WFS_URL}?${params.toString()}`)
    if (!response.ok) return { ok: false, reason: 'network' }
    data = await response.json()
  } catch {
    return { ok: false, reason: 'network' }
  }

  const feature = data.features?.[0]
  if (!feature) return { ok: false, reason: 'not-found' }

  const props = feature.properties ?? {}
  return {
    ok: true,
    parcelle: {
      rpgId: props.id_parcel !== undefined ? String(props.id_parcel) : rpgId,
      section: null,
      numero: null,
      surface: props.surf_parc !== undefined ? Number(props.surf_parc) : null,
      cultureCode: props.code_cultu ?? null,
      isBio: null,
      centroid: feature.geometry ? getCentroid(feature.geometry) : undefined,
      year: millesime,
    },
  }
}
