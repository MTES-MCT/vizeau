import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import maplibre from 'maplibre-gl'
import { Protocol } from 'pmtiles'
import { setParcellesHighlight, getCentroid, RPG_YEARS } from '~/functions/map'
import type { MapDesiredState } from '~/functions/map_reconciler'
import { useMap } from '~/hooks/use_map'
import { useMapReconciler } from '~/hooks/use_map_reconciler'
import { GROUPES_CULTURAUX } from '~/functions/cultures-group'
import { MapErrorBoundary } from './map-error-boundary'
import { renderPopupParcelle } from './popup-parcelle'
import 'maplibre-gl/dist/maplibre-gl.css'
import vector from '~/components/map/styles/vector.json'
import { Select } from '@codegouvfr/react-dsfr/Select'
import Loader from '~/ui/Loader'
import { fr } from '@codegouvfr/react-dsfr'

const protocol = new Protocol()
maplibre.addProtocol('pmtiles', protocol.tile)

/** Every culture group is visible: the selection map does not filter parcelles by culture. */
const ALL_CULTURE_CODES = Object.keys(GROUPES_CULTURAUX)

export type SelectedParcelle = {
  rpgId: string
  surface: number | null
  cultureCode: string | null
  centroid: { x: number; y: number } | undefined
  isBio?: boolean
}

type ParcellesSelectionMapProps = {
  pmtilesUrl: string
  millesime: string
  selectedParcelleIds: string[]
  onParcelleToggle: (parcelle: SelectedParcelle) => void
  handleMillesimeChange: (newMillesime: string) => void
  initialBbox?: [number, number, number, number]
}

export type ParcellesSelectionMapHandle = {
  flyTo: (centroid: { x: number; y: number }) => void
  /** Vole vers la parcelle réelle (géométrie issue des tuiles) et la surligne. */
  focusParcelle: (
    id: string,
    fallbackCentroid?: { x: number; y: number },
    onBioResolved?: (isBio: boolean) => void
  ) => void
}

const ParcellesSelectionMapContent = forwardRef<
  ParcellesSelectionMapHandle,
  ParcellesSelectionMapProps
