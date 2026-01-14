export const getCommunesLayer = () => {
  return [
    {
      id: 'communes-outline',
      type: 'line',
      source: 'decoupage-administratif',
      'source-layer': 'communes',
      minzoom: 10,
      layout: {
        visibility: 'none',
      },
      paint: {
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
      id: 'aac-fill',
      type: 'fill',
      source: 'aac',
      'source-layer': 'aac',
      minzoom: 12,
      paint: {
        'fill-color': '#a6f2fa',
        'fill-opacity': 0.3,
      },
    },
    {
      id: 'aac-outline',
      type: 'line',
      source: 'aac',
      'source-layer': 'aac',
      minzoom: 10,
      paint: {
        'line-color': '#009099',
        'line-width': 2,
        'line-opacity': 1,
      },
    },
  ]
}

export const getPpeLayer = () => {
  return [
    {
      id: 'ppe-fill',
      type: 'fill',
      source: 'ppe',
      'source-layer': 'ppe',
      minzoom: 12,
      layout: {
        visibility: 'none',
      },
      paint: {
        'fill-color': 'blue',
        'fill-opacity': 0.3,
      },
    },
    {
      id: 'ppe-outline',
      type: 'line',
      source: 'ppe',
      'source-layer': 'ppe',
      minzoom: 10,
      layout: {
        visibility: 'none',
      },
      paint: {
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
      id: 'ppr-fill',
      type: 'fill',
      source: 'ppr',
      'source-layer': 'ppr',
      minzoom: 12,
      layout: {
        visibility: 'none',
      },
      paint: {
        'fill-color': 'orange',
        'fill-opacity': 0.3,
      },
    },
    {      id: 'ppr-outline',
      type: 'line',
      source: 'ppr',
      'source-layer': 'ppr',
      minzoom: 10,
      layout: {
        visibility: 'none',
      },
      paint: {
        'line-color': 'darkorange',
        'line-width': 2,
        'line-opacity': 1,
      },
    },
  ]
}

export const getCommunesSource = ({ pmtilesUrl }: { pmtilesUrl: string }): maplibregl.VectorSourceSpecification => {
  return {
    type: 'vector',
    url: `pmtiles://${pmtilesUrl}/communes.pmtiles`,
  }
}

export const getAacSource = ({ pmtilesUrl }: { pmtilesUrl: string }): maplibregl.VectorSourceSpecification => {
  return {
    type: 'vector',
    url: `pmtiles://${pmtilesUrl}/zonage.pmtiles`,
  }
}

export const getPpeSource = ({ pmtilesUrl }: { pmtilesUrl: string }): maplibregl.VectorSourceSpecification => {
  return {
    type: 'vector',
    url: `pmtiles://${pmtilesUrl}/zonage.pmtiles`,
  }
}

export const getPprSource = ({ pmtilesUrl }: { pmtilesUrl: string }): maplibregl.VectorSourceSpecification => {
  return {
    type: 'vector',
    url: `pmtiles://${pmtilesUrl}/zonage.pmtiles`,
  }
}
