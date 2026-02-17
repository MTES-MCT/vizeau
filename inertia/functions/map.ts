import maplibre from 'maplibre-gl'

export function setParcellesHighlight(
  map: maplibre.Map | null,
  parcelleIds: string[],
  highlighted: boolean = true
) {
  const tryHighlight = (retries = 0) => {
    requestAnimationFrame(() => {
      if (
        !map ||
        !map.isStyleLoaded() ||
        !map.getSource('parcelles') ||
        !map.getLayer('parcelles-fill') ||
        !map.getLayer('parcelles-outline')
      ) {
        if (retries < 50) {
          // Retry up to 50 times (about 1 second)
          setTimeout(() => tryHighlight(retries + 1), 20)
        } else {
          console.warn('Cannot highlight parcelles: map not ready after retries.')
        }
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

  tryHighlight()
}

export function setParcellesUnavailability(
  map: maplibre.Map | null,
  parcelleIds: string[],
  unavailable: boolean = true
) {
  const trySetUnavailability = (retries = 0) => {
    requestAnimationFrame(() => {
      if (
        !map ||
        !map.isStyleLoaded() ||
        !map.getSource('parcelles') ||
        !map.getLayer('parcelles-fill') ||
        !map.getLayer('parcelles-outline')
      ) {
        if (retries < 50) {
          // Retry up to 50 times (about 1 second)
          setTimeout(() => trySetUnavailability(retries + 1), 20)
        } else {
          console.warn('Cannot set parcelles unavailable: map not ready after retries.')
        }
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

  trySetUnavailability()
}
