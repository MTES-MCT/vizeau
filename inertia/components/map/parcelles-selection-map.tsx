import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import maplibre from 'maplibre-gl'
import { Protocol } from 'pmtiles'
import { getParcellesLayers, getParcellesSource } from './styles/parcelles'
import { setParcellesHighlight, getCentroid } from '~/functions/map'
import { renderPopupParcelle } from './popup-parcelle'
import 'maplibre-gl/dist/maplibre-gl.css'
import vector from '~/components/map/styles/vector.json'
import { Select } from '@codegouvfr/react-dsfr/Select'
import Loader from '~/ui/Loader'
import { fr } from '@codegouvfr/react-dsfr'

const protocol = new Protocol()
maplibre.addProtocol('pmtiles', protocol.tile)

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
}

const RPG = ['2024', '2023', '2022', '2021', '2020']

export type ParcellesSelectionMapHandle = {
  flyTo: (centroid: { x: number; y: number }) => void
}

const ParcellesSelectionMap = forwardRef<ParcellesSelectionMapHandle, ParcellesSelectionMapProps>(
  function ParcellesSelectionMap(
    {
      pmtilesUrl,
      millesime,
      selectedParcelleIds,
      onParcelleToggle,
      handleMillesimeChange,
    }: ParcellesSelectionMapProps,
    ref: React.Ref<ParcellesSelectionMapHandle>
  ) {
    const mapContainerRef = useRef<HTMLDivElement | null>(null)
    const mapRef = useRef<maplibre.Map | null>(null)
    const [isMapLoading, setIsMapLoading] = useState(true)
    const selectedParcelleIdsRef = useRef<string[]>(selectedParcelleIds)
    const previousSelectedRef = useRef<Set<string>>(new Set())
    const currentParcelleIdRef = useRef<string | null>(null)
    const parcellePopupRef = useRef<maplibre.Popup>(
      new maplibre.Popup({ closeButton: false, offset: 10, className: 'custom-popup' })
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

    // Map initialization
    useEffect(() => {
      if (!mapContainerRef.current) return

      const map = new maplibre.Map({
        container: mapContainerRef.current,
        style: vector as any,
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
        map.addSource('parcelles', getParcellesSource({ pmtilesUrl, millesime }))
        map.addControl(new maplibre.ScaleControl({ maxWidth: 100, unit: 'metric' }), 'bottom-left')
        const beforeId = map.getLayer('water-name-lakeline') ? 'water-name-lakeline' : undefined
        getParcellesLayers().forEach((layer) => {
          if (!map.getLayer(layer.id)) {
            map.addLayer(layer as maplibre.AddLayerObject, beforeId)
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

      mapRef.current = map

      return () => {
        map.remove()
      }
    }, [])

    const handleParcelleMouseMove = useCallback(
      (e: maplibre.MapLayerMouseEvent) => {
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
      (e: maplibre.MapLayerMouseEvent) => {
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
            {RPG.map((m) => (
              <option key={m} value={m}>
                RPG {m}
              </option>
            ))}
          </Select>
        </div>
      </div>
    )
  }
)

export default ParcellesSelectionMap
