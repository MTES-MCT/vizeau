import { useEffect, useState } from 'react'
import { addProtocol } from 'maplibre-gl'
import type { LngLatBoundsLike, StyleSpecification } from 'maplibre-gl'
import { Protocol } from 'pmtiles'

import 'maplibre-gl/dist/maplibre-gl.css'
import vector from '~/components/map/styles/vector.json'
import { getAacLocationLayers, getAacSource } from '~/components/map/styles/zonage'
import { useMap } from '~/hooks/use_map'
import Loader from '~/ui/Loader'
import { MapErrorBoundary } from './map-error-boundary'

const protocol = new Protocol()
addProtocol('pmtiles', protocol.tile)

// Le JSON importé est typé plus largement que ce qu'attend MapLibre (tuples de coordonnées).
const VECTOR_STYLE = vector as unknown as StyleSpecification

/** Marge autour de l'AAC, en pixels, pour que son contour ne touche pas les bords. */
const FIT_PADDING = 16

export type AacLocationMapProps = {
  aacCode: string
  bbox: [number, number, number, number]
  pmtilesUrl: string
  /** Hauteur de la carte, en pixels. */
  height?: number
}

function toBounds(bbox: [number, number, number, number]): LngLatBoundsLike {
  return [
    [bbox[0], bbox[1]],
    [bbox[2], bbox[3]],
  ]
}

function AacLocationMapContent({ aacCode, bbox, pmtilesUrl, height = 220 }: AacLocationMapProps) {
  const [isLoading, setIsLoading] = useState(true)

  const { mapContainerRef, map } = useMap({
    style: VECTOR_STYLE,
    bounds: toBounds(bbox),
    fitBoundsOptions: { padding: FIT_PADDING },
    // Carte de repérage seule : la manipulation se fait sur la page de visualisation.
    interactive: false,
    // Pas de crédits sur la carte, comme sur celle de localisation d'une exploitation.
    attributionControl: false,
    // Le canvas MapLibre est annoncé "Map" par défaut.
    locale: { 'Map.Title': 'Carte de localisation de l’AAC' },
  })

  // Inertia réutilise la page d'une AAC à l'autre : les couches suivent le code affiché.
  useEffect(() => {
    if (!map) {
      return
    }

    const drawAac = () => {
      if (!map.getSource('aac')) {
        map.addSource('aac', getAacSource({ pmtilesUrl }))
      }

      for (const layer of getAacLocationLayers(aacCode)) {
        if (map.getLayer(layer.id)) {
          map.removeLayer(layer.id)
        }
        map.addLayer(layer)
      }

      setIsLoading(false)
    }

    if (map.loaded()) {
      drawAac()
      return
    }

    map.once('load', drawAac)

    return () => {
      map.off('load', drawAac)
    }
  }, [map, aacCode, pmtilesUrl])

  // Le cadrage initial vient des options de création ; cet effet ne sert qu'aux changements de props.
  useEffect(() => {
    map?.fitBounds(toBounds(bbox), { padding: FIT_PADDING, animate: false })
  }, [map, bbox])

  return (
    <div className="relative w-full" style={{ height }}>
      {isLoading && (
        <div
          className="flex h-full w-full z-10 absolute items-center justify-center"
          style={{ background: 'rgba(255,255,255,0.8)' }}
        >
          <Loader size="sm" />
        </div>
      )}
      <div ref={mapContainerRef} className="h-full w-full" />
    </div>
  )
}

export default function AacLocationMap(props: AacLocationMapProps) {
  return (
    <MapErrorBoundary>
      <AacLocationMapContent {...props} />
    </MapErrorBoundary>
  )
}
