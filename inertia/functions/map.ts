import maplibre from 'maplibre-gl'

const defaultOpacity = 0.5
const selectedOpacity = 1

export function setHighlightableOpacityParcelles(map: maplibre.Map | null, parcelleIds: string[]) {
  if (!map || !map.getLayer('parcelles-fill')) {
    return
  }

  map.setPaintProperty('parcelles-fill', 'fill-opacity', [
    'case',
    ['in', ['coalesce', ['get', 'id_parcel'], ['get', 'ID_PARCEL']], ['literal', parcelleIds]],
    selectedOpacity,
    defaultOpacity,
  ])
}

const defaultZoomedOutLineWidth = 0.1
const defaultZoomedInLineWidth = 1
const selectedZoomedOutLineWidth = 2
const selectedZoomedInLineWidth = 4

export function setHighlightableOutlineParcelles(map: maplibre.Map | null, parcelleIds: string[]) {
  if (!map || !map.getLayer('parcelles-outline')) {
    return
  }

  map.setPaintProperty('parcelles-outline', 'line-width', [
    'interpolate',
    ['linear'],
    ['zoom'],
    15,
    [
      'case',
      ['in', ['coalesce', ['get', 'id_parcel'], ['get', 'ID_PARCEL']], ['literal', parcelleIds]],
      selectedZoomedOutLineWidth,
      defaultZoomedOutLineWidth,
    ],
    18,
    [
      'case',
      ['in', ['coalesce', ['get', 'id_parcel'], ['get', 'ID_PARCEL']], ['literal', parcelleIds]],
      selectedZoomedInLineWidth,
      defaultZoomedInLineWidth,
    ],
  ])
}

export function highlightParcelles(map: maplibre.Map | null, parcelleIds: string[]) {
  requestAnimationFrame(() => {
    setHighlightableOpacityParcelles(map, parcelleIds)
    setHighlightableOutlineParcelles(map, parcelleIds)
  })
}
