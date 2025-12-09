import { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { fr } from '@codegouvfr/react-dsfr'
import Select from '@codegouvfr/react-dsfr/SelectNext'
import maplibre, { type LngLatLike } from 'maplibre-gl'
import { ExploitationJson } from '../../../types/models'
import Popup from '~/components/map/popup'

import 'maplibre-gl/dist/maplibre-gl.css'
import photo from '~/components/map/styles/photo.json'
import planIGN from '~/components/map/styles/plan-ign.json'
import vector from '~/components/map/styles/vector.json'

export type GeoPoint = {
  type: 'Point'
  coordinates: [number, number]
}

type StylesMap = {
  [key: string]: any
}

const stylesMap: StylesMap = {
  'plan-ign': planIGN,
  'orthophoto': photo,
  'vector': vector,
}

export default function VisualisationMap({
  exploitations,
  exploitation,
  setExploitation,
}: {
  exploitations: ExploitationJson[]
  exploitation?: ExploitationJson
  setExploitation?: (exploitation: ExploitationJson) => void
}) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<maplibre.Map | null>(null)
  const markerRef = useRef<maplibre.Marker | null>(null)
  const currentStyleRef = useRef<string>('plan-ign')
  const [style, setStyle] = useState<string>(currentStyleRef.current)
  const markerColor = fr.colors.decisions.artwork.major.blueFrance.default

  useEffect(() => {
    if (!mapContainerRef.current) {
      return
    }

    const map = new maplibre.Map({
      container: mapContainerRef.current,
      style: stylesMap[style],
      center: [2.24, 46.54],
      zoom: 5,
      maxZoom: 17.5,
      trackResize: true,
      attributionControl: { compact: true },
    })

    mapRef.current = map

    map.on('load', () => {
      exploitations.forEach((exploitation) => {
        if (exploitation.location) {
          const coords: [number, number] = [exploitation.location.x, exploitation.location.y]

          const popup = new maplibre.Popup({
            closeButton: false,
            closeOnClick: false,
            offset: 25,
            className: 'custom-exploitation-popup',
          })

          const marker = new maplibre.Marker({
            draggable: false,
            color: markerColor,
          })
            .setLngLat(coords as LngLatLike)
            .addTo(map)

          const markerElement = marker.getElement()
          markerElement.style.cursor = 'pointer'
          markerElement.addEventListener('mouseenter', () => {
            const popupNode = document.createElement('div')
            const root = createRoot(popupNode)
            root.render(<Popup exploitation={exploitation} />)
            popup
              .setLngLat(coords as LngLatLike)
              .setDOMContent(popupNode)
              .addTo(map)
          })

          markerElement.addEventListener('mouseleave', () => {
            popup.remove()
          })

          markerElement.addEventListener('click', () => {
            setExploitation?.(exploitation)
          })

          markerRef.current = marker
        }
      })
    })

    return () => {
      map.remove()
    }
  }, [exploitations])

  // Mise à jour du style de la carte
  useEffect(() => {
    const map = mapRef.current
    const marker = markerRef.current
    if (map && style !== currentStyleRef.current) {
      const center = map.getCenter()
      const zoom = map.getZoom()

      map.setStyle(stylesMap[style])

      map.once('styledata', () => {
        map.setCenter(center)
        map.setZoom(zoom)

        // Remettre le marker après le changement de style
        if (marker) {
          marker.addTo(map)
        }
      })

      currentStyleRef.current = style
    }
  }, [style])

  // Zoom sur l'exploitation sélectionnée
  useEffect(() => {
    const map = mapRef.current
    if (map && exploitation?.location) {
      const coords: [number, number] = [exploitation.location.x, exploitation.location.y]
      map.flyTo({
        center: coords as LngLatLike,
        zoom: 10,
        essential: true,
      })
    }
  }, [exploitation])

  return (
    <div className="flex flex-col h-full w-full relative border">
      <style>{`
        .custom-exploitation-popup .maplibregl-popup-content {
          background-color: ${fr.colors.decisions.background.default.grey.default};
          padding: 1rem;
          border-radius: 8px;
        }
        .custom-exploitation-popup .maplibregl-popup-tip {
          border-top-color: ${fr.colors.decisions.background.default.grey.default};
        }
      `}</style>
      <div ref={mapContainerRef} className="flex h-full w-full" />
      <Select
        label=""
        style={{ position: 'absolute' }}
        nativeSelectProps={{
          defaultValue: 'plan-ign',
          onChange: (e) => setStyle(e.target.value),
        }}
        options={[
          { value: 'plan-ign', label: 'Plan IGN' },
          { value: 'orthophoto', label: 'Photographie aérienne' },
          { value: 'vector', label: 'Carte vectorielle' },
        ]}
      />
    </div>
  )
}
