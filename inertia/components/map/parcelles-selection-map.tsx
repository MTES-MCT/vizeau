import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { Popup, ScaleControl } from 'maplibre-gl'
import type { AddLayerObject, MapLayerMouseEvent } from 'maplibre-gl'
import { getParcellesLayers, getParcellesSource } from './styles/parcelles'
import { setParcellesHighlight, getCentroid, RPG_YEARS } from '~/functions/map'
import { useMap } from '~/hooks/use_map'
import MapErrorBoundary from './map-error-boundary'
import { renderPopupParcelle } from './popup-parcelle'
import 'maplibre-gl/dist/maplibre-gl.css'
import vector from '~/components/map/styles/vector.json'
import { Select } from '@codegouvfr/react-dsfr/Select'
import { Button } from '@codegouvfr/react-dsfr/Button'
import Loader from '~/ui/Loader'
import { fr } from '@codegouvfr/react-dsfr'

export type Bbox = [number, number, number, number]

export type AacEmprise = {
  id: string
  label: string
  bbox: Bbox
}

const BOUNDS_PADDING = 40

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
  onParcelleToggle: (parcelle: SelectedParcelle) => void
  handleMillesimeChange: (newMillesime: string) => void
  /** AAC sur lesquelles centrer la carte : un sélecteur s'affiche s'il y en a plusieurs. */
  aacs?: AacEmprise[]
  /** AAC affichée à l'ouverture de la carte, à défaut la France entière. */
  selectedAacId?: string
  onAacChange?: (aacId: string) => void
  /** Affichage des sélecteurs du bandeau, contrôlé par le parent car la carte est recréée au changement de millésime. */
  areOptionsVisible: boolean
  onOptionsVisibleChange: (visible: boolean) => void
}

