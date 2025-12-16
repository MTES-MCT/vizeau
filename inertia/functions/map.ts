import maplibre from 'maplibre-gl'

export function setParcellesOpacity(map: maplibre.Map | null, parcelleIds: string[]) {
  if (!map || !map.getLayer('parcelles-fill')) {
    return
  }

  map.setPaintProperty('parcelles-fill', 'fill-opacity', [
    'case',
    ['in', ['coalesce', ['get', 'id_parcel'], ['get', 'ID_PARCEL']], ['literal', parcelleIds]],
    1,
    0.5,
  ])
}

const defaultZoomedOutLineWidth = 0.5
const defaultZoomedInLineWidth = 1
const selectedZoomedOutLineWidth = 2
const selectedZoomedInLineWidth = 4

export function setParcellesOutline(map: maplibre.Map | null, parcelleIds: string[]) {
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
