import { Ref, useState } from 'react'

import ParcellesSelectionMap, {
  AacEmprise,
  Bbox,
  ParcellesMapLayers,
  ParcellesSelectionMapHandle,
  SelectedParcelle,
} from '~/components/map/parcelles-selection-map'
import type { BaseMapId } from '~/components/map/styles/base_maps'
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
  initialBbox?: Bbox
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
  ...mapProps
}: WorkspaceMapProps) {
  const [selectedAacId, setSelectedAacId] = useState(aacs[0]?.id)

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
        selectedAacId={selectedAacId}
        onAacChange={setSelectedAacId}
      />
    </div>
  )
}
