import maplibre from 'maplibre-gl'

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

export function setParcellesUnavailability(
  map: maplibre.Map | null,
  parcelleIds: string[],
  unavailable: boolean = true
) {
  if (!map) return

  const setUnavailability = () => {
    if (
      !map.getSource('parcelles') ||
      !map.getLayer('parcelles-fill') ||
      !map.getLayer('parcelles-outline')
    ) {
      console.warn('Cannot set parcelles unavailable: map source/layers not ready.')
      return
    }
    for (const id of parcelleIds) {
      map.setFeatureState(
        { source: 'parcelles', sourceLayer: 'parcelles', id: id },
        { unavailable }
      )
    }
  }

  if (map.isStyleLoaded()) {
    setUnavailability()
  } else {
    map.once('load', setUnavailability)
  }
}

export function getCentroid(geometry: GeoJSON.Geometry): { x: number; y: number } | undefined {
  if (geometry.type === 'Polygon') {
    const coords = geometry.coordinates[0]
    const n = coords.length
    let x = 0
    let y = 0
    coords.forEach(([lng, lat]) => {
      x += lng
      y += lat
    })
    x /= n
    y /= n
    return { x, y }
  }
}
