import type { LayerSpecification } from 'maplibre-gl'
import { GROUPES_CULTURAUX } from '~/functions/cultures-group'

const defaultOpacity = 0.5
const selectedOpacity = 1
const unavailableOpacity = 0.2

const defaultZoomedOutLineWidth = 0.1
const defaultZoomedInLineWidth = 1
const selectedZoomedOutLineWidth = 2
const selectedZoomedInLineWidth = 4

export const getParcellesLayers = (): LayerSpecification[] => {
  const colorMatch: any[] = ['match', ['coalesce', ['get', 'code_group'], ['get', 'CODE_GROUP']]]

  Object.entries(GROUPES_CULTURAUX).forEach(([code, info]) => {
    colorMatch.push(code.toString())
    colorMatch.push(info.color)
  })

  colorMatch.push('#FF0000')

  return [
    {
      'id': 'parcelles-fill',
      'type': 'fill',
      'source': 'parcelles',
      'source-layer': 'parcelles',
      'minzoom': 12,
      'paint': {
        'fill-color': colorMatch as any,
        'fill-opacity': [
          'case',
          ['boolean', ['feature-state', 'unavailable'], false],
          unavailableOpacity,
          ['boolean', ['feature-state', 'highlighted'], false],
          selectedOpacity,
          defaultOpacity,
        ],
      },
    },
    {
      'id': 'parcelles-outline',
      'type': 'line',
      'source': 'parcelles',
      'source-layer': 'parcelles',
      'minzoom': 12,
      'paint': {
        'line-color': '#000000',
        'line-width': [
          'interpolate',
          ['linear'],
          ['zoom'],
          15,
          [
            'case',
            ['boolean', ['feature-state', 'highlighted'], false],
            selectedZoomedOutLineWidth,
            defaultZoomedOutLineWidth,
          ],
          18,
          [
            'case',
            ['boolean', ['feature-state', 'highlighted'], false],
            selectedZoomedInLineWidth,
            defaultZoomedInLineWidth,
          ],
        ],
        'line-opacity': 0.8,
      },
    },
    {
      'id': 'parcellesbio-fill',
      'type': 'fill',
      'source': 'parcelles',
      'source-layer': 'parcellesbio',
      'minzoom': 12,
      'paint': {
        'fill-color': colorMatch as any,
        'fill-opacity': 0, // Transparent par défaut pour la détection uniquement
      },
    },
    {
      'id': 'parcellesbio-outline',
      'type': 'line',
      'source': 'parcelles',
      'source-layer': 'parcellesbio',
      'minzoom': 12,
      'paint': {
        'line-color': '#000000',
        'line-width': [
          'interpolate',
          ['linear'],
          ['zoom'],
          15,
          1,
          18,
          3,
        ],
        'line-opacity': 0, // Transparent par défaut
      },
    },
  ]
}

const millesimeToIdKey: { [key: string]: string } = {
  '2023': 'ID_PARCEL',
  '2024': 'id_parcel',
}

export const getParcellesSource = ({
  pmtilesUrl,
  millesime,
}: {
  pmtilesUrl: string
  millesime: string
}): maplibregl.VectorSourceSpecification => {
  return {
    type: 'vector',
    url: `pmtiles://${pmtilesUrl}/${millesime}/parcelles_france.pmtiles`,
    promoteId: millesimeToIdKey[millesime] || 'id_parcel',
  }
}
