import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Popup, ScaleControl } from 'maplibre-gl'
import type { LngLatBounds, MapLayerMouseEvent } from 'maplibre-gl'
import { getCentroid } from '~/functions/map'
import { getCulturesInViewport, type MapDesiredState } from '~/functions/map_reconciler'
import { GROUPES_CULTURAUX } from '~/functions/cultures_group'
import { useMap } from '~/hooks/use_map'
import { useMapReconciler } from '~/hooks/use_map_reconciler'
import MapErrorBoundary from './map-error-boundary'
import MillesimeSelect from './millesime-select'
import { renderPopupParcelle } from './popup-parcelle'
import { BASE_MAPS, BASE_MAP_OPTIONS, type BaseMapId } from './styles/base_maps'
import 'maplibre-gl/dist/maplibre-gl.css'
import { Select } from '@codegouvfr/react-dsfr/Select'
import Loader from '~/ui/Loader'
import { fr } from '@codegouvfr/react-dsfr'

export type Bbox = [number, number, number, number]

export type AacEmprise = {
  id: string
  label: string
  bbox: Bbox
}

export type ParcellesMapLayers = {
  showParcelles: boolean
  showAac: boolean
  showPpe: boolean
  showPpr: boolean
  showCommunes: boolean
  showSage: boolean
  visibleCultures: string[]
  /** Cultures présentes dans la zone visible, `null` quand les parcelles n'y sont pas affichées. */
  onCulturesInViewportChange?: (cultureCodes: string[] | null, bounds: LngLatBounds) => void
  onZoomChange?: (zoom: number) => void
}

export const DEFAULT_LAYERS: ParcellesMapLayers = {
  showParcelles: true,
  showAac: false,
  showPpe: false,
  showPpr: false,
  showCommunes: false,
  showSage: false,
  visibleCultures: Object.keys(GROUPES_CULTURAUX),
}

const BOUNDS_PADDING = 40
const EMPTY_IDS: string[] = []

export type SelectedParcelle = {
  rpgId: string
  surface: number | null
  cultureCode: string | null
  centroid: { x: number; y: number } | undefined
}

type ParcellesSelectionMapProps = {
  pmtilesUrl: string
  millesime: string
  selectedParcelleIds: string[]
  unavailableParcelleIds?: string[]
  /** Sans ce callback, la carte est en lecture seule : les parcelles ne sont pas cliquables. */
  onParcelleToggle?: (parcelle: SelectedParcelle) => void
  handleMillesimeChange: (newMillesime: string) => void
  /** AAC sur lesquelles centrer la carte : un sélecteur s'affiche s'il y en a plusieurs. */
  aacs?: AacEmprise[]
  /** AAC affichée à l'ouverture de la carte, à défaut la France entière. */
  selectedAacId?: string
  initialBbox?: Bbox
  onAacChange?: (aacId: string) => void
  layers?: ParcellesMapLayers
  baseMap?: BaseMapId
  onBaseMapChange?: (baseMap: BaseMapId) => void
}

export type ParcellesSelectionMapHandle = {
  flyTo: (centroid: { x: number; y: number }) => void
  getBounds: () => Bbox | undefined
}

const ParcellesSelectionMapContent = forwardRef<
  ParcellesSelectionMapHandle,
  ParcellesSelectionMapProps
