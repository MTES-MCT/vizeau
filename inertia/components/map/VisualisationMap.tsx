import { useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { fr } from '@codegouvfr/react-dsfr'
import Select from '@codegouvfr/react-dsfr/SelectNext'
import maplibre, { type LngLatLike } from 'maplibre-gl'
import { Protocol } from 'pmtiles'
import { ExploitationJson } from '../../../types/models'
import Popup from '~/components/map/popup'
import { getParcellesLayers, getParcellesSource } from './styles/parcelles'

import { getCulturesGroup } from '~/functions/cultures-group'

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

const protocol = new Protocol()
maplibre.addProtocol('pmtiles', protocol.tile)

export default function VisualisationMap({
  exploitations,
  exploitation,
  setExploitation,
  pmtilesUrl,
}: {
  exploitations: ExploitationJson[]
  exploitation?: ExploitationJson
  setExploitation?: (exploitation: ExploitationJson) => void
  pmtilesUrl: string
}) {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<maplibre.Map | null>(null)
  const markerRef = useRef<maplibre.Marker | null>(null)
  const selectedParcelRef = useRef<string | null>(null)
  const parcelPopupRef = useRef<maplibre.Popup | null>(null)
  const currentStyleRef = useRef<string>('plan-ign')
  const [style, setStyle] = useState<string>(currentStyleRef.current)
  const [millesime, setMillesime] = useState<string>('2024')
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

    const handleParcelClick = (e: maplibre.MapLayerMouseEvent) => {
      const feature = e.features?.[0]
      const props = feature?.properties

      // Le millésime 2024 utilise des minuscules, celui de 2023 des majuscules
      const idParcel = props?.id_parcel ?? props?.ID_PARCEL
      const codeGroup = props?.code_group ?? props?.CODE_GROUP
      const surfParc = props?.surf_parc ?? props?.SURF_PARC

      if (idParcel) {
        selectedParcelRef.current = idParcel

        requestAnimationFrame(() => {
          map.setPaintProperty('parcelles-fill', 'fill-opacity', [
            'case',
            ['==', ['coalesce', ['get', 'id_parcel'], ['get', 'ID_PARCEL']], idParcel],
            1,
            0.5,
          ])

          map.setPaintProperty('parcelles-outline', 'line-width', [
            'interpolate',
            ['linear'],
            ['zoom'],
            15,
            [
              'case',
              ['==', ['coalesce', ['get', 'id_parcel'], ['get', 'ID_PARCEL']], idParcel],
              2,
              0.5,
            ],
            18,
            [
              'case',
              ['==', ['coalesce', ['get', 'id_parcel'], ['get', 'ID_PARCEL']], idParcel],
              4,
              1,
            ],
          ])
        })
      }

      const popupContent = `
          <div style="padding: 10px">
            <strong>Culture :</strong> ${getCulturesGroup(codeGroup).label}<br>
            <strong>Surface :</strong> ${surfParc}<br>
          </div>
      `

      if (parcelPopupRef.current) {
        parcelPopupRef.current.remove()
      }

      const popup = new maplibre.Popup().setLngLat(e.lngLat).setHTML(popupContent).addTo(map)
      parcelPopupRef.current = popup
    }

    map.on('load', () => {
      if (!map.getSource('parcelles')) {
        map.addSource('parcelles', getParcellesSource({ pmtilesUrl, millesime }))
      }

      const parceLayers = getParcellesLayers()
      parceLayers.forEach((layer) => {
        if (!map.getLayer(layer.id)) {
          map.addLayer(layer)
        }
      })

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

      map.on('click', 'parcelles-fill', handleParcelClick)
    })

    return () => {
      map.off('click', 'parcelles-fill', handleParcelClick)
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

        // Rajouter les couches parcelles après le chargement de style
        if (!map.getSource('parcelles')) {
          map.addSource('parcelles', getParcellesSource({ pmtilesUrl, millesime }))
        }

        const parcelLayers = getParcellesLayers()
        parcelLayers.forEach((layer) => {
          if (!map.getLayer(layer.id)) {
            map.addLayer(layer)
          }
        })

        // Restaurer la sélection de parcelle si elle existe
        if (selectedParcelRef.current) {
          map.setPaintProperty('parcelles-fill', 'fill-opacity', [
            'case',
            ['==', ['get', 'id_parcel'], selectedParcelRef.current],
            1,
            0.5,
          ])

          map.setPaintProperty('parcelles-outline', 'line-width', [
            'interpolate',
            ['linear'],
            ['zoom'],
            15,
            ['case', ['==', ['get', 'id_parcel'], selectedParcelRef.current], 2, 0.5],
            18,
            ['case', ['==', ['get', 'id_parcel'], selectedParcelRef.current], 4, 1],
          ])
        }
      })

      currentStyleRef.current = style
    }
  }, [style])

  // Mise à jour du millésime des parcelles
  useEffect(() => {
    const map = mapRef.current

    if (map && map.getSource('parcelles')) {
      selectedParcelRef.current = null

      if (parcelPopupRef.current) {
        parcelPopupRef.current.remove()
        parcelPopupRef.current = null
      }

      if (map.getLayer('parcelles-fill')) {
        map.removeLayer('parcelles-fill')
      }

      if (map.getLayer('parcelles-outline')) {
        map.removeLayer('parcelles-outline')
      }

      map.removeSource('parcelles')
      map.addSource('parcelles', getParcellesSource({ pmtilesUrl, millesime }))

      const parcelLayers = getParcellesLayers()
      parcelLayers.forEach((layer) => {
        map.addLayer(layer)
      })
    }
  }, [millesime])

  // Zoom sur l'exploitation sélectionnée
  useEffect(() => {
    const map = mapRef.current
    if (map && exploitation?.location) {
      const coords: [number, number] = [exploitation.location.x, exploitation.location.y]
      map.flyTo({
        center: coords as LngLatLike,
        zoom: 12,
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
      <Select
        label=""
        style={{ position: 'absolute', right: 0 }}
        nativeSelectProps={{
          defaultValue: '2024',
          onChange: (e) => setMillesime(e.target.value),
        }}
        options={[
          { value: '2024', label: '2024' },
          { value: '2023', label: '2023' },
        ]}
      />
    </div>
  )
}
