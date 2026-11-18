import { useMemo, useState } from 'react'
import { Button } from '@codegouvfr/react-dsfr/Button'

import ParcellesSelectionMap, {
  AacEmprise,
  Bbox,
  DEFAULT_LAYERS,
  ParcellesMapLayers,
  SelectedParcelle,
} from '~/components/map/parcelles-selection-map'
import {
  formatSurface,
  getCulturesSegments,
  plural,
} from '~/components/parcelle/parcelles-workspace/selection'
import EmptyPlaceholder from '~/ui/EmptyPlaceholder'
import LabelInfo from '~/ui/LabelInfo'
import LabeledProgressBar from '~/ui/LabeledProgressBar'
import SectionCard from '~/ui/SectionCard'
import type { Data } from '@generated/data'

const MAP_LAYERS: ParcellesMapLayers = { ...DEFAULT_LAYERS, showAac: true }

/** Seules les AAC dont l'emprise est connue permettent de centrer la carte. */
export function useAacEmprises(aacs: Data.Territoire.Variants['forEmprise'][]): AacEmprise[] {
  return useMemo(
    () =>
      aacs.flatMap((aac) =>
        aac.bbox
          ? [{ id: aac.id, label: aac.name ?? aac.code ?? aac.id, bbox: aac.bbox as Bbox }]
          : []
      ),
    [aacs]
  )
}

type ParcellesStepOverviewProps = {
  pmtilesUrl: string
  millesime: string
  onMillesimeChange: (millesime: string) => void
  /** Parcelles sélectionnées pour le millésime affiché. */
  parcelles: SelectedParcelle[]
  aacs: AacEmprise[]
  /** Emprise affichée à l'ouverture, à défaut celle de la première AAC. */
  initialBbox?: Bbox
  onManage: () => void
}

/*
 * Aperçu de l'étape « Parcelles » d'un formulaire : carte en lecture seule des parcelles
 * sélectionnées et répartition de leurs cultures, avec le bouton ouvrant le workspace.
 */
export default function ParcellesStepOverview({
  pmtilesUrl,
  millesime,
  onMillesimeChange,
  parcelles,
  aacs,
  initialBbox,
  onManage,
}: ParcellesStepOverviewProps) {
  const [selectedAacId, setSelectedAacId] = useState(aacs[0]?.id)
  const culturesSegments = useMemo(() => getCulturesSegments(parcelles), [parcelles])
  const culturesTotalHa = culturesSegments.reduce((sum, culture) => sum + culture.value, 0)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6 items-start">
      <div className="h-[520px]">
        <ParcellesSelectionMap
          pmtilesUrl={pmtilesUrl}
          millesime={millesime}
          handleMillesimeChange={onMillesimeChange}
          selectedParcelleIds={parcelles.map((parcelle) => parcelle.rpgId)}
          aacs={aacs}
          selectedAacId={selectedAacId}
          initialBbox={initialBbox}
          onAacChange={setSelectedAacId}
          layers={MAP_LAYERS}
        />
      </div>

      <SectionCard title="Données d'assolement" icon="fr-icon-pie-chart-line" size="small">
        <div className="flex flex-col gap-4">
          <Button
            type="button"
            iconId="fr-icon-edit-line"
            className="justify-center"
            style={{
              width: '100%',
            }}
            onClick={onManage}
          >
            Gérer les parcelles
          </Button>

          {parcelles.length === 0 ? (
            <EmptyPlaceholder
              label={`Aucune parcelle associée pour le RPG ${millesime}`}
              illustrativeIcon="fr-icon-collage-line"
            />
          ) : (
            <>
              <div className="flex flex-wrap gap-4 fr-text--sm fr-mb-0">
                <LabelInfo
                  icon="fr-icon-collage-line"
                  label={plural(parcelles.length, 'parcelle')}
                  size="sm"
                />
                <LabelInfo
                  icon="fr-icon-ruler-line"
                  label={`${formatSurface(parcelles)} ha`}
                  size="sm"
                />
              </div>
              <div className="flex flex-col gap-2">
                {culturesSegments.map((culture) => (
                  <LabeledProgressBar
                    key={culture.label}
                    label={culture.label}
                    size="sm"
                    progressBarValues={{
                      value: culture.value,
                      total: culturesTotalHa,
                      progressColor: culture.color,
                    }}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </SectionCard>
    </div>
  )
}