>(function ParcellesSelectionMap(
  {
    pmtilesUrl,
    millesime,
    selectedParcelleIds,
    unavailableParcelleIds = EMPTY_IDS,
    onParcelleToggle,
    handleMillesimeChange,
    aacs = [],
    selectedAacId,
    initialBbox: initialBboxProp,
    onAacChange,
    layers = DEFAULT_LAYERS,
    baseMap: baseMapProp,
    onBaseMapChange,
  }: ParcellesSelectionMapProps,
  ref: React.Ref<ParcellesSelectionMapHandle>
) {
  const [isMapLoading, setIsMapLoading] = useState(true)
  const [localBaseMap, setLocalBaseMap] = useState<BaseMapId>(baseMapProp ?? 'vector')
  const baseMap = baseMapProp ?? localBaseMap
  const currentBaseMapRef = useRef(baseMap)
  const initialBbox = initialBboxProp ?? aacs.find((aac) => aac.id === selectedAacId)?.bbox
  const selectedParcelleIdsRef = useRef<string[]>(selectedParcelleIds)
  const unavailableParcelleIdsRef = useRef<string[]>(unavailableParcelleIds)
  const layersRef = useRef(layers)
  const isReadOnly = !onParcelleToggle
  const culturesInViewportPendingRef = useRef(true)
  const currentParcelleIdRef = useRef<string | null>(null)
  const parcellePopupRef = useRef<Popup>(
    new Popup({ closeButton: false, offset: 10, className: 'custom-popup' })
  )

  selectedParcelleIdsRef.current = selectedParcelleIds
  unavailableParcelleIdsRef.current = unavailableParcelleIds
  layersRef.current = layers

  const { mapContainerRef, mapRef, map } = useMap(
    {
      style: BASE_MAPS[baseMap].style,
      ...(initialBbox
        ? {
            bounds: initialBbox,
            fitBoundsOptions: { padding: initialBboxProp ? 0 : BOUNDS_PADDING },
          }
        : { center: [2.24, 46.54], zoom: 5 }),
      maxZoom: 17.5,
      trackResize: true,
      attributionControl: { compact: true },
      dragRotate: false,
      pitchWithRotate: false,
      touchZoomRotate: false,
    },
    (createdMap) => {
      createdMap.on('load', () => {
        createdMap.addControl(new ScaleControl({ maxWidth: 100, unit: 'metric' }), 'bottom-left')
        layersRef.current.onZoomChange?.(createdMap.getZoom())
        setIsMapLoading(false)
      })

      // Ensures the map is not blocked in loading state after any loading event
      createdMap.on('idle', () => {
        setIsMapLoading(false)
        if (culturesInViewportPendingRef.current) {
          culturesInViewportPendingRef.current = false
          layersRef.current.onCulturesInViewportChange?.(
            getCulturesInViewport(createdMap),
            createdMap.getBounds()
          )
        }
      })

      createdMap.on('zoomend', () => layersRef.current.onZoomChange?.(createdMap.getZoom()))
      createdMap.on('moveend', () => {
        culturesInViewportPendingRef.current = true
      })
    }
  )

  const desiredMapState: MapDesiredState = useMemo(
    () => ({
      pmtilesUrl,
      millesime,
      showParcelles: layers.showParcelles,
      showAac: layers.showAac,
      showPpe: layers.showPpe,
      showPpr: layers.showPpr,
      showCommunes: layers.showCommunes,
      showSage: layers.showSage,
      // Les parcelles non bio doivent rester cliquables pendant la sélection
      showBioOnly: false,
      visibleCultures: layers.visibleCultures,
      highlightedParcelleIds: selectedParcelleIds,
      hoveredParcelleIds: EMPTY_IDS,
      unavailableParcelleIds,
    }),
    [pmtilesUrl, millesime, layers, selectedParcelleIds, unavailableParcelleIds]
  )
  const reconcileMapState = useMapReconciler(map, desiredMapState)

  // `setStyle` retire sans événement les couches ajoutées : il faut relancer la réconciliation
  useEffect(() => {
    const currentMap = mapRef.current
    if (!currentMap || baseMap === currentBaseMapRef.current) return

    const center = currentMap.getCenter()
    const zoom = currentMap.getZoom()
    const restoreCamera = () => {
      currentMap.setCenter(center)
      currentMap.setZoom(zoom)
    }

    currentBaseMapRef.current = baseMap
    currentMap.once('style.load', restoreCamera)
    currentMap.setStyle(BASE_MAPS[baseMap].style)
    restoreCamera()
    reconcileMapState()

    return () => {
      currentMap.off('style.load', restoreCamera)
    }
  }, [baseMap, reconcileMapState])

  useEffect(() => {
    parcellePopupRef.current.remove()
    currentParcelleIdRef.current = null
    culturesInViewportPendingRef.current = true
  }, [millesime])

  const handleParcelleMouseMove = useCallback(
    (e: MapLayerMouseEvent) => {
      if (!mapRef.current) return
      const props = e.features?.[0]?.properties
      if (!props) return
      const id = props['id_parcel']
      const isUnavailable = unavailableParcelleIdsRef.current.includes(id)

      if (currentParcelleIdRef.current !== id) {
        const popupContent = renderPopupParcelle(
          props['code_cultu'],
          String(props['surf_parc'] ?? ''),
          millesime,
          undefined,
          isUnavailable,
          false,
          !isReadOnly,
          selectedParcelleIdsRef.current.includes(id)
        )
        parcellePopupRef.current
          .setLngLat(e.lngLat)
          .setDOMContent(popupContent)
          .addTo(mapRef.current)
        currentParcelleIdRef.current = id
      } else {
        parcellePopupRef.current.setLngLat(e.lngLat)
      }
      if (!isReadOnly) {
        mapRef.current.getCanvas().style.cursor = isUnavailable ? 'not-allowed' : 'pointer'
      }
    },
    [millesime, isReadOnly]
  )

  const handleParcelleMouseLeave = useCallback(() => {
    if (!mapRef.current) return
    mapRef.current.getCanvas().style.cursor = ''
    parcellePopupRef.current.remove()
    currentParcelleIdRef.current = null
  }, [])

  const handleParcelleClick = useCallback(
    (e: MapLayerMouseEvent) => {
      const feature = e.features?.[0]
      if (!onParcelleToggle || !feature?.properties) return

      const id = feature.properties['id_parcel']
      if (unavailableParcelleIdsRef.current.includes(id)) return

      onParcelleToggle({
        rpgId: id,
        surface:
          feature.properties['surf_parc'] != null
            ? parseFloat(feature.properties['surf_parc'])
            : null,
        cultureCode: feature.properties['code_cultu'] ?? null,
        centroid: getCentroid(feature.geometry),
      })

      // Dismiss popup so it refreshes on next mousemove with updated selection state
      parcellePopupRef.current.remove()
      currentParcelleIdRef.current = null
    },
    [onParcelleToggle]
  )

  useImperativeHandle(ref, () => ({
    flyTo(centroid: { x: number; y: number }) {
      mapRef.current?.flyTo({ center: [centroid.x, centroid.y], zoom: 15, duration: 800 })
    },
    getBounds() {
      const bounds = mapRef.current?.getBounds()
      return bounds && [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()]
    },
  }))

  const handleAacChange = (aacId: string) => {
    const aac = aacs.find((item) => item.id === aacId)
    if (aac) {
      mapRef.current?.fitBounds(aac.bbox, { padding: BOUNDS_PADDING, duration: 800 })
    }
    onAacChange?.(aacId)
  }

  const handleBaseMapChange = (value: BaseMapId) => {
    setLocalBaseMap(value)
    onBaseMapChange?.(value)
  }

  // Attach / detach event listeners when handlers change
  useEffect(() => {
    const events = [
      { event: 'click', handler: handleParcelleClick },
      { event: 'mousemove', handler: handleParcelleMouseMove },
      { event: 'mouseleave', handler: handleParcelleMouseLeave },
    ]

    events.forEach(({ event, handler }) => {
      mapRef.current?.on(event as any, 'parcelles-fill', handler)
    })

    return () => {
      events.forEach(({ event, handler }) => {
        mapRef.current?.off(event as any, 'parcelles-fill', handler)
      })
    }
  }, [handleParcelleClick, handleParcelleMouseMove, handleParcelleMouseLeave])

  return (
    <div className="flex flex-col h-full w-full">
      {/* Même en-tête que la carte de consultation, aligné sur ceux des panneaux */}
      <div
        className="flex flex-wrap items-center justify-between gap-4 min-h-17 fr-p-2v shrink-0"
        style={{ background: fr.colors.decisions.background.alt.blueFrance.default }}
      >
        <div className="flex flex-wrap items-center gap-4">
          {aacs.length > 1 && (
            <Select
              label=""
              className="fr-mb-0 w-fit max-w-80"
              nativeSelectProps={{
                'value': selectedAacId,
                'aria-label': 'Zoomer sur une AAC',
                'onChange': (e) => handleAacChange(e.target.value),
              }}
            >
              {aacs.map((aac) => (
                <option key={aac.id} value={aac.id}>
                  Zoomer sur {aac.label}
                </option>
              ))}
            </Select>
          )}
          <Select
            label=""
            className="fr-mb-0 w-fit"
            nativeSelectProps={{
              'value': baseMap,
              'aria-label': 'Fond de carte',
              'onChange': (e) => handleBaseMapChange(e.target.value as BaseMapId),
            }}
          >
            {BASE_MAP_OPTIONS.map(({ value, label }) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
        <MillesimeSelect value={millesime} onChange={handleMillesimeChange} />
      </div>
      <div className="relative flex-1 min-h-0">
        {isMapLoading && (
          <div className="flex absolute left-0 right-0 top-0 bottom-0 items-center justify-center">
            <Loader size="lg" />
          </div>
        )}
        <div
          ref={mapContainerRef}
          className={`flex justify-between h-full w-full${isReadOnly ? '' : ' editing-glow'}`}
        />
      </div>
    </div>
  )
})

const ParcellesSelectionMap = forwardRef<ParcellesSelectionMapHandle, ParcellesSelectionMapProps>(
  function ParcellesSelectionMap(props, ref) {
    return (
      <MapErrorBoundary>
        <ParcellesSelectionMapContent {...props} ref={ref} />
      </MapErrorBoundary>
    )
  }
)

export default ParcellesSelectionMap
