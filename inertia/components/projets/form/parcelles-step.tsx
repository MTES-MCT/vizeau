import { useCallback, useMemo, useRef } from 'react'
import { usePage } from '@inertiajs/react'
import { InferPageProps } from '@adonisjs/inertia/types'
import ProjectsController from '#controllers/projects_controller'
import ParcellesSelectionMap, {
  SelectedParcelle,
  ParcellesSelectionMapHandle,
} from '~/components/map/parcelles-selection-map'
import SectionCard from '~/ui/SectionCard'
import type { ProjetFormData } from './projet-form'
import type { ExploitationJson } from '../../../../types/models'
import { getCultureByCode } from '~/functions/cultures-group'
import ListItem from '~/ui/ListItem'
import EmptyPlaceholder from '~/ui/EmptyPlaceholder'

type ParcellesStepProps = {
  data: ProjetFormData
  setData: React.Dispatch<React.SetStateAction<ProjetFormData>>
}

export default function ParcellesStep({ data, setData }: ParcellesStepProps) {
  const mapRef = useRef<ParcellesSelectionMapHandle>(null)
  const { pmtilesUrl, exploitations } =
    usePage<InferPageProps<ProjectsController, 'create'>>().props
  const { millesime, items: allSelectedParcelles } = data.parcelles

  const selectedParcelles = useMemo(
    () => allSelectedParcelles.filter((p) => String(p.year) === millesime),
    [allSelectedParcelles, millesime]
  )

  const selectedParcelleIds = useMemo(
    () => selectedParcelles.map((p) => p.rpgId),
    [selectedParcelles]
  )

  const handleParcelleToggle = useCallback(
    (parcelle: SelectedParcelle) => {
      const linkedExploitation = (exploitations as ExploitationJson[]).find((exp) =>
        exp.parcelles?.some((p) => p.year.toString() === millesime && p.rpgId === parcelle.rpgId)
      )
      const linkedParcelle = linkedExploitation?.parcelles?.find(
        (p) => p.year.toString() === millesime && p.rpgId === parcelle.rpgId
      )
      setData((prev) => {
        const exists = prev.parcelles.items.some(
          (p) => p.rpgId === parcelle.rpgId && String(p.year) === millesime
        )
        const items = exists
          ? prev.parcelles.items.filter(
              (p) => !(p.rpgId === parcelle.rpgId && String(p.year) === millesime)
            )
          : [
              ...prev.parcelles.items,
              {
                id: linkedParcelle?.id,
                year: Number(millesime),
                ...parcelle,
                exploitationName: linkedExploitation?.name ?? null,
              },
            ]
        return { ...prev, parcelles: { ...prev.parcelles, items } }
      })
    },
    [setData, exploitations, millesime]
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
        <SectionCard title="Parcelles sélectionnées" icon="fr-icon-map-pin-2-line" size="small">
          {selectedParcelles.length === 0 ? (
            <EmptyPlaceholder
              label="Aucune parcelle associée pour le moment"
              illustrativeIcon="fr-icon-collage-line"
            />
          ) : (
            <ul className="flex flex-col gap-2 fr-mb-0" style={{ listStyle: 'none', padding: 0 }}>
              {selectedParcelles.map((parcelle, index) => {
                return (
                  <li key={parcelle.rpgId} className="cursor-pointer">
                    <ListItem
                      key={parcelle.rpgId}
                      priority={index % 2 === 0 ? 'primary' : 'secondary'}
                      hasBorder
                      variant="compact"
                      title={`Parcelle RPG ${parcelle.rpgId}`}
                      tags={[getCultureByCode(parcelle.cultureCode)]}
                      metas={[
                        {
                          content: `${parcelle?.surface ?? 'Non renseigné'} ha`,
                          iconId: 'fr-icon-ruler-line',
                        },
                        ...(parcelle.exploitationName
                          ? [
                              {
                                content: parcelle.exploitationName,
                                iconId: 'fr-icon-building-line' as const,
                              },
                            ]
                          : []),
                      ]}
                      onClick={
                        parcelle.centroid
                          ? () => mapRef.current?.flyTo(parcelle.centroid!)
                          : undefined
                      }
                    />
                  </li>
                )
              })}
            </ul>
          )}
        </SectionCard>
      </div>
    </div>
  )
}
