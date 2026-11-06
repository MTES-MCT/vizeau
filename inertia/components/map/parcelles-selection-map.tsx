import {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { Popup, ScaleControl } from 'maplibre-gl'
import type { MapLayerMouseEvent } from 'maplibre-gl'
import { setParcellesHighlight, getCentroid, RPG_YEARS } from '~/functions/map'
import type { MapDesiredState } from '~/functions/map_reconciler'
import { useMap } from '~/hooks/use_map'
import { useMapReconciler } from '~/hooks/use_map_reconciler'
import { GROUPES_CULTURAUX } from '~/functions/cultures_group'
import MapErrorBoundary from './map-error-boundary'
import PopupParcelle from './popup-parcelle'
import { resolveCommune } from '~/hooks/use_commune_names'
import { showUnavailableParcelleToast } from '~/functions/parcelles_toasts'
import 'maplibre-gl/dist/maplibre-gl.css'
import vector from '~/components/map/styles/vector.json'
import { Select } from '@codegouvfr/react-dsfr/Select'
import Loader from '~/ui/Loader'
import { fr } from '@codegouvfr/react-dsfr'

/** Durée de survol d'une parcelle avant de chercher sa commune. */
const COMMUNE_HOVER_DELAY_MS = 300

/** Nombre de chargements de la carte à attendre avant de renoncer à trouver une parcelle. */
const FOCUS_MAX_IDLE_ATTEMPTS = 5

/** Every culture group is visible: the selection map does not filter parcelles by culture. */
const ALL_CULTURE_CODES = Object.keys(GROUPES_CULTURAUX)

// Référence stable : un tableau recréé à chaque rendu relancerait la réconciliation de la carte.
const EMPTY_IDS: string[] = []

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
  /** Parcelles rattachées à une autre exploitation : grisées et non sélectionnables. */
  unavailableParcelleIds?: string[]
  onParcelleToggle: (parcelle: SelectedParcelle) => void
  handleMillesimeChange: (newMillesime: string) => void
  initialBbox?: [number, number, number, number]
  /** Point sur lequel centrer la carte à l'ouverture, prioritaire sur `initialBbox`. */
  initialCenter?: { x: number; y: number }
  /** Recherche du PACAGE de la parcelle survolée, affiché dans la popup une fois connu. */
  getParcellePacage?: (rpgId: string) => Promise<string | null>
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
    unavailableParcelleIds = EMPTY_IDS,
    onParcelleToggle,
    handleMillesimeChange,
    initialBbox,
    initialCenter,
    getParcellePacage,
  }: ParcellesSelectionMapProps,
  ref: React.Ref<ParcellesSelectionMapHandle>
) {
  const [isMapLoading, setIsMapLoading] = useState(true)
  const selectedParcelleIdsRef = useRef<string[]>(selectedParcelleIds)
  const unavailableParcelleIdsRef = useRef<string[]>(unavailableParcelleIds)
  const currentParcelleIdRef = useRef<string | null>(null)
  const parcellePopupRef = useRef<Popup>(
    new Popup({ closeButton: false, offset: 10, maxWidth: 'none', className: 'custom-popup' })
  )
  const initialBboxRef = useRef<[number, number, number, number] | undefined>(initialBbox)
  const initialCenterRef = useRef<{ x: number; y: number } | undefined>(initialCenter)
  // Une seule racine React pour le contenu de la popup, redessinée à chaque survol plutôt que recréée.
  const popupContainerRef = useRef<HTMLDivElement | null>(null)
  const popupRootRef = useRef<Root | null>(null)
  // Écouteur de la recherche de parcelle en cours, à retirer avant d'en lancer une autre.
  const cancelPendingFocusRef = useRef<(() => void) | null>(null)

  useEffect(
    () => () => {
      // Démontage différé : React refuse qu'une racine soit démontée pendant un rendu.
      const root = popupRootRef.current
      popupRootRef.current = null
      popupContainerRef.current = null
      setTimeout(() => root?.unmount())
    },
    []
  )

  // Keep ref in sync for use in stable callbacks
  useEffect(() => {
    selectedParcelleIdsRef.current = selectedParcelleIds
  }, [selectedParcelleIds])

  useEffect(() => {
    unavailableParcelleIdsRef.current = unavailableParcelleIds
  }, [unavailableParcelleIds])

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
        createdMap.addControl(new ScaleControl({ maxWidth: 100, unit: 'metric' }), 'bottom-left')

        // Center on the provided point, or else on the territoire bbox, when available
        if (initialCenterRef.current) {
          const { x, y } = initialCenterRef.current
          createdMap.jumpTo({ center: [x, y], zoom: 14 })
        } else if (initialBboxRef.current) {
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
      unavailableParcelleIds,
    }),
    [pmtilesUrl, millesime, selectedParcelleIds, unavailableParcelleIds]
  )

  useMapReconciler(map, desiredMapState)

  const handleParcelleMouseMove = useCallback(
    (e: MapLayerMouseEvent) => {
      if (!mapRef.current) return
      const props = e.features?.[0]?.properties
      if (!props) return
      const id = String(props['id_parcel'])

      if (currentParcelleIdRef.current !== id) {
        const bioFeatures = mapRef.current.queryRenderedFeatures(e.point, {
          layers: ['parcellesbio-fill'],
        })
        const isBio = bioFeatures.length > 0
        const isOwnParcelle = selectedParcelleIdsRef.current.includes(id)
        const isUnavailable = unavailableParcelleIdsRef.current.includes(id)
        // PACAGE et commune arrivent indépendamment : la popup est redessinée à chaque réponse.
        let pacage: string | null | undefined
        let commune: string | null | undefined
        const renderPopup = () =>
          popupRootRef.current?.render(
            <PopupParcelle
              cultureCode={props['code_cultu']}
              surfParc={String(props['surf_parc'] ?? '')}
              millesime={millesime}
              isParcelleUnavailable={isUnavailable}
              isBio={isBio}
              isEditMode
              isOwnParcelle={isOwnParcelle}
              pacage={pacage}
              commune={commune}
            />
          )
        // La souris a pu quitter la parcelle avant la réponse.
        const refreshPopup = () => {
          if (currentParcelleIdRef.current === id) renderPopup()
        }
        popupContainerRef.current ??= document.createElement('div')
        popupRootRef.current ??= createRoot(popupContainerRef.current)
        renderPopup()
        parcellePopupRef.current
          .setLngLat(e.lngLat)
          .setDOMContent(popupContainerRef.current)
          .addTo(mapRef.current)
        getParcellePacage?.(id).then((result) => {
          pacage = result
          refreshPopup()
        })
        const centroid = e.features?.[0] && getCentroid(e.features[0].geometry)
        if (centroid) {
          // Simple survol en passant : la commune n'est cherchée que si la souris s'attarde.
          setTimeout(() => {
            if (currentParcelleIdRef.current !== id) return
            resolveCommune(centroid).then((result) => {
              commune = result
              refreshPopup()
            })
          }, COMMUNE_HOVER_DELAY_MS)
        }
        currentParcelleIdRef.current = id
      } else {
        parcellePopupRef.current.setLngLat(e.lngLat)
      }
      mapRef.current.getCanvas().style.cursor = 'pointer'
    },
    [millesime, getParcellePacage]
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

      const id = String(feature.properties['id_parcel'])
      if (unavailableParcelleIdsRef.current.includes(id)) {
        showUnavailableParcelleToast()
        return
      }
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

      // Seule la dernière parcelle demandée compte : la carte ne doit pas repartir
      // vers une précédente dont la tuile finirait de charger après coup.
      cancelPendingFocusRef.current?.()
      cancelPendingFocusRef.current = null

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
      let attempts = 0
      const onIdle = () => {
        attempts += 1
        if (locate() || attempts >= FOCUS_MAX_IDLE_ATTEMPTS) {
          map.off('idle', onIdle)
          cancelPendingFocusRef.current = null
        }
      }
      map.on('idle', onIdle)
      cancelPendingFocusRef.current = () => map.off('idle', onIdle)
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
