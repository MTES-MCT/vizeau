import type { Geometry } from 'geojson'
import type { Data } from '@generated/data'
import type { LngLatLike, Map as MaplibreMap } from 'maplibre-gl'

function getRingCentroid(ring: number[][]): { x: number; y: number; area: number } | undefined {
  if (ring.length < 3) return undefined

  let twiceArea = 0
  let centroidX = 0
  let centroidY = 0

  for (let i = 0; i < ring.length; i++) {
    const [x1, y1] = ring[i]
    const [x2, y2] = ring[(i + 1) % ring.length]
    const cross = x1 * y2 - x2 * y1
    twiceArea += cross
    centroidX += (x1 + x2) * cross
    centroidY += (y1 + y2) * cross
  }

  if (twiceArea === 0) {
    const first = ring[0]
    return first ? { x: first[0], y: first[1], area: 0 } : undefined
  }

  return {
    x: centroidX / (3 * twiceArea),
    y: centroidY / (3 * twiceArea),
    area: Math.abs(twiceArea / 2),
  }
}

export function getCentroid(geometry: Geometry): { x: number; y: number } | undefined {
  if (geometry.type === 'Polygon') {
    return getRingCentroid(geometry.coordinates[0])
  }

  if (geometry.type === 'MultiPolygon') {
    let weightedX = 0
    let weightedY = 0
    let totalArea = 0

    for (const polygon of geometry.coordinates) {
      const centroid = getRingCentroid(polygon[0])
      if (!centroid) continue

      if (centroid.area === 0) {
        return { x: centroid.x, y: centroid.y }
      }

      weightedX += centroid.x * centroid.area
      weightedY += centroid.y * centroid.area
      totalArea += centroid.area
    }

    if (totalArea > 0) {
      return {
        x: weightedX / totalArea,
        y: weightedY / totalArea,
      }
    }
  }

  return undefined
}

export function getRpgIdsFromParcellesForYear(
  parcelles: Data.Parcelle[] | undefined,
  year: string
): string[] {
  if (!parcelles || !parcelles.length) return []

  const rpgIds: string[] = []
  for (const parcelle of parcelles) {
    if (parcelle.rpgId && parcelle.year.toString() === year) {
      rpgIds.push(parcelle.rpgId)
    }
  }
  return rpgIds
}

/*
 * Déplace la caméra sans l'arc dézoom-rezoom de `flyTo` (utilisé aussi par défaut par
 * `fitBounds`) ni le long glissement de `easeTo`, qui charge les tuiles de tout le trajet : une
 * destination hors de la vue est rejointe d'un saut au zoom courant, puis la carte zoome dessus.
 * Une destination visible est rejointe en glissant. Sans `essential`, l'animation est sautée si
 * l'utilisateur limite les animations (`prefers-reduced-motion`).
 */
function moveCamera(map: MaplibreMap, center: LngLatLike, zoom: number, duration = 800) {
  if (!map.getBounds().contains(center)) map.jumpTo({ center })
  map.easeTo({ center, zoom, duration })
}

/** Centre la carte sur un point, en zoomant au moins jusqu'à `minZoom` mais sans dézoomer. */
export function zoomOnPoint(map: MaplibreMap, center: LngLatLike, minZoom: number) {
  moveCamera(map, center, Math.max(map.getZoom(), minZoom))
}

/** Cadre une emprise, sans descendre sous `minZoom` s'il est fourni. */
export function zoomOnBbox(
  map: MaplibreMap,
  bbox: [number, number, number, number],
  { padding, minZoom, duration }: { padding: number; minZoom?: number; duration?: number }
) {
  const camera = map.cameraForBounds(bbox, { padding })
  if (!camera?.center) return
  const zoom = camera.zoom ?? map.getZoom()
  moveCamera(map, camera.center, minZoom === undefined ? zoom : Math.max(zoom, minZoom), duration)
}