export type ParcellesSelectionMapHandle = {
  flyTo: (centroid: { x: number; y: number }) => void
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
    aacs = [],
    selectedAacId,
    onAacChange,
    areOptionsVisible,
    onOptionsVisibleChange,
  }: ParcellesSelectionMapProps,
  ref: React.Ref<ParcellesSelectionMapHandle>
) {
  const [isMapLoading, setIsMapLoading] = useState(true)
  const initialBbox = aacs.find((aac) => aac.id === selectedAacId)?.bbox
  const selectedParcelleIdsRef = useRef<string[]>(selectedParcelleIds)
  const previousSelectedRef = useRef<Set<string>>(new Set())
  const currentParcelleIdRef = useRef<string | null>(null)
  const parcellePopupRef = useRef<Popup>(
    new Popup({ closeButton: false, offset: 10, className: 'custom-popup' })
  )

  // Keep ref in sync for use in stable callbacks
  useEffect(() => {
    selectedParcelleIdsRef.current = selectedParcelleIds
  }, [selectedParcelleIds])

  // Sync highlights when selectedParcelleIds changes
  useEffect(() => {
    const currentSet = new Set(selectedParcelleIds)
    const prevSet = previousSelectedRef.current

    for (const id of currentSet) {
      if (!prevSet.has(id)) {
        setParcellesHighlight(mapRef.current, [id], true)
      }
    }
    for (const id of prevSet) {
      if (!currentSet.has(id)) {
        setParcellesHighlight(mapRef.current, [id], false)
      }
    }
    previousSelectedRef.current = currentSet
  }, [selectedParcelleIds])

  const { mapContainerRef, mapRef } = useMap(
    {
      style: vector as any,
      ...(initialBbox
        ? { bounds: initialBbox, fitBoundsOptions: { padding: BOUNDS_PADDING } }
        : { center: [2.24, 46.54], zoom: 5 }),
      maxZoom: 17.5,
      trackResize: true,
      attributionControl: { compact: true },
      dragRotate: false,
      pitchWithRotate: false,
      touchZoomRotate: false,
    },
    (map) => {
      map.on('load', () => {
        map.addSource('parcelles', getParcellesSource({ pmtilesUrl, millesime }))
        map.addControl(new ScaleControl({ maxWidth: 100, unit: 'metric' }), 'bottom-left')
        const beforeId = map.getLayer('water-name-lakeline') ? 'water-name-lakeline' : undefined
        getParcellesLayers().forEach((layer) => {
          if (!map.getLayer(layer.id)) {
            map.addLayer(layer as AddLayerObject, beforeId)
          }
        })

        // Highlight already-selected parcelles after the map loads
        if (selectedParcelleIdsRef.current.length > 0) {
          setParcellesHighlight(map, selectedParcelleIdsRef.current, true)
        }

        setIsMapLoading(false)
      })

      // Ensures the map is not blocked in loading state after any loading event
      map.on('idle', () => {
        setIsMapLoading(false)
      })
    }
  )

  const handleParcelleMouseMove = useCallback(
    (e: MapLayerMouseEvent) => {
      if (!mapRef.current) return
      const props = e.features?.[0]?.properties
      if (!props) return
      const id = props['id_parcel']

      if (currentParcelleIdRef.current !== id) {
        const popupContent = renderPopupParcelle(
          props['code_cultu'],
          String(props['surf_parc'] ?? ''),
          millesime,
          undefined,
          false,
          false,
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
    (e: MapLayerMouseEvent) => {
      if (!mapRef.current) return
      const feature = e.features?.[0]
      if (!feature?.properties) return

      const id = feature.properties['id_parcel']
      const isSelected = selectedParcelleIdsRef.current.includes(id)

      // Immediately reflect highlight before state update propagates
      setParcellesHighlight(mapRef.current, [id], !isSelected)

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
  }))

  const handleAacChange = (aacId: string) => {
    const aac = aacs.find((item) => item.id === aacId)
    if (aac) {
      mapRef.current?.fitBounds(aac.bbox, { padding: BOUNDS_PADDING, duration: 800 })
    }
    onAacChange?.(aacId)
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

  const hasAacSelector = aacs.length > 1

  const millesimeSelect = (
    <Select
      label=""
      className="fr-mb-0 w-40"
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
  )

  return (
    <div className="flex flex-col h-full w-full relative">
      {isMapLoading && (
        <div className="flex absolute left-0 right-0 top-0 bottom-0 items-center justify-center">
          <Loader size="lg" />
        </div>
      )}
      <div ref={mapContainerRef} className="flex justify-between h-full w-full editing-glow" />

      <div
        className="absolute left-0 right-0 top-0 fr-text--sm fr-p-2v shadow-md"
        style={{
          backgroundColor: fr.colors.decisions.background.contrast.info.default,
          color: fr.colors.decisions.text.default.info.default,
        }}
      >
        <div className="flex items-center gap-2 justify-between">
          <div className="flex gap-1 fr-pl-2w justify-center">
            <span className="fr-icon-edit-line fr-icon--md fr-mr-1v" aria-hidden="true" />
            Cliquez sur une parcelle pour la sélectionner ou la désélectionner
          </div>
          {/* Une seule AAC : pas de sélecteur d'AAC, le millésime reste dans le bandeau */}
          {hasAacSelector ? (
            <Button
              type="button"
              priority="tertiary no outline"
              size="small"
              iconId={areOptionsVisible ? 'fr-icon-arrow-up-s-line' : 'fr-icon-arrow-down-s-line'}
              iconPosition="right"
              nativeButtonProps={{
                'aria-expanded': areOptionsVisible,
                'aria-controls': 'parcelles-map-options',
              }}
              onClick={() => onOptionsVisibleChange(!areOptionsVisible)}
            >
              {areOptionsVisible ? 'Masquer les options' : 'Options'}
            </Button>
          ) : (
            millesimeSelect
          )}
        </div>

        {hasAacSelector && areOptionsVisible && (
          <div id="parcelles-map-options" className="flex flex-wrap gap-x-4 fr-pb-2v fr-pt-4v">
            <Select
              label=""
              className="fr-mb-0 flex-1 min-w-48"
              nativeSelectProps={{
                value: selectedAacId,
                onChange: (e) => handleAacChange(e.target.value),
              }}
            >
              {aacs.map((aac) => (
                <option key={aac.id} value={aac.id}>
                  {aac.label}
                </option>
              ))}
            </Select>
            {millesimeSelect}
          </div>
        )}
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
