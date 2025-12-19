import type { LayerSpecification } from 'maplibre-gl'
import { GROUPES_CULTURAUX } from '~/functions/cultures-group'

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
        'fill-opacity': 0.5,
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
        'line-width': ['interpolate', ['linear'], ['zoom'], 15, 0.5, 18, 1] as any,
        'line-opacity': 0.8,
      },
    },
  ]
}

export const getParcellesSource = ({
  pmtilesUrl,
  millesime
}: {
  pmtilesUrl: string
  millesime: string
}): maplibregl.VectorSourceSpecification => {
  return {
    type: 'vector',
    url: `pmtiles://${pmtilesUrl}/${millesime}/parcelles_france.pmtiles`,
  }
}
