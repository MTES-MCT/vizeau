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
import type { LngLatBounds, Map as MaplibreMap, MapLayerMouseEvent } from 'maplibre-gl'
import { usePage } from '@inertiajs/react'
import { getCentroid } from '~/functions/map'
import type { AacEmprise, Bbox, InitialMapView } from '~/functions/map_focus'
import { getCulturesInViewport, type MapDesiredState } from '~/functions/map_reconciler'
import { GROUPES_CULTURAUX } from '~/functions/cultures_group'
import { useMap } from '~/hooks/use_map'
import { useMapReconciler } from '~/hooks/use_map_reconciler'
import MapErrorBoundary from './map-error-boundary'
import MillesimeSelect from './millesime-select'
import { renderPopupParcelle } from './popup-parcelle'
import { BASE_MAPS, BASE_MAP_OPTIONS, type BaseMapId } from './styles/base_maps'
import {
  getFocusGlowPaint,
  PARCELLES_FILL_LAYER_ID,
  PARCELLES_FOCUS_GLOW_LAYER_ID,
  PARCELLES_MIN_ZOOM,
  readParcelleAgricole,
} from './styles/parcelles-agricoles'
import 'maplibre-gl/dist/maplibre-gl.css'
import { Select } from '@codegouvfr/react-dsfr/Select'
import Loader from '~/ui/Loader'
import { fr } from '@codegouvfr/react-dsfr'

export type { AacEmprise, Bbox } from '~/functions/map_focus'

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
/** Zoom sur une parcelle mise en avant : la mise en avant cesse dès qu'on dézoome en deçà. */
const FOCUS_ZOOM = 15
/** Durée d'une pulsation du halo de la parcelle mise en avant, en millisecondes. */
const FOCUS_PULSE_PERIOD = 1600
/** Nombre de pulsations avant que le halo se fige, pour ne pas redessiner la carte sans fin. */
const FOCUS_PULSE_COUNT = 3

/*
 * Cadre une emprise sans descendre sous le zoom d'affichage des parcelles : une emprise trop
 * étendue est alors centrée, quitte à en couper les bords (les AAC mises en valeur restent
 * repérables à leur fond coloré).
 */
function fitBboxShowingParcelles(map: MaplibreMap, bbox: Bbox, duration: number) {
  const camera = map.cameraForBounds(bbox, { padding: BOUNDS_PADDING })
  if (!camera) return
  map.easeTo({
    center: camera.center,
    zoom: Math.max(camera.zoom ?? PARCELLES_MIN_ZOOM, PARCELLES_MIN_ZOOM),
    duration,
  })
}

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
  /** Vue à l'ouverture de la carte (voir `pickInitialMapView`), à défaut la France entière. */
  initialView?: InitialMapView
  /** Codes des AAC mises en valeur par un fond coloré. */
  highlightedAacCodes?: string[]
  /**
   * Parcelle entourée d'un halo sans déplacer la carte, par exemple celle à l'origine d'une
   * proposition. Le halo de `focusParcelle` passe devant.
   */
  markedParcelleId?: string | null
  layers?: ParcellesMapLayers
  baseMap?: BaseMapId
  onBaseMapChange?: (baseMap: BaseMapId) => void
}

