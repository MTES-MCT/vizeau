import { useCallback, useEffect, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { fr } from '@codegouvfr/react-dsfr'
import Select from '@codegouvfr/react-dsfr/SelectNext'
import maplibre, { type LngLatLike } from 'maplibre-gl'
import { Protocol } from 'pmtiles'
import { ExploitationJson } from '../../../types/models'
import PopupExploitation from '~/components/map/popup-exploitation'
import { GROUPES_CULTURAUX } from '~/functions/cultures-group'
import { getParcellesLayers, getParcellesSource } from './styles/parcelles'
import {
  getCommunesSource,
  getCommunesLayer,
  getAacSource,
  getAacLayer,
  getPpeSource,
  getPpeLayer,
  getPprSource,
  getPprLayer,
} from './styles/zonage'

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
  showParcelles = true,
  showAac = true,
  showPpe = false,
  showPpr = false,
  showCommunes = false,
  showBioOnly = false,
  visibleCultures = [],
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
  showParcelles?: boolean
  showAac?: boolean
  showPpe?: boolean
  showPpr?: boolean
  showCommunes?: boolean
  showBioOnly?: boolean
  visibleCultures?: string[]
}) {
  const { pmtilesUrl } = usePage<InferPageProps<VisualisationController, 'index'>>().props
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<maplibre.Map | null>(null)
  const markersRef = useRef<maplibre.Marker[]>([])
  // Will be true when a marker is hovered to avoid showing parcelle popup at the same time
  const [isMarkerHovered, setIsMarkerHovered] = useState(false)
  // The popup is created once and will be hidden/shown on demand, with its contents updated.
  const parcellePopupRef = useRef<maplibre.Popup>(
    new maplibre.Popup({ closeButton: false, offset: 10, className: 'custom-popup' })
  )
  const currentParcelleIdRef = useRef<string | null>(null)
  const currentStyleRef = useRef<string>('vector')
  const [style, setStyle] = useState<string>(currentStyleRef.current)
  const previousVisibleCulturesRef = useRef<string[]>([])

  // Synchroniser la ref avec les props
  useEffect(() => {
    previousVisibleCulturesRef.current = visibleCultures
  }, [visibleCultures])

  // Fonction pour filtrer les parcelles par code culture
  const updateCultureFilter = useCallback(
    (cultureCodes: string[]) => {
      if (!mapRef.current) return

      const map = mapRef.current

      if (cultureCodes.length === 0) {
        // Masquer tout avec un filtre qui ne match jamais
        const hideFilter: maplibre.FilterSpecification = ['==', ['get', 'id_parcel'], '']
        ;['parcelles-fill', 'parcelles-outline'].forEach((layerId) => {
          if (map.getLayer(layerId)) {
            map.setFilter(layerId, hideFilter)
          }
        })
        return
      }

      // Convertir les codes en nombres
      const codesAsNumbers = cultureCodes.map((code) => parseInt(code, 10))

      // Créer le filtre selon le millésime
      let filter: maplibre.FilterSpecification
      if (millesime === '2024') {
        // Millésime 2024 : 'code_group'
        filter = ['in', ['to-number', ['get', 'code_group']], ['literal', codesAsNumbers]]
      } else {
        // Millésime 2023 : 'CODE_GROUP'
        filter = ['in', ['to-number', ['get', 'CODE_GROUP']], ['literal', codesAsNumbers]]
      }

      ;['parcelles-fill', 'parcelles-outline'].forEach((layerId) => {
        if (map.getLayer(layerId)) {
          map.setFilter(layerId, filter)
        }
      })
    },
    [millesime]
  )

  const handleParcelleMouseMove = useCallback(
    (e: maplibre.MapLayerMouseEvent) => {
      // If a marker is hovered, we don't show parcelle popup to avoid showing two popups at the same time
      if (!mapRef.current || isMarkerHovered) {
        return
      }

      const props = e.features?.[0]?.properties

      // Le millésime 2024 utilise des minuscules, celui de 2023 des majuscules
      const codeGroup = props?.code_group ?? props?.CODE_GROUP
      const surfParc = props?.surf_parc ?? props?.SURF_PARC
      const id = props?.id_parcel ?? props?.ID_PARCEL

      // Mise à jour la popup uniquement si la parcelle change
      if (currentParcelleIdRef.current !== id) {
        // Vérifier si une parcelle bio existe à la position du curseur
        const bioFeatures = mapRef.current.queryRenderedFeatures(e.point, {
          layers: ['parcellesbio-fill'],
        })

        const isBio = bioFeatures.length > 0

        const exploitation = exploitations.find((exp) => exp.parcelles?.some((p) => p.rpgId === id))

        const popupContent = renderPopupParcelle(
          exploitation ?? {},
          codeGroup,
          surfParc,
          millesime,
          isBio,
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
    [
      unavailableParcelleIds,
      exploitations,
      selectedExploitation,
      editMode,
      millesime,
      isMarkerHovered,
    ]
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

      if (!map.getSource('communes')) {
        map.addSource('communes', getCommunesSource({ pmtilesUrl }))
      }

      if (!map.getSource('aac')) {
        map.addSource('aac', getAacSource({ pmtilesUrl }))
      }

      if (!map.getSource('ppe')) {
        map.addSource('ppe', getPpeSource({ pmtilesUrl }))
      }

      if (!map.getSource('ppr')) {
        map.addSource('ppr', getPprSource({ pmtilesUrl }))
      }

      const addLayers = (layers: Array<{ id: string; [key: string]: any }>, beforeId?: string) => {
        layers.forEach((layer) => {
          if (!map.getLayer(layer.id)) {
            map.addLayer(layer as maplibre.AddLayerObject, beforeId)
          }
        })
      }

      const beforeId = map.getLayer('water-name-lakeline') ? 'water-name-lakeline' : undefined

      addLayers(getPprLayer(), beforeId)
      addLayers(getPpeLayer(), beforeId)
      addLayers(getAacLayer(), beforeId)
      addLayers(getCommunesLayer(), beforeId)
      addLayers(getParcellesLayers(), beforeId)

      // Appliquer le filtre initial quand la carte est prête (toutes les cultures visibles par défaut)
      map.once('idle', () => {
        const allCultureCodes = Object.keys(GROUPES_CULTURAUX)
        const codesAsNumbers = allCultureCodes.map((code) => parseInt(code, 10))
        let filter: maplibre.FilterSpecification
        if (millesime === '2024') {
          filter = ['in', ['to-number', ['get', 'code_group']], ['literal', codesAsNumbers]]
        } else {
          filter = ['in', ['to-number', ['get', 'CODE_GROUP']], ['literal', codesAsNumbers]]
        }
        ;['parcelles-fill', 'parcelles-outline'].forEach((layerId) => {
          if (map.getLayer(layerId)) {
            map.setFilter(layerId, filter)
          }
        })
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
          maxWidth: 'none',
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

          setIsMarkerHovered(true)

          const popupNode = document.createElement('div')
          const root = createRoot(popupNode)
          root.render(<PopupExploitation exploitation={exploitation} />)
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
          setIsMarkerHovered(false)
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
    const layers = showBioOnly ? ['parcellesbio-fill'] : ['parcelles-fill']
    const events = [
      { event: 'click', handler: handleParcelleClick },
      { event: 'mousemove', handler: handleParcelleMouseMove },
      { event: 'mouseleave', handler: handleParcelleMouseLeave },
    ]

    // Attacher tous les événements
    events.forEach(({ event, handler }) => {
      layers.forEach((layer) => {
        mapRef.current?.on(event as any, layer, handler)
      })
    })

    // Détacher tous les événements
    return () => {
      events.forEach(({ event, handler }) => {
        layers.forEach((layer) => {
          mapRef.current?.off(event as any, layer, handler)
        })
      })
    }
  }, [handleParcelleClick, handleParcelleMouseMove, handleParcelleMouseLeave, showBioOnly])

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

      const addSourceIfMissing = (sourceId: string, sourceConfig: any) => {
        if (!map.getSource(sourceId)) {
          map.addSource(sourceId, sourceConfig)
        }
      }

      // Fonction helper pour ajouter des layers
      const addLayersIfMissing = (layers: Array<{ id: string; [key: string]: any }>) => {
        layers.forEach((layer) => {
          if (!map.getLayer(layer.id)) {
            map.addLayer(layer as maplibre.AddLayerObject)
          }
        })
      }

      // Fonction helper pour définir la visibilité des layers
      const setLayerVisibility = (layerIds: string[], visible: boolean) => {
        const visibility = visible ? 'visible' : 'none'
        layerIds.forEach((layerId) => {
          if (map.getLayer(layerId)) {
            map.setLayoutProperty(layerId, 'visibility', visibility)
          }
        })
      }

      addSourceIfMissing('communes', getCommunesSource({ pmtilesUrl }))
      addSourceIfMissing('aac', getAacSource({ pmtilesUrl }))
      addSourceIfMissing('ppe', getPpeSource({ pmtilesUrl }))
      addSourceIfMissing('ppr', getPprSource({ pmtilesUrl }))

      addLayersIfMissing(getPprLayer())
      addLayersIfMissing(getPpeLayer())
      addLayersIfMissing(getAacLayer())
      addLayersIfMissing(getCommunesLayer())
      addLayersIfMissing(getParcellesLayers())

      // Appliquer immédiatement la visibilité des layers selon l'état des checkboxes
      const layerVisibilityConfig = [
        { layers: ['ppr-fill', 'ppr-outline'], visible: showPpr },
        { layers: ['ppe-fill', 'ppe-outline'], visible: showPpe },
        { layers: ['aac-fill', 'aac-outline'], visible: showAac },
        { layers: ['communes-outline'], visible: showCommunes },
        { layers: ['parcelles-fill', 'parcelles-outline'], visible: showParcelles },
      ]

      layerVisibilityConfig.forEach(({ layers, visible }) => {
        setLayerVisibility(layers, visible)
      })

      // Réappliquer le filtre de culture après changement de style
      map.once('idle', () => {
        // Utiliser une ref pour éviter les dépendances
        const currentCultures = previousVisibleCulturesRef.current
        if (currentCultures.length === 0) {
          const hideFilter: maplibre.FilterSpecification = ['==', ['get', 'id_parcel'], '']
          ;['parcelles-fill', 'parcelles-outline'].forEach((layerId) => {
            if (map.getLayer(layerId)) {
              map.setFilter(layerId, hideFilter)
            }
          })
        } else {
          const codesAsNumbers = currentCultures.map((code) => parseInt(code, 10))
          let filter: maplibre.FilterSpecification
          if (millesime === '2024') {
            filter = ['in', ['to-number', ['get', 'code_group']], ['literal', codesAsNumbers]]
          } else {
            filter = ['in', ['to-number', ['get', 'CODE_GROUP']], ['literal', codesAsNumbers]]
          }
          ;['parcelles-fill', 'parcelles-outline'].forEach((layerId) => {
            if (map.getLayer(layerId)) {
              map.setFilter(layerId, filter)
            }
          })
        }
      })
    })

    currentStyleRef.current = style
  }, [style, showParcelles, showAac, showPpe, showPpr, showCommunes, millesime])

  useEffect(() => {
    if (!mapRef.current) {
      return
    }

    const map = mapRef.current

    if (!map.isStyleLoaded()) {
      return
    }

    if (showBioOnly) {
      // Mode bio uniquement : rendre les parcelles bio opaques
      if (map.getLayer('parcelles-fill')) {
        map.setLayoutProperty('parcelles-fill', 'visibility', 'none')
      }
      if (map.getLayer('parcelles-outline')) {
        map.setLayoutProperty('parcelles-outline', 'visibility', 'none')
      }
      if (map.getLayer('parcellesbio-fill')) {
        map.setPaintProperty('parcellesbio-fill', 'fill-opacity', [
          'case',
          ['boolean', ['feature-state', 'unavailable'], false],
          0.3,
          ['boolean', ['feature-state', 'highlighted'], false],
          0.7,
          0.5,
        ])
      }
      if (map.getLayer('parcellesbio-outline')) {
        map.setPaintProperty('parcellesbio-outline', 'line-opacity', 1)
      }
    } else {
      // Mode normal : parcelles visibles, bio transparent pour détection uniquement
      if (map.getLayer('parcelles-fill')) {
        map.setLayoutProperty('parcelles-fill', 'visibility', showParcelles ? 'visible' : 'none')
      }
      if (map.getLayer('parcelles-outline')) {
        map.setLayoutProperty('parcelles-outline', 'visibility', showParcelles ? 'visible' : 'none')
      }
      if (map.getLayer('parcellesbio-fill')) {
        map.setPaintProperty('parcellesbio-fill', 'fill-opacity', 0)
      }
      if (map.getLayer('parcellesbio-outline')) {
        map.setPaintProperty('parcellesbio-outline', 'line-opacity', 0)
      }
    }
  }, [showBioOnly, showParcelles])

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

    if (map.getLayer('parcellesbio-fill')) {
      map.removeLayer('parcellesbio-fill')
    }

    if (map.getLayer('parcellesbio-outline')) {
      map.removeLayer('parcellesbio-outline')
    }

    map.removeSource('parcelles')
    map.addSource('parcelles', getParcellesSource({ pmtilesUrl, millesime }))

    const parcellesLayers = getParcellesLayers()
    parcellesLayers.forEach((layer) => {
      const beforeId = map.getLayer('water-name-lakeline') ? 'water-name-lakeline' : undefined
      map.addLayer(layer, beforeId)
    })

    // Attendre que la source soit chargée pour réappliquer le filtre
    const onSourceData = (e: any) => {
      if (e.sourceId === 'parcelles' && e.isSourceLoaded) {
        map.off('sourcedata', onSourceData)

        // Réappliquer le filtre de culture après changement de millésime
        const currentCultures = previousVisibleCulturesRef.current
        if (currentCultures.length === 0) {
          const hideFilter: maplibre.FilterSpecification = ['==', ['get', 'id_parcel'], '']
          ;['parcelles-fill', 'parcelles-outline'].forEach((layerId) => {
            if (map.getLayer(layerId)) {
              map.setFilter(layerId, hideFilter)
            }
          })
        } else {
          const codesAsNumbers = currentCultures.map((code) => parseInt(code, 10))
          let filter: maplibre.FilterSpecification
          if (millesime === '2024') {
            filter = ['in', ['to-number', ['get', 'code_group']], ['literal', codesAsNumbers]]
          } else {
            filter = ['in', ['to-number', ['get', 'CODE_GROUP']], ['literal', codesAsNumbers]]
          }
          ;['parcelles-fill', 'parcelles-outline'].forEach((layerId) => {
            if (map.getLayer(layerId)) {
              map.setFilter(layerId, filter)
            }
          })
        }
      }
    }

    map.on('sourcedata', onSourceData)

    return () => {
      map.off('sourcedata', onSourceData)
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

  // Gestion de la visibilité des layers selon les états des checkboxes
  useEffect(() => {
    if (!mapRef.current) return

    const map = mapRef.current

    // Configuration des layers avec leurs états de visibilité
    const layerVisibility = [
      { layers: ['ppr-fill', 'ppr-outline'], visible: showPpr },
      { layers: ['ppe-fill', 'ppe-outline'], visible: showPpe },
      { layers: ['aac-fill', 'aac-outline'], visible: showAac },
      { layers: ['communes-outline'], visible: showCommunes },
      { layers: ['parcelles-fill', 'parcelles-outline'], visible: showParcelles },
    ]

    // Application de la visibilité pour chaque groupe de layers
    layerVisibility.forEach(({ layers, visible }) => {
      layers.forEach((layerId) => {
        if (map.getLayer(layerId)) {
          map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none')
        }
      })
    })
  }, [showParcelles, showAac, showPpe, showPpr, showCommunes])

  // Mise à jour du filtre quand visibleCultures change
  useEffect(() => {
    if (!mapRef.current || !mapRef.current.isStyleLoaded()) return

    const map = mapRef.current

    // Vérifier que les layers existent avant d'appliquer le filtre
    if (map.getLayer('parcelles-fill') && map.getLayer('parcelles-outline')) {
      updateCultureFilter(visibleCultures)
    }
  }, [visibleCultures, updateCultureFilter])

  return (
    <div className="flex flex-col h-full w-full relative border">
      <style>{`
        .custom-popup .maplibregl-popup-content {
          background-color: ${fr.colors.decisions.background.default.grey.default};
          padding: 1rem;
          border-radius: 8px;
          opacity: 0.95;
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

      {/* Sélecteur de fond de carte */}
      <Select
        label=""
        style={{ position: 'absolute', top: '10px', left: '10px' }}
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

      {/* Sélecteur de millésime */}
      <Select
        label=""
        style={{ position: 'absolute', top: '10px', right: '10px' }}
        disabled={editMode}
        nativeSelectProps={{
          defaultValue: millesime,
          onChange: (e) => {
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
