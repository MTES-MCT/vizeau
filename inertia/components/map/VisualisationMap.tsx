import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import { createRoot } from 'react-dom/client'
import { fr } from '@codegouvfr/react-dsfr'
import maplibre, { type LngLatLike, MapGeoJSONFeature } from 'maplibre-gl'
import { Protocol } from 'pmtiles'
import type { AacSummaryJson, ExploitationJson, ParcelleJson, ProjectJson } from '#types/models'
import PopupExploitation from '~/components/map/popup-exploitation'
import type { MapDesiredState } from '~/functions/map_reconciler'
import { useMapReconciler } from '~/hooks/use_map_reconciler'

import { renderPopupParcelle } from './popup-parcelle'

import 'maplibre-gl/dist/maplibre-gl.css'
import photo from '~/components/map/styles/photo.json'
import planIGN from '~/components/map/styles/plan-ign.json'
import vector from '~/components/map/styles/vector.json'

import { getRpgIdsFromParcellesForYear, setParcellesHighlight } from '~/functions/map'
import { useMap } from '~/hooks/use_map'
import { MapErrorBoundary } from './map-error-boundary'
import Loader from '~/ui/Loader'

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

export interface VisualisationMapRef {
  centerOnExploitation: (exploitation: ExploitationJson) => void
  centerOnParcelle: (parcelle: ParcelleJson) => void
  centerOnAac: (aac: AacSummaryJson) => void
  centerOnCoordinates: (coordinates: { x: number; y: number }) => void
}

type VisualisationMapProps = {
  exploitations: ExploitationJson[]
  selectedExploitation?: ExploitationJson
  selectedParcelle?: ParcelleJson
  selectedParcelleId?: string
  isMapLoading: boolean
  setIsMapLoading: (isMapLoading: boolean) => void
  onParcelleClick?: (parcelleFeature: MapGeoJSONFeature) => void
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
  showSage?: boolean
  style?: string
  onZoomChange?: (zoom: number) => void
  pmtilesUrl: string
  projects: ProjectJson[]
}

