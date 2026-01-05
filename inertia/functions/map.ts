import maplibre from 'maplibre-gl'

export function setParcellesHighlight(
  map: maplibre.Map | null,
  parcelleIds: string[],
  highlighted: boolean = true
) {
  requestAnimationFrame(() => {
    if (!map || !map?.getLayer('parcelles-fill') || !map?.getLayer('parcelles-outline')) {
      return
    }

    for (const id of parcelleIds) {
      map.setFeatureState(
        { source: 'parcelles', sourceLayer: 'parcelles', id: id },
        { highlighted }
      )
    }
  })
}

export function setParcellesUnavailability(
  map: maplibre.Map | null,
  parcelleIds: string[],
  unavailable: boolean = true
) {
  requestAnimationFrame(() => {
    if (!map || !map?.getLayer('parcelles-fill') || !map?.getLayer('parcelles-outline')) {
      return
    }

    for (const id of parcelleIds) {
      map.setFeatureState(
        { source: 'parcelles', sourceLayer: 'parcelles', id: id },
        { unavailable }
      )
    }
  })
}