>(function ParcellesSelectionMap(
  {
    pmtilesUrl,
    millesime,
    selectedParcelleIds,
    onParcelleToggle,
    handleMillesimeChange,
    initialBbox,
  }: ParcellesSelectionMapProps,
  ref: React.Ref<ParcellesSelectionMapHandle>
) {
  const [isMapLoading, setIsMapLoading] = useState(true)
  const selectedParcelleIdsRef = useRef<string[]>(selectedParcelleIds)
  const currentParcelleIdRef = useRef<string | null>(null)
  const parcellePopupRef = useRef<maplibre.Popup>(
    new maplibre.Popup({ closeButton: false, offset: 10, className: 'custom-popup' })
  )
  const initialBboxRef = useRef<[number, number, number, number] | undefined>(initialBbox)
  // Keep ref in sync for use in stable callbacks
  useEffect(() => {
    selectedParcelleIdsRef.current = selectedParcelleIds
  }, [selectedParcelleIds])

  const { mapContainerRef, mapRef, map } = useMap(
    {
      style: vector as any,
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
          new maplibre.ScaleControl({ maxWidth: 100, unit: 'metric' }),
          'bottom-left'
        )

        // Center on the provided territoire bbox when available
        if (initialBboxRef.current) {
          createdMap.fitBounds(initialBboxRef.current, { padding: 40, duration: 0 })
        }

        setIsMapLoading(false)
      })

      // Ensures the map is not blocked in loading state after any loading event
      createdMap.on('idle', () => {
        setIsMapLoading(false)
      })
    }
  )

  // Only parcelles are shown here, highlighted by the current selection. The reconciler owns
  // the source, layers, culture filter and feature states, and re-applies them on tile reloads.
  const desiredMapState: MapDesiredState = useMemo(
    () => ({
      pmtilesUrl,
      millesime,
      showParcelles: true,
      showAac: false,
      showPpe: false,
      showPpr: false,
      showCommunes: false,
      showSage: false,
      showBioOnly: false,
      visibleCultures: ALL_CULTURE_CODES,
      highlightedParcelleIds: selectedParcelleIds,
      hoveredParcelleIds: [],
      unavailableParcelleIds: [],
    }),
    [pmtilesUrl, millesime, selectedParcelleIds]
  )

  useMapReconciler(map, desiredMapState)

  const handleParcelleMouseMove = useCallback(
    (e: maplibre.MapLayerMouseEvent) => {
      if (!mapRef.current) return
      const props = e.features?.[0]?.properties
      if (!props) return
      const id = String(props['id_parcel'])

      if (currentParcelleIdRef.current !== id) {
        const bioFeatures = mapRef.current.queryRenderedFeatures(e.point, {
          layers: ['parcellesbio-fill'],
        })
        const popupContent = renderPopupParcelle(
          props['code_cultu'],
          String(props['surf_parc'] ?? ''),
          millesime,
          undefined,
          false,
          bioFeatures.length > 0,
          true,
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
      mapRef.current.getCanvas().style.cursor = 'pointer'
    },
    [millesime]
  )

  const handleParcelleMouseLeave = useCallback(() => {
    if (!mapRef.current) return
    mapRef.current.getCanvas().style.cursor = ''
    parcellePopupRef.current.remove()
    currentParcelleIdRef.current = null
  }, [])

  const handleParcelleClick = useCallback(
    (e: maplibre.MapLayerMouseEvent) => {
      if (!mapRef.current) return
      const feature = e.features?.[0]
      if (!feature?.properties) return

      const id = String(feature.properties['id_parcel'])
      const isSelected = selectedParcelleIdsRef.current.includes(id)

      // Immediately reflect highlight before state update propagates
      setParcellesHighlight(mapRef.current, [id], !isSelected)

      const bioFeatures = mapRef.current.queryRenderedFeatures(e.point, {
        layers: ['parcellesbio-fill'],
      })

      onParcelleToggle({
        rpgId: id,
        surface:
          feature.properties['surf_parc'] != null
            ? parseFloat(feature.properties['surf_parc'])
            : null,
        cultureCode: feature.properties['code_cultu'] ?? null,
        centroid: getCentroid(feature.geometry),
        isBio: bioFeatures.length > 0,
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
    focusParcelle(
      id: string,
      fallbackCentroid?: { x: number; y: number },
      onBioResolved?: (isBio: boolean) => void
    ) {
      const map = mapRef.current
      if (!map) return
      const target = String(id)

      const checkBio = () => {
        if (!onBioResolved) return
        const bioFeatures = map
          .querySourceFeatures('parcelles', { sourceLayer: 'parcellesbio' })
          .filter(
            (feature) =>
              String(feature.id) === target || String(feature.properties?.id_parcel) === target
          )
        onBioResolved(bioFeatures.length > 0)
      }

      // Ne surligne que si la parcelle est toujours sélectionnée : le surlignage
      // reste piloté par la sélection, jamais par le simple recentrage.
      const isSelected = () => selectedParcelleIdsRef.current.includes(target)

      // Cherche la parcelle dans les tuiles chargées (id_parcel === rpgId côté DB),
      // centre dessus au zoom 15 et la surligne. Renvoie false si pas encore chargée.
      const locate = (): boolean => {
        const feature = map
          .querySourceFeatures('parcelles', { sourceLayer: 'parcelles' })
          .find(
            (candidate) =>
              String(candidate.id) === target || String(candidate.properties?.id_parcel) === target
          )
        const geometry = feature?.geometry
        const centroid = geometry ? getCentroid(geometry) : undefined
        if (!centroid) return false
        map.flyTo({ center: [centroid.x, centroid.y], zoom: 15, duration: 800 })
        setParcellesHighlight(map, [target], isSelected())
        checkBio()
        return true
      }

      // Surligne d'emblée : l'effet s'applique dès que la tuile est chargée.
      setParcellesHighlight(map, [target], isSelected())

      if (locate()) return

      // Parcelle hors des tuiles chargées : à défaut, vole vers le centroïde fourni
      // pour déclencher le chargement, puis réessaie à chaque tuile chargée.
      if (fallbackCentroid) {
        map.flyTo({ center: [fallbackCentroid.x, fallbackCentroid.y], zoom: 15, duration: 800 })
      }
      const onData = () => {
        if (locate()) map.off('idle', onData)
      }
      map.on('idle', onData)
    },
  }))

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
    <div className="flex flex-col h-full w-full relative">
      {isMapLoading && (
        <div className="flex absolute left-0 right-0 top-0 bottom-0 items-center justify-center">
          <Loader size="lg" />
        </div>
      )}
      <div ref={mapContainerRef} className="flex justify-between h-full w-full editing-glow" />

      <div
        className="absolute left-0 right-0 top-0 fr-text--sm flex items-center fr-px-6v fr-py-1v shadow-md"
        style={{
          backgroundColor: fr.colors.decisions.background.contrast.info.default,
          color: fr.colors.decisions.text.default.info.default,
        }}
      >
        <div className="flex gap-1 w-full justify-center">
          <span className="fr-icon-edit-line fr-icon--md fr-mr-1v" aria-hidden="true" />
          Cliquez sur une parcelle pour la sélectionner ou la désélectionner
        </div>
        <Select
          label=""
          className="w-40"
          nativeSelectProps={{
            value: millesime,
            onChange: (e) => handleMillesimeChange(e.target.value),
          }}
        >
          {RPG_YEARS.map((m) => (
            <option key={m} value={m}>
              RPG {m}
            </option>
          ))}
        </Select>
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
