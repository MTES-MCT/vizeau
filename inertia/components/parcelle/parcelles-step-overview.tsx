import { useMemo, useState } from 'react'
import { Button } from '@codegouvfr/react-dsfr/Button'

import ParcellesSelectionMap, {
  AacEmprise,
  DEFAULT_LAYERS,
  ParcellesMapLayers,
  SelectedParcelle,
} from '~/components/map/parcelles-selection-map'
import {
  formatSurface,
  getCulturesSegments,
  plural,
} from '~/components/parcelle/parcelles-workspace/selection'
import { getHighlightedAacCodes, pickInitialMapView } from '~/functions/map_focus'
import EmptyPlaceholder from '~/ui/EmptyPlaceholder'
import LabelInfo from '~/ui/LabelInfo'
import LabeledProgressBar from '~/ui/LabeledProgressBar'
import SectionCard from '~/ui/SectionCard'

const MAP_LAYERS: ParcellesMapLayers = { ...DEFAULT_LAYERS, showAac: true }

type ParcellesStepOverviewProps = {
  pmtilesUrl: string
  millesime: string
  onMillesimeChange: (millesime: string) => void
  /** Parcelles sélectionnées pour le millésime affiché. */
  parcelles: SelectedParcelle[]
  aacs: AacEmprise[]
  /** Territoires de l'entité éditée, cadrés à l'ouverture de la carte. */
  territoireIds?: string[]
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
  territoireIds,
  onManage,
}: ParcellesStepOverviewProps) {
  // Calculée au montage seulement : la carte ne lit sa vue initiale qu'à sa création
  const [initialView] = useState(() => pickInitialMapView(aacs, { territoireIds }))
  const highlightedAacCodes = useMemo(
    () => getHighlightedAacCodes(aacs, { territoireIds }),
    [aacs, territoireIds]
  )
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
          initialView={initialView}
          highlightedAacCodes={highlightedAacCodes}
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
