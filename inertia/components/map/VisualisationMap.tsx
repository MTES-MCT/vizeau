import { useCallback, useEffect, useRef, useState } from 'react'
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
import { router, usePage } from '@inertiajs/react'
import { InferPageProps } from '@adonisjs/inertia/types'
import VisualisationController from '#controllers/visualisation_controller'
import { highlightParcelles } from '~/functions/map'

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
  selectedExploitation,
  onParcelleClick,
  onParcelleMouseEnter,
  onParcelleMouseLeave,
  onMarkerClick,
  onMarkerMouseEnter,
  onMarkerMouseLeave,
  highlightedParcelleIds = [],
  unavailableParcelleIds = [],
  millesime,
}: {
  exploitations: ExploitationJson[]
  selectedExploitation?: ExploitationJson
  onParcelleClick?: (parcelleProperties: { [name: string]: any }) => void
  onParcelleMouseEnter?: (parcelleProperties: { [name: string]: any }) => void
  onParcelleMouseLeave?: () => void
  onMarkerClick?: (exploitation: ExploitationJson) => void
  onMarkerMouseEnter?: (exploitation: ExploitationJson) => void
  onMarkerMouseLeave?: () => void
  highlightedParcelleIds?: string[]
  unavailableParcelleIds?: string[]
  millesime: string
}) {
  const { pmtilesUrl } = usePage<InferPageProps<VisualisationController, 'index'>>().props
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<maplibre.Map | null>(null)
  const markersRef = useRef<maplibre.Marker[]>([])
  // The popup is created once and will be hidden/shown on demand, with its contents updated.
  const parcellePopupRef = useRef<maplibre.Popup>(new maplibre.Popup({ closeButton: false }))
  const currentStyleRef = useRef<string>('vector')
  const [style, setStyle] = useState<string>(currentStyleRef.current)
  const markerColor = fr.colors.decisions.artwork.major.blueFrance.default

  const handleParcelleMouseMove = useCallback((e: maplibre.MapLayerMouseEvent) => {
    if (!mapRef.current) {
      return
    }

    const feature = e.features?.[0]
    const props = feature?.properties

    // Le millésime 2024 utilise des minuscules, celui de 2023 des majuscules
    const codeGroup = props?.code_group ?? props?.CODE_GROUP
    const surfParc = props?.surf_parc ?? props?.SURF_PARC

    const popupContent = `
          <div style="padding: 0.3em 0.5em">
            <strong>Culture :</strong> ${getCulturesGroup(codeGroup).label}<br>
            <strong>Surface :</strong> ${surfParc}<br>
          </div>
      `

    parcellePopupRef.current.setLngLat(e.lngLat).setHTML(popupContent).addTo(mapRef.current)
  }, [])

  const handleParcelleMouseEnter = useCallback(
    (e: maplibre.MapLayerMouseEvent) => {
      const feature = e.features?.[0]
      const props = feature?.properties

      onParcelleMouseEnter?.(props || {})
    },
    [onParcelleMouseEnter]
  )

  const handleParcelleMouseLeave = useCallback(() => {
    parcellePopupRef.current.remove()

    onParcelleMouseLeave?.()
  }, [onParcelleMouseLeave])

  const handleParcelleClick = useCallback(
    (e: maplibre.MapLayerMouseEvent) => {
      if (!mapRef.current || !onParcelleClick) {
        return
      }

      const feature = e.features?.[0]
      const id = feature?.properties?.['id_parcel'] || feature?.properties?.['ID_PARCEL']

      if (feature?.properties && !unavailableParcelleIds.includes(id)) {
        onParcelleClick(feature.properties)
      }
    },
    [onParcelleClick, unavailableParcelleIds]
  )

  // Map initialization
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
      dragRotate: false,
      pitchWithRotate: false,
      touchZoomRotate: false,
    })

    map.on('load', () => {
      if (!map.getSource('parcelles')) {
        map.addSource('parcelles', getParcellesSource({ pmtilesUrl, millesime }))
      }

      const parcellesLayers = getParcellesLayers()
      parcellesLayers.forEach((layer) => {
        if (!map.getLayer(layer.id)) {
          const beforeId = map.getLayer('water-name-lakeline') ? 'water-name-lakeline' : undefined

          map.addLayer(layer, beforeId)
        }
      })
    })

    mapRef.current = map

    return () => {
      map.remove()
    }
  }, [])

  // Exploitations markers init
  useEffect(() => {
    if (!mapRef.current) {
      return
    }

    for (const exploitation of exploitations) {
      if (exploitation.location) {
        const coords: LngLatLike = [exploitation.location.x, exploitation.location.y]

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
          .setLngLat(coords)
          .addTo(mapRef.current)

        const markerElement = marker.getElement()
        markerElement.style.cursor = 'pointer'
        markerElement.addEventListener('mouseenter', () => {
          if (!mapRef.current) {
            return
          }

          const popupNode = document.createElement('div')
          const root = createRoot(popupNode)
          root.render(<Popup exploitation={exploitation} />)
          popup
            .setLngLat(coords as LngLatLike)
            .setDOMContent(popupNode)
            .addTo(mapRef.current)

          onMarkerMouseEnter?.(exploitation)
        })

        markerElement.addEventListener('mouseleave', () => {
          popup.remove()
          onMarkerMouseLeave?.()
        })

        markerElement.addEventListener('click', () => {
          onMarkerClick?.(exploitation)
        })

        markersRef.current.push(marker)
      }
    }

    // Marker cleanup
    return () => {
      for (const marker of markersRef.current) {
        marker.remove()
      }
    }
  }, [exploitations])

  // Map event update handler. Used to update event handlers when props change, so that the listeners always has the latest props values.
  useEffect(() => {
    mapRef.current?.on('click', 'parcelles-fill', handleParcelleClick)
    mapRef.current?.on('mouseenter', 'parcelles-fill', handleParcelleMouseEnter)
    mapRef.current?.on('mousemove', 'parcelles-fill', handleParcelleMouseMove)
    mapRef.current?.on('mouseleave', 'parcelles-fill', handleParcelleMouseLeave)

    return () => {
      mapRef.current?.off('click', 'parcelles-fill', handleParcelleClick)
      mapRef.current?.off('mouseenter', 'parcelles-fill', handleParcelleMouseEnter)
      mapRef.current?.off('mousemove', 'parcelles-fill', handleParcelleMouseMove)
      mapRef.current?.off('mouseleave', 'parcelles-fill', handleParcelleMouseLeave)
    }
  }, [
    handleParcelleClick,
    handleParcelleMouseEnter,
    handleParcelleMouseMove,
    handleParcelleMouseLeave,
  ])

  // Mise à jour du style de la carte
  useEffect(() => {
    const map = mapRef.current
    if (map && style !== currentStyleRef.current) {
      const center = map.getCenter()
      const zoom = map.getZoom()

      map.setStyle(stylesMap[style])

      map.once('styledata', () => {
        map.setCenter(center)
        map.setZoom(zoom)

        // Remettre le marker après le changement de style

        // Rajouter les couches parcelles après le chargement de style
        if (!map.getSource('parcelles')) {
          map.addSource('parcelles', getParcellesSource({ pmtilesUrl, millesime }))
        }

        const parcellesLayers = getParcellesLayers()
        parcellesLayers.forEach((layer) => {
          if (!map.getLayer(layer.id)) {
            const beforeId = map.getLayer('water-name-lakeline') ? 'water-name-lakeline' : undefined
            map.addLayer(layer, beforeId)
          }
        })
      })

      currentStyleRef.current = style
    }
  }, [style])

  // Selected parcelles display handler
  useEffect(() => {
    highlightParcelles(mapRef.current, highlightedParcelleIds)
  }, [mapRef.current, highlightedParcelleIds, style])

  // Mise à jour du millésime des parcelles
  useEffect(() => {
    const map = mapRef.current

    if (map && map.getSource('parcelles')) {
      parcellePopupRef.current.remove()

      if (map.getLayer('parcelles-fill')) {
        map.removeLayer('parcelles-fill')
      }

      if (map.getLayer('parcelles-outline')) {
        map.removeLayer('parcelles-outline')
      }

      map.removeSource('parcelles')
      map.addSource('parcelles', getParcellesSource({ pmtilesUrl, millesime }))

      const parcellesLayers = getParcellesLayers()
      parcellesLayers.forEach((layer) => {
        const beforeId = map.getLayer('water-name-lakeline') ? 'water-name-lakeline' : undefined
        map.addLayer(layer, beforeId)
      })
    }
  }, [millesime])

  // Zoom sur l'exploitation sélectionnée
  useEffect(() => {
    const map = mapRef.current
    if (map && selectedExploitation?.location) {
      const coords: LngLatLike = [selectedExploitation.location.x, selectedExploitation.location.y]
      map.flyTo({
        center: coords,
        zoom: 12,
        essential: true,
      })
    }
  }, [selectedExploitation])

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
          defaultValue: 'vector',
          onChange: (e) => setStyle(e.target.value),
        }}
        options={[
          { value: 'vector', label: 'Carte vectorielle' },
          { value: 'orthophoto', label: 'Photographie aérienne' },
          { value: 'plan-ign', label: 'Plan IGN' },
        ]}
      />
      <Select
        label=""
        style={{ position: 'absolute', right: 0 }}
        nativeSelectProps={{
          defaultValue: millesime,
          onChange: (e) => {
            router.reload({ only: ['queryString'], data: { millesime: e.target.value } })
          },
        }}
        options={[
          { value: '2024', label: '2024' },
          { value: '2023', label: '2023' },
        ]}
      />
    </div>
  )
}
