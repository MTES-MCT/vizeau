import { ReactNode, Ref, useMemo, useState } from 'react'

import ParcellesSelectionMap, {
  AacEmprise,
  ParcellesMapLayers,
  ParcellesSelectionMapHandle,
  SelectedParcelle,
} from '~/components/map/parcelles-selection-map'
import type { BaseMapId } from '~/components/map/styles/base_maps'
import {
  getHighlightedAacCodes,
  type MapFocusContext,
  pickInitialMapView,
} from '~/functions/map_focus'
import Loader from '~/ui/Loader'

export type WorkspaceMapProps = {
  mapRef: Ref<ParcellesSelectionMapHandle>
  pmtilesUrl: string
  millesime: string
  isMillesimeLoading: boolean
  onMillesimeChange: (millesime: string) => void
  selectedParcelleIds: string[]
  unavailableParcelleIds?: string[]
  onParcelleToggle: (parcelle: SelectedParcelle) => void
  aacs: AacEmprise[]
  /** Contexte de l'écran appelant : choisit la vue à l'ouverture et les AAC mises en valeur. */
  focus: MapFocusContext
  layers: ParcellesMapLayers
  baseMap?: BaseMapId
  onBaseMapChange?: (baseMap: BaseMapId) => void
  /** Parcelle entourée d'un halo, celle à l'origine de l'encart. */
  markedParcelleId?: string | null
  /** Encart posé en bas de la carte, près du geste qui l'a fait apparaître. */
  overlay?: ReactNode
}

export default function WorkspaceMap({
  mapRef,
  millesime,
  isMillesimeLoading,
  onMillesimeChange,
  aacs,
  focus,
  overlay,
  ...mapProps
}: WorkspaceMapProps) {
  // Calculée au montage seulement : la carte ne lit sa vue initiale qu'à sa création
  const [initialView] = useState(() => pickInitialMapView(aacs, focus))
  const { territoireIds } = focus
  const highlightedAacCodes = useMemo(
    () => getHighlightedAacCodes(aacs, { territoireIds }),
    [aacs, territoireIds]
  )

  return (
    <div className="relative flex-1 min-h-0">
      {isMillesimeLoading && (
        <div
          className="absolute inset-0 z-20 flex items-center justify-center bg-white/60"
          aria-live="polite"
        >
          <Loader size="lg" />
          <span className="fr-sr-only">Chargement du RPG {millesime}</span>
        </div>
      )}
      <ParcellesSelectionMap
        ref={mapRef}
        {...mapProps}
        millesime={millesime}
        handleMillesimeChange={onMillesimeChange}
        aacs={aacs}
        initialView={initialView}
        highlightedAacCodes={highlightedAacCodes}
      />
      {/* Toujours rendue pour que les lecteurs d'écran annoncent l'encart à son apparition */}
      <div
        aria-live="polite"
        className="absolute inset-x-0 bottom-8 z-10 flex justify-center px-4 pointer-events-none"
      >
        {overlay && <div className="pointer-events-auto w-full max-w-md">{overlay}</div>}
      </div>
    </div>
  )
}
