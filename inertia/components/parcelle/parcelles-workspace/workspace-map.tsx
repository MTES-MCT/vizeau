import { Ref, useMemo, useState } from 'react'

import ParcellesSelectionMap, {
  AacEmprise,
  ParcelleOwner,
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
  /** Un clic ouvre la parcelle, Maj+clic l'ajoute ou la retire. */
  onParcelleOpen?: (parcelle: SelectedParcelle) => void
  focusedParcelleId?: string
  relatedParcelleIds?: string[]
  /** Couleur des parcelles par exploitation, à la place de celle des cultures. */
  parcelleColors?: Record<string, string> | null
  /** Exploitation de certaines parcelles, montrée au survol avec toutes ses parcelles. */
  parcelleOwners?: Map<string, ParcelleOwner> | null
  aacs: AacEmprise[]
  /** Contexte de l'écran appelant : choisit la vue à l'ouverture et les AAC mises en valeur. */
  focus: MapFocusContext
  layers: ParcellesMapLayers
  baseMap?: BaseMapId
  onBaseMapChange?: (baseMap: BaseMapId) => void
}

export default function WorkspaceMap({
  mapRef,
  millesime,
  isMillesimeLoading,
  onMillesimeChange,
  aacs,
  focus,
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
    </div>
  )
}
