import type maplibre from 'maplibre-gl'
import { ParcelleJson } from '#types/models'

export function setParcellesHighlight(
  map: maplibre.Map | null,
  parcelleIds: string[],
  highlighted: boolean = true
) {
  if (!map) return

  const highlight = () => {
    if (
      !map.getSource('parcelles') ||
      !map.getLayer('parcelles-fill') ||
      !map.getLayer('parcelles-outline')
    ) {
      console.warn('Cannot highlight parcelles: map source/layers not ready.')
      return
    }
    for (const id of parcelleIds) {
      map.setFeatureState(
        { source: 'parcelles', sourceLayer: 'parcelles', id: id },
        { highlighted }
      )
    }
  }

  if (map.isStyleLoaded()) {
    highlight()
  } else {
    map.once('load', highlight)
  }
}

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

export function getCentroid(geometry: GeoJSON.Geometry): { x: number; y: number } | undefined {
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
  parcelles: ParcelleJson[] | undefined,
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
