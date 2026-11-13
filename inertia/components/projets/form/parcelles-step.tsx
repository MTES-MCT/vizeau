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
  getParcelleExploitations,
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

  const parcelleExploitations = useMemo(
    () => getParcelleExploitations(projectExploitations, millesime),
    [projectExploitations, millesime]
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
        parcelles: toggleParcelle(prev.parcelles, parcelle, parcelleExploitations),
      }))
    },
    [setData, parcelleExploitations]
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
    <div className="flex flex-wrap gap-5 min-h-[560px]">
      {/* Carte à gauche */}
      <div className="flex flex-col flex-1 min-w-[410px] h-[560px]">
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

      {/* Panneau à droite, de la hauteur de la carte : seule la liste des parcelles défile */}
      <div className="flex-1 flex flex-col gap-5 min-w-[410px] h-[560px]">
        <ParcellesPanel
          parcelles={data.parcelles}
          projectExploitations={projectExploitations}
          parcelleExploitations={parcelleExploitations}
          onParcellesChange={(parcelles) => setData((prev) => ({ ...prev, parcelles }))}
          onParcelleClick={(parcelle) =>
            parcelle.centroid && mapRef.current?.flyTo(parcelle.centroid)
          }
        />
      </div>
    </div>
  )
}