const VisualisationMapContent = forwardRef<VisualisationMapRef, VisualisationMapProps>(
  (
    {
      exploitations,
      selectedExploitation,
      selectedParcelle,
      selectedParcelleId,
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
      showSage = false,
      style = 'vector',
      onZoomChange,
      pmtilesUrl,
      projects,
    },
    ref
  ) => {
    const markersRef = useRef<maplibre.Marker[]>([])
    // Will be true when a marker is hovered to avoid showing parcelle popup at the same time
    const [isMarkerHovered, setIsMarkerHovered] = useState(false)
    // The popup is created once and will be hidden/shown on demand, with its contents updated.
    const parcellePopupRef = useRef<maplibre.Popup>(
      new maplibre.Popup({ closeButton: false, offset: 10, className: 'custom-popup' })
    )
    const currentParcelleIdRef = useRef<string | null>(null)
    const currentStyleRef = useRef<string>('vector')

    // Détermine les parcelles à mettre en évidence selon le mode
    const highlightedParcelleIds = useMemo(() => {
      if (editMode) {
        return formParcelleIds
      }

      const selectedParcelleId = selectedParcelle?.rpgId

      if (selectedParcelleId && selectedParcelle.year.toString() === millesime) {
        return [selectedParcelleId]
      }

      if (selectedParcelleId) {
        return [selectedParcelleId]
      }

      if (selectedExploitation?.parcelles) {
        return getRpgIdsFromParcellesForYear(selectedExploitation.parcelles, millesime)
      }

      return []
    }, [
      editMode,
      formParcelleIds,
      millesime,
      selectedExploitation,
      selectedParcelle,
      selectedParcelleId,
    ])

    const desiredMapState: MapDesiredState = useMemo(
      () => ({
        pmtilesUrl,
        millesime,
        showParcelles,
        showAac,
        showPpe,
        showPpr,
        showCommunes,
        showSage,
        showBioOnly,
        visibleCultures,
        highlightedParcelleIds,
        unavailableParcelleIds,
      }),
      [
        pmtilesUrl,
        millesime,
        showParcelles,
        showAac,
        showPpe,
        showPpr,
        showCommunes,
        showSage,
        showBioOnly,
        visibleCultures,
        highlightedParcelleIds,
        unavailableParcelleIds,
      ]
    )

    useImperativeHandle(ref, () => ({
      centerOnExploitation: (exploitation: ExploitationJson) => {
        const map = mapRef.current
        if (map && exploitation.location) {
          const coords: LngLatLike = [exploitation.location.x, exploitation.location.y]
          map.flyTo({
            center: coords,
            zoom: 12,
            essential: true,
          })
        }
      },
      centerOnParcelle: (parcelle: ParcelleJson) => {
        const map = mapRef.current
        if (map && parcelle.centroid) {
          const coords: LngLatLike = [parcelle.centroid.x, parcelle.centroid.y]
          map.flyTo({
            center: coords,
            zoom: 15,
            essential: true,
          })
        }
      },
      centerOnAac: (aac: AacSummaryJson) => {
        const map = mapRef.current
        if (map && aac.bbox) {
          map.fitBounds(
            [
              [aac.bbox[0], aac.bbox[1]],
              [aac.bbox[2], aac.bbox[3]],
            ],
            { padding: 40, essential: true }
          )
        }
      },
      centerOnCoordinates: (coordinates: { x: number; y: number }) => {
        const map = mapRef.current
        if (map) {
          const coords: LngLatLike = [coordinates.x, coordinates.y]
          map.flyTo({
            center: coords,
            zoom: 15,
            essential: true,
          })
        }
      },
    }))

    const parcelleCommentMap = useMemo(() => {
      const map = new Map<string, string | undefined>()
      for (const exp of exploitations) {
        for (const p of exp.parcelles ?? []) {
          if (p.rpgId) map.set(p.rpgId, p.comment ?? undefined)
        }
      }
      return map
    }, [exploitations])

    const handleParcelleMouseMove = useCallback(
      (e: maplibre.MapLayerMouseEvent) => {
        // If a marker is hovered, we don't show parcelle popup to avoid showing two popups at the same time
        if (!mapRef.current || isMarkerHovered) {
          return
        }

        const props = e.features?.[0]?.properties

        const cultureCode = props?.code_cultu
        const surfParc = props?.surf_parc
        const id = props?.id_parcel
        const isUnavailable = unavailableParcelleIds.includes(id)

        const comment = parcelleCommentMap.get(id)
        // Mise à jour la popup uniquement si la parcelle change
        if (currentParcelleIdRef.current !== id) {
          // Vérifier si une parcelle bio existe à la position du curseur
          const bioFeatures = mapRef.current.queryRenderedFeatures(e.point, {
            layers: ['parcellesbio-fill'],
          })

          const isBio = bioFeatures.length > 0

          const exploitation = exploitations.find((exp) =>
            exp.parcelles?.some((p) => p.rpgId === id)
          )

          const projectsWithThisParcelle = projects.filter((project) => {
            return project.parcelles.some((p) => p.rpgId === id)
          })

          const popupContent = renderPopupParcelle(
            cultureCode,
            surfParc,
            millesime,
            comment,
            isUnavailable,
            isBio,
            editMode,
            selectedExploitation?.id !== undefined && exploitation?.id === selectedExploitation?.id,
            projectsWithThisParcelle
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
          if (isUnavailable) {
            mapRef.current.getCanvas().style.cursor = 'not-allowed'
          } else {
            mapRef.current.getCanvas().style.cursor = ''
          }
        }
      },
      [
        unavailableParcelleIds,
        parcelleCommentMap,
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
        const id = feature?.properties?.['id_parcel']

        if (feature?.properties && !unavailableParcelleIds.includes(id)) {
          onParcelleClick(feature)
        }
      },
      [onParcelleClick, unavailableParcelleIds]
    )

    const { mapContainerRef, mapRef, map } = useMap(
      {
        style: stylesMap[style],
        center: [2.24, 46.54],
        zoom: 5,
        maxZoom: 17.5,
        trackResize: true,
        attributionControl: { compact: true },
        dragRotate: false,
        pitchWithRotate: false,
        touchZoomRotate: false,
      },
      (createdMap) => {
        createdMap.on('load', () => {
          createdMap.addControl(
            new maplibre.ScaleControl({
              maxWidth: 100,
              unit: 'metric',
            }),
            'bottom-left'
          )

          onZoomChange?.(createdMap.getZoom())
          setIsMapLoading(false)
        })

        // Ensures the map is not blocked in loading state after any loading event
        createdMap.on('idle', () => {
          setIsMapLoading(false)
        })

        createdMap.on('zoomend', () => {
          onZoomChange?.(createdMap.getZoom())
        })
      }
    )

    // Owns every source, layer, visibility rule, filter and feature state of the map.
    const reconcileMapState = useMapReconciler(mapRef, map, desiredMapState)

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
                getRpgIdsFromParcellesForYear(exploitation.parcelles, millesime),
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
                getRpgIdsFromParcellesForYear(exploitation.parcelles, millesime),
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

    // Mise à jour du fond de carte. `setStyle` applique un diff synchrone qui retire les
    // sources et layers ajoutés par-dessus le fond de carte sans émettre d'événement : la
    // reconciliation doit donc être relancée dans la foulée pour les remettre en place.
    useEffect(() => {
      if (!mapRef.current || style === currentStyleRef.current) {
        return
      }

      const map = mapRef.current
      const center = map.getCenter()
      const zoom = map.getZoom()

      const restoreCamera = () => {
        map.setCenter(center)
        map.setZoom(zoom)
      }

      currentStyleRef.current = style

      // Only used when MapLibre falls back to a full style reload, which resets the camera.
      map.once('style.load', restoreCamera)
      map.setStyle(stylesMap[style])
      restoreCamera()

      reconcileMapState()

      return () => {
        map.off('style.load', restoreCamera)
      }
    }, [style, reconcileMapState])

    // La popup ouverte ne décrit plus la parcelle survolée après un changement de millésime.
    useEffect(() => {
      parcellePopupRef.current.remove()
      currentParcelleIdRef.current = null
    }, [millesime])

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
        <div
          ref={mapContainerRef}
          className={`flex justify-between h-full w-full ${editMode ? 'editing-glow' : ''}`}
        />
        {editMode && (
          <div
            className="absolute left-0 right-0 top-0 fr-text--md flex items-center justify-center fr-p-2v shadow-md"
            style={{
              backgroundColor: fr.colors.decisions.background.contrast.info.default,
              color: fr.colors.decisions.text.default.info.default,
              fontWeight: '700',
              minWidth: '30%',
            }}
          >
            <span className="fr-icon-edit-line fr-icon--md fr-mr-1v" aria-hidden="true" />
            Attribuez des parcelles à cette exploitation
          </div>
        )}
      </div>
    )
  }
)

const VisualisationMap = forwardRef<VisualisationMapRef, VisualisationMapProps>(
  function VisualisationMap(props, ref) {
    return (
      <MapErrorBoundary>
        <VisualisationMapContent {...props} ref={ref} />
      </MapErrorBoundary>
    )
  }
)

export default VisualisationMap
