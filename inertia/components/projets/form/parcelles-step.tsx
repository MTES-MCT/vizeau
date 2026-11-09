import { useCallback, useMemo, useRef, useState } from 'react'
import { usePage } from '@inertiajs/react'

import ParcellesSelectionMap, {
  SelectedParcelle,
  ParcellesSelectionMapHandle,
  AacEmprise,
  Bbox,
} from '~/components/map/parcelles-selection-map'
import type { ProjetFormData, ProjetFormPageProps } from './projet-form'
import {
  getProjectExploitations,
  getSelectedParcelles,
  toggleParcelle,
} from '~/functions/projet_parcelles'
import ParcellesPanel from './parcelles-panel'

type ParcellesStepProps = {
  data: ProjetFormData
  setData: React.Dispatch<React.SetStateAction<ProjetFormData>>
}

export default function ParcellesStep({ data, setData }: ParcellesStepProps) {
  const mapRef = useRef<ParcellesSelectionMapHandle>(null)
  const { pmtilesUrl, exploitations, aacs } = usePage<ProjetFormPageProps>().props
  // Seules les AAC dont l'emprise est connue permettent de centrer la carte
  const aacEmprises = useMemo<AacEmprise[]>(
    () =>
      aacs.flatMap((aac) =>
        aac.bbox
          ? [{ id: aac.id, label: aac.name ?? aac.code ?? aac.id, bbox: aac.bbox as Bbox }]
          : []
      ),
    [aacs]
  )
  // Première AAC par défaut ; conservée au changement de millésime, qui recrée la carte
  const [selectedAacId, setSelectedAacId] = useState(aacEmprises[0]?.id)
  const [areMapOptionsVisible, setAreMapOptionsVisible] = useState(true)

  const { millesime } = data.parcelles

  const projectExploitations = useMemo(
    () => getProjectExploitations(exploitations, data.exploitations),
    [exploitations, data.exploitations]
  )

  const selectedParcelles = useMemo(() => getSelectedParcelles(data.parcelles), [data.parcelles])

  const selectedParcelleIds = useMemo(
    () => selectedParcelles.map((p) => p.rpgId),
    [selectedParcelles]
  )

  const handleParcelleToggle = useCallback(
    (parcelle: SelectedParcelle) => {
      setData((prev) => ({
        ...prev,
        parcelles: toggleParcelle(prev.parcelles, parcelle, projectExploitations),
      }))
    },
    [setData, projectExploitations]
  )

  const handleMillesimeChange = (newMillesime: string) => {
    // Just change millesime without clearing selections
    // User can explore different years while keeping their selections
    setData((prev) => ({
      ...prev,
      parcelles: { ...prev.parcelles, millesime: newMillesime },
    }))
  }

  return (
    <div className="flex gap-4 min-h-[560px] flex-wrap">
      {/* Map panel */}
      <div className="flex flex-col gap-2 flex-2 min-w-[400px] min-h-[560px]">
        <div className="h-full">
          <ParcellesSelectionMap
            ref={mapRef}
            key={millesime}
            pmtilesUrl={pmtilesUrl}
            millesime={millesime}
            selectedParcelleIds={selectedParcelleIds}
            onParcelleToggle={handleParcelleToggle}
            handleMillesimeChange={handleMillesimeChange}
            aacs={aacEmprises}
            selectedAacId={selectedAacId}
            onAacChange={setSelectedAacId}
            areOptionsVisible={areMapOptionsVisible}
            onOptionsVisibleChange={setAreMapOptionsVisible}
          />
        </div>

        {selectedParcelles.length > 0 && (
          <p className="fr-text--sm fr-mb-0">
            <b>{selectedParcelles.length}</b> parcelle{selectedParcelles.length > 1 ? 's' : ''}{' '}
            sélectionnée{selectedParcelles.length > 1 ? 's' : ''} —{' '}
            {selectedParcelles.reduce((sum, p) => sum + (p.surface ?? 0), 0).toFixed(2)} ha au total
          </p>
        )}
      </div>

      {/* Parcelles sidebar */}
      <div className="flex-1">
        <ParcellesPanel
          parcelles={data.parcelles}
          projectExploitations={projectExploitations}
          onParcelleClick={(parcelle) =>
            parcelle.centroid && mapRef.current?.flyTo(parcelle.centroid)
          }
        />
      </div>
    </div>
  )
}
