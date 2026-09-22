import { AddLayerObject, FilterSpecification, VectorSourceSpecification } from 'maplibre-gl'

const AAC_FILL_COLOR = '#a6f2fa'
const AAC_LINE_COLOR = '#009099'

export const getCommunesLayer = () => {
  return [
    {
      'id': 'communes-outline',
      'type': 'line',
      'source': 'decoupage-administratif',
      'source-layer': 'communes',
      'minzoom': 10,
      'layout': {
        visibility: 'none',
      },
      'paint': {
        'line-color': 'gray',
        'line-width': 2,
        'line-opacity': 0.8,
      },
    },
  ]
}

export const getAacLayer = () => {
  return [
    {
      'id': 'aac-fill',
      'type': 'fill',
      'source': 'aac',
      'source-layer': 'aac',
      'minzoom': 12,
      'paint': {
        'fill-color': AAC_FILL_COLOR,
        'fill-opacity': 0.3,
      },
    },
    {
      'id': 'aac-outline',
      'type': 'line',
      'source': 'aac',
      'source-layer': 'aac',
      'minzoom': 8,
      'paint': {
        'line-color': AAC_LINE_COLOR,
        'line-width': 2,
        'line-opacity': 1,
      },
    },
  ]
}

/**
 * Contour d'une seule AAC, pour la carte de repérage de sa fiche : les AAC voisines sont
 * écartées par le filtre, et les couches restent visibles à tous les niveaux de zoom.
 */
export const getAacLocationLayers = (aacCode: string): AddLayerObject[] => {
  const filter: FilterSpecification = ['==', ['get', 'CdAAC'], aacCode]

  return [
    {
      'id': 'aac-location-fill',
      'type': 'fill',
      'source': 'aac',
      'source-layer': 'aac',
      'filter': filter,
      'paint': {
        'fill-color': AAC_FILL_COLOR,
        'fill-opacity': 0.3,
      },
    },
    {
      'id': 'aac-location-outline',
      'type': 'line',
      'source': 'aac',
      'source-layer': 'aac',
      'filter': filter,
      'paint': {
        'line-color': AAC_LINE_COLOR,
        'line-width': 2,
      },
    },
  ]
}

export const getPpeLayer = () => {
  return [
    {
      'id': 'ppe-fill',
      'type': 'fill',
      'source': 'ppe',
      'source-layer': 'ppe',
      'minzoom': 12,
      'layout': {
        visibility: 'none',
      },
      'paint': {
        'fill-color': 'blue',
        'fill-opacity': 0.3,
      },
    },
    {
      'id': 'ppe-outline',
      'type': 'line',
      'source': 'ppe',
      'source-layer': 'ppe',
      'minzoom': 8,
      'layout': {
        visibility: 'none',
      },
      'paint': {
        'line-color': 'darkblue',
        'line-width': 2,
        'line-opacity': 1,
      },
    },
  ]
}

export const getPprLayer = () => {
  return [
    {
      'id': 'ppr-fill',
      'type': 'fill',
      'source': 'ppr',
      'source-layer': 'ppr',
      'minzoom': 12,
      'layout': {
        visibility: 'none',
      },
      'paint': {
        'fill-color': 'orange',
        'fill-opacity': 0.3,
      },
    },
    {
      'id': 'ppr-outline',
      'type': 'line',
      'source': 'ppr',
      'source-layer': 'ppr',
      'minzoom': 8,
      'layout': {
        visibility: 'none',
      },
      'paint': {
        'line-color': 'darkorange',
        'line-width': 2,
        'line-opacity': 1,
      },
    },
  ]
}

export const getSageLayer = () => {
  return [
    {
      'id': 'sage-fill',
      'type': 'fill',
      'source': 'sage',
      'source-layer': 'sage',
      'minzoom': 12,
      'layout': {
        visibility: 'none',
      },
      'paint': {
        'fill-color': '#4caf50',
        'fill-opacity': 0.2,
      },
    },
    {
      'id': 'sage-outline',
      'type': 'line',
      'source': 'sage',
      'source-layer': 'sage',
      'minzoom': 8,
      'layout': {
        visibility: 'none',
      },
      'paint': {
        'line-color': '#2e7d32',
        'line-width': 2,
        'line-opacity': 1,
      },
    },
  ]
}

export const getAacSource = ({ pmtilesUrl }: { pmtilesUrl: string }): VectorSourceSpecification => {
  return {
    type: 'vector',
    url: `pmtiles://${pmtilesUrl}/zonage.pmtiles`,
  }
}

export const getPpeSource = ({ pmtilesUrl }: { pmtilesUrl: string }): VectorSourceSpecification => {
  return {
    type: 'vector',
    url: `pmtiles://${pmtilesUrl}/zonage.pmtiles`,
  }
}

export const getPprSource = ({ pmtilesUrl }: { pmtilesUrl: string }): VectorSourceSpecification => {
  return {
    type: 'vector',
    url: `pmtiles://${pmtilesUrl}/zonage.pmtiles`,
  }
}

export const getSageSource = ({
  pmtilesUrl,
}: {
  pmtilesUrl: string
}): VectorSourceSpecification => {
  return {
    type: 'vector',
    url: `pmtiles://${pmtilesUrl}/zonage.pmtiles`,
  }
}
