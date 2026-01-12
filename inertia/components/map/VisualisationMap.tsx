import { useCallback, useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { fr } from '@codegouvfr/react-dsfr'
import Select from '@codegouvfr/react-dsfr/SelectNext'
import maplibre, { type LngLatLike } from 'maplibre-gl'
import { Protocol } from 'pmtiles'
import { ExploitationJson } from '../../../types/models'
import Popup from '~/components/map/popup'
import { getParcellesLayers, getParcellesSource } from './styles/parcelles'

import { renderPopupParcelle } from './popup-parcelle'

import 'maplibre-gl/dist/maplibre-gl.css'
import photo from '~/components/map/styles/photo.json'
import planIGN from '~/components/map/styles/plan-ign.json'
import vector from '~/components/map/styles/vector.json'
import { router, usePage } from '@inertiajs/react'
import { InferPageProps } from '@adonisjs/inertia/types'
import VisualisationController from '#controllers/visualisation_controller'
import { setParcellesUnavailability, setParcellesHighlight } from '~/functions/map'
import Loader from '~/ui/Loader'

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

const markerColor = fr.colors.decisions.artwork.major.blueFrance.default

export default function VisualisationMap({
  exploitations,
  selectedExploitation,
  isMapLoading,
  setIsMapLoading,
  onParcelleClick,
  onParcelleMouseLeave,
  onMarkerClick,
  onMarkerMouseEnter,
  onMarkerMouseLeave,
  formParcelleIds = [],
  unavailableParcelleIds = [],
  millesime,
  editMode = false,
}: {
  exploitations: ExploitationJson[]
  selectedExploitation?: ExploitationJson
  isMapLoading: boolean
  setIsMapLoading: (isMapLoading: boolean) => void
  onParcelleClick?: (parcelleProperties: { [name: string]: any }) => void
  onParcelleMouseMove?: (parcelleProperties: { [name: string]: any }) => void
  onParcelleMouseLeave?: () => void
  onMarkerClick?: (exploitation: ExploitationJson) => void
  onMarkerMouseEnter?: (exploitation: ExploitationJson) => void
  onMarkerMouseLeave?: () => void
  formParcelleIds?: string[]
  unavailableParcelleIds?: string[]
  millesime: string
  editMode?: boolean
}) {
  const { pmtilesUrl } = usePage<InferPageProps<VisualisationController, 'index'>>().props
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<maplibre.Map | null>(null)
  const markersRef = useRef<maplibre.Marker[]>([])
  // The popup is created once and will be hidden/shown on demand, with its contents updated.
  const parcellePopupRef = useRef<maplibre.Popup>(
    new maplibre.Popup({ closeButton: false, offset: 10, className: 'custom-popup' })
  )
  const currentParcelleIdRef = useRef<string | null>(null)
  const currentStyleRef = useRef<string>('vector')
  const [style, setStyle] = useState<string>(currentStyleRef.current)

  const handleParcelleMouseMove = useCallback(
    (e: maplibre.MapLayerMouseEvent) => {
      if (!mapRef.current) {
        return
      }

      const props = e.features?.[0]?.properties

      // Le millésime 2024 utilise des minuscules, celui de 2023 des majuscules
      const codeGroup = props?.code_group ?? props?.CODE_GROUP
      const surfParc = props?.surf_parc ?? props?.SURF_PARC
      const id = props?.id_parcel ?? props?.ID_PARCEL

      // Mise à jour la popup uniquement si la parcelle change
      if (currentParcelleIdRef.current !== id) {
        const exploitation = exploitations.find((exp) => exp.parcelles?.some((p) => p.rpgId === id))

        const popupContent = renderPopupParcelle(
          exploitation ?? {},
          codeGroup,
          surfParc,
          millesime,
          exploitation !== undefined,
          editMode,
          exploitation?.id === selectedExploitation?.id
        )

        parcellePopupRef.current
          .setLngLat(e.lngLat)
          .setDOMContent(popupContent)
          .addTo(mapRef.current)
        currentParcelleIdRef.current = id
      } else {
        parcellePopupRef.current.setLngLat(e.lngLat)
      }

      if (props) {
        if (unavailableParcelleIds.includes(id)) {
          mapRef.current.getCanvas().style.cursor = 'not-allowed'
        } else {
          mapRef.current.getCanvas().style.cursor = ''
        }
      }
    },
    [unavailableParcelleIds]
  )

  const handleParcelleMouseLeave = useCallback(() => {
    if (!mapRef.current) {
      return
    }

    mapRef.current.getCanvas().style.cursor = ''
    parcellePopupRef.current.remove()
    currentParcelleIdRef.current = null

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

      setIsMapLoading(false)
    })

    // Ensures the map is not blocked in loading state after any loading event
    map.on('idle', () => {
      setIsMapLoading(false)
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
          className: 'custom-popup',
        })

        const marker = new maplibre.Marker({
          draggable: false,
          color: markerColor,
        })
          .setLngLat(coords)
          .addTo(mapRef.current)

        const markerElement = marker.getElement()
        markerElement.style.cursor = editMode ? 'not-allowed' : 'pointer'
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

          // Highlight parcelles on marker hover if it's not the selected exploitation
          if (
            (selectedExploitation === undefined || exploitation.id !== selectedExploitation.id) &&
            exploitation.parcelles &&
            exploitation.parcelles.length > 0
          ) {
            setParcellesHighlight(
              mapRef.current,
              exploitation.parcelles
                .filter((p) => p.year.toString() === millesime)
                .map((p) => p.rpgId),
              true
            )
          }

          onMarkerMouseEnter?.(exploitation)
        })

        markerElement.addEventListener('mouseleave', () => {
          popup.remove()

          // Unhighlight parcelles on marker leave if it's not the selected exploitation
          if (
            (selectedExploitation === undefined || exploitation.id !== selectedExploitation.id) &&
            exploitation.parcelles &&
            exploitation.parcelles.length > 0
          ) {
            setParcellesHighlight(
              mapRef.current,
              exploitation.parcelles
                .filter((p) => p.year.toString() === millesime)
                .map((p) => p.rpgId),
              false
            )
          }

          onMarkerMouseLeave?.()
        })

        markerElement.addEventListener('click', () => {
          if (editMode) {
            return
          }
          popup.remove()
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

      markersRef.current = []
    }
  }, [
    exploitations,
    selectedExploitation,
    editMode,
    millesime,
    onMarkerClick,
    onMarkerMouseEnter,
    onMarkerMouseLeave,
  ])

  // Map event update handlers. We attach/detach event listeners only when the handlers change to avoid performance issues.
  useEffect(() => {
    mapRef.current?.on('click', 'parcelles-fill', handleParcelleClick)
    return () => {
      mapRef.current?.off('click', 'parcelles-fill', handleParcelleClick)
    }
  }, [handleParcelleClick])

  useEffect(() => {
    mapRef.current?.on('mousemove', 'parcelles-fill', handleParcelleMouseMove)
    return () => {
      mapRef.current?.off('mousemove', 'parcelles-fill', handleParcelleMouseMove)
    }
  }, [handleParcelleMouseMove])

  useEffect(() => {
    mapRef.current?.on('mouseleave', 'parcelles-fill', handleParcelleMouseLeave)
    return () => {
      mapRef.current?.off('mouseleave', 'parcelles-fill', handleParcelleMouseLeave)
    }
  }, [handleParcelleMouseLeave])

  // Mise à jour du style de la carte
  useEffect(() => {
    if (!mapRef.current || style === currentStyleRef.current) {
      return
    }

    const map = mapRef.current
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
  }, [style])

  // Mise à jour du millésime des parcelles
  useEffect(() => {
    if (!mapRef.current || mapRef.current.getSource('parcelles') === undefined) {
      return
    }

    const map = mapRef.current

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

  useEffect(() => {
    // Détermine les parcelles à highlight selon le mode
    let parcelleIds: string[] = []
    if (editMode) {
      parcelleIds = formParcelleIds
    } else if (selectedExploitation?.parcelles) {
      parcelleIds = selectedExploitation.parcelles
        .filter((parcelle) => parcelle.year.toString() === millesime)
        .map((parcelle) => parcelle.rpgId)
    }

    if (parcelleIds.length > 0) {
      setParcellesHighlight(mapRef.current, parcelleIds, true)
    }

    return () => {
      if (parcelleIds.length > 0) {
        setParcellesHighlight(mapRef.current, parcelleIds, false)
      }
    }
  }, [editMode, formParcelleIds, selectedExploitation, style, millesime])

  // Manage unavailable parcelles highlighting
  useEffect(() => {
    if (unavailableParcelleIds.length > 0) {
      setParcellesUnavailability(mapRef.current, unavailableParcelleIds, true)
    }
    return () => {
      if (unavailableParcelleIds.length > 0) {
        setParcellesUnavailability(mapRef.current, unavailableParcelleIds, false)
      }
    }
  }, [unavailableParcelleIds, style, millesime])

  return (
    <div className="flex flex-col h-full w-full relative border">
      <style>{`
        .custom-popup .maplibregl-popup-content {
          background-color: ${fr.colors.decisions.background.default.grey.default};
          padding: 1rem;
          border-radius: 8px;
        }
        .custom-popup .maplibregl-popup-tip {
          border-top-color: ${fr.colors.decisions.background.default.grey.default};
        }
      `}</style>
      {isMapLoading && (
        <div
          className="flex h-full w-full z-10 absolute items-center justify-center"
          style={{
            background: 'rgba(255,255,255,0.8)',
          }}
        >
          <Loader size="lg" />
        </div>
      )}
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
        disabled={editMode}
        nativeSelectProps={{
          defaultValue: millesime,
          onChange: (e) => {
            // Reload the page with the new millesime
            // This operation can take some time on slow connections, so we set the map in loading state
            // It will be unset when the map 'idle' event is fired
            setIsMapLoading(true)
            router.reload({
              only: ['queryString', 'filteredExploitations'],
              data: { millesime: e.target.value },
            })
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