export type ParcellesSelectionMapHandle = {
  /** Zoome sur la parcelle et l'entoure d'un halo, jusqu'à ce qu'elle sorte du cadre. */
  focusParcelle: (parcelle: SelectedParcelle) => void
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
    initialView,
    highlightedAacCodes = EMPTY_IDS,
    markedParcelleId = null,
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
  // Le sélecteur ne nomme une AAC que tant que l'utilisateur n'a pas déplacé la carte
  const [displayedAacId, setDisplayedAacId] = useState(initialView?.aacId ?? '')
  const selectedParcelleIdsRef = useRef<string[]>(selectedParcelleIds)
  const unavailableParcelleIdsRef = useRef<string[]>(unavailableParcelleIds)
  const layersRef = useRef(layers)
  const isReadOnly = !onParcelleToggle
  const culturesInViewportPendingRef = useRef(true)
  const currentParcelleIdRef = useRef<string | null>(null)
  const [focusedParcelleId, setFocusedParcelleId] = useState<string | null>(null)
  const haloParcelleId = focusedParcelleId ?? markedParcelleId
  // Lu par l'écouteur `moveend`, posé une fois pour toutes à la création de la carte
  const focusedCentroidRef = useRef<[number, number] | null>(null)
  const parcellePopupRef = useRef<Popup>(
    new Popup({ closeButton: false, offset: 10, className: 'custom-popup' })
  )

  selectedParcelleIdsRef.current = selectedParcelleIds
  unavailableParcelleIdsRef.current = unavailableParcelleIds
  layersRef.current = layers

  const clearFocus = () => {
    focusedCentroidRef.current = null
    setFocusedParcelleId(null)
  }

  const { mapContainerRef, mapRef, map } = useMap(
    {
      style: BASE_MAPS[baseMap].style,
      ...(initialView?.bbox
        ? {
            bounds: initialView.bbox,
            fitBoundsOptions: { padding: BOUNDS_PADDING },
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
      if (initialView?.bbox) {
        fitBboxShowingParcelles(createdMap, initialView.bbox, 0)
      }

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
        const focusedCentroid = focusedCentroidRef.current
        if (
          focusedCentroid &&
          (createdMap.getZoom() < FOCUS_ZOOM - 0.01 ||
            !createdMap.getBounds().contains(focusedCentroid))
        ) {
          clearFocus()
        }
      })
      // Seuls les déplacements de l'utilisateur portent un `originalEvent`, pas les zooms programmés
      createdMap.on('movestart', (event) => {
        if (event.originalEvent) setDisplayedAacId('')
      })
    }
  )

  const { rpgPmtilesUrl } = usePage().props

  const desiredMapState: MapDesiredState = useMemo(
    () => ({
      pmtilesUrl,
      rpgPmtilesUrl,
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
      focusedParcelleId: haloParcelleId,
      highlightedAacCodes,
    }),
    [
      pmtilesUrl,
      rpgPmtilesUrl,
      millesime,
      layers,
      selectedParcelleIds,
      unavailableParcelleIds,
      haloParcelleId,
      highlightedAacCodes,
    ]
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

  // Fait pulser le halo de la parcelle mise en avant, sauf si l'utilisateur limite les animations
  useEffect(() => {
    if (!map || !haloParcelleId) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const applyGlow = (phase: number) => {
      if (!map.getLayer(PARCELLES_FOCUS_GLOW_LAYER_ID)) return
      const paint = getFocusGlowPaint(phase)
      map.setPaintProperty(PARCELLES_FOCUS_GLOW_LAYER_ID, 'line-width', paint['line-width'])
      map.setPaintProperty(PARCELLES_FOCUS_GLOW_LAYER_ID, 'line-blur', paint['line-blur'])
      map.setPaintProperty(PARCELLES_FOCUS_GLOW_LAYER_ID, 'line-opacity', paint['line-opacity'])
    }

    let start: number | null = null
    let frame = requestAnimationFrame(function pulse(time) {
      start ??= time
      const elapsed = time - start
      if (elapsed >= FOCUS_PULSE_COUNT * FOCUS_PULSE_PERIOD) {
        // Figé au repos, halo resserré, comme à la création de la couche
        applyGlow(0)
        return
      }
      // Le halo s'étale puis se resserre, sans à-coup entre deux pulsations
      applyGlow((1 - Math.cos((2 * Math.PI * elapsed) / FOCUS_PULSE_PERIOD)) / 2)
      frame = requestAnimationFrame(pulse)
    })

    return () => cancelAnimationFrame(frame)
  }, [map, haloParcelleId])

  useEffect(() => {
    parcellePopupRef.current.remove()
    currentParcelleIdRef.current = null
    culturesInViewportPendingRef.current = true
    // Les identifiants des parcelles changent d'un millésime à l'autre
    clearFocus()
  }, [millesime])

  const handleParcelleMouseMove = useCallback(
    (e: MapLayerMouseEvent) => {
      if (!mapRef.current) return
      const feature = e.features?.[0]
      const parcelle = feature ? readParcelleAgricole(feature) : null
      if (!parcelle) return
      const id = parcelle.rpgId
      const isUnavailable = unavailableParcelleIdsRef.current.includes(id)

      if (currentParcelleIdRef.current !== id) {
        const popupContent = renderPopupParcelle(
          parcelle.cultureCode ?? undefined,
          String(parcelle.surface ?? ''),
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
      const parcelle = feature ? readParcelleAgricole(feature) : null
      if (!onParcelleToggle || !feature || !parcelle) return

      if (unavailableParcelleIdsRef.current.includes(parcelle.rpgId)) return

      onParcelleToggle({
        rpgId: parcelle.rpgId,
        surface: parcelle.surface,
        cultureCode: parcelle.cultureCode,
        centroid: getCentroid(feature.geometry),
      })

      // Dismiss popup so it refreshes on next mousemove with updated selection state
      parcellePopupRef.current.remove()
      currentParcelleIdRef.current = null
      // La sélection se modifie sur la carte : la mise en avant masquerait le résultat du clic
      clearFocus()
    },
    [onParcelleToggle]
  )

  useImperativeHandle(ref, () => ({
    focusParcelle({ rpgId, centroid }: SelectedParcelle) {
      if (!mapRef.current || !centroid) return
      const center: [number, number] = [centroid.x, centroid.y]
      // Le vol interrompt un éventuel déplacement en cours, dont le `moveend` lèverait sinon le
      // nouveau focus : il n'est posé qu'une fois le vol lancé.
      mapRef.current.flyTo({ center, zoom: FOCUS_ZOOM, duration: 800 })
      focusedCentroidRef.current = center
      setFocusedParcelleId(rpgId)
    },
    getBounds() {
      const bounds = mapRef.current?.getBounds()
      return bounds && [bounds.getWest(), bounds.getSouth(), bounds.getEast(), bounds.getNorth()]
    },
  }))

  const handleAacChange = (aacId: string) => {
    const aac = aacs.find((item) => item.id === aacId)
    if (aac) {
      if (mapRef.current) fitBboxShowingParcelles(mapRef.current, aac.bbox, 800)
      setDisplayedAacId(aacId)
    }
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
      mapRef.current?.on(event as any, PARCELLES_FILL_LAYER_ID, handler)
    })

    return () => {
      events.forEach(({ event, handler }) => {
        mapRef.current?.off(event as any, PARCELLES_FILL_LAYER_ID, handler)
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
                'value': displayedAacId,
                'aria-label': 'Zoomer sur une AAC',
                'onChange': (e) => handleAacChange(e.target.value),
              }}
            >
              <option value="" disabled>
                Zoomer sur une AAC…
              </option>
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
