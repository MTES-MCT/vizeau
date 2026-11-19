import { useMemo, useState } from 'react'
import { fr } from '@codegouvfr/react-dsfr'
import { Button } from '@codegouvfr/react-dsfr/Button'

import MillesimeSelect from '~/components/map/millesime-select'
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
import type { StackedProgressBarSegment } from '~/ui/StackedProgressBar'

const MAP_LAYERS: ParcellesMapLayers = { ...DEFAULT_LAYERS, showAac: true }

/** Au-delà, les cultures les moins présentes sont regroupées pour garder un résumé court. */
const MAX_CULTURES = 5

function groupMinorCultures(segments: StackedProgressBarSegment[]): StackedProgressBarSegment[] {
  if (segments.length <= MAX_CULTURES) return segments
  const minorSegments = segments.slice(MAX_CULTURES - 1)
  return [
    ...segments.slice(0, MAX_CULTURES - 1),
    {
      label: `Autres cultures (${minorSegments.length})`,
      color: fr.colors.decisions.background.contrast.grey.active,
      value: minorSegments.reduce((sum, segment) => sum + segment.value, 0),
    },
  ]
}

type ParcellesStepOverviewProps = {
  pmtilesUrl: string
  millesime: string
  onMillesimeChange: (millesime: string) => void
  /** Parcelles sélectionnées pour le millésime affiché. */
  parcelles: SelectedParcelle[]
  aacs: AacEmprise[]
  /** Territoires de l'entité éditée, mis en valeur ; le premier est cadré à l'ouverture. */
  territoireIds?: string[]
  /** Titre du résumé, propre à l'entité éditée (« Parcelles du projet »…). */
  title: string
  onManage: () => void
}

/*
 * Aperçu de l'étape « Parcelles » d'un formulaire : carte en lecture seule des parcelles
 * sélectionnées et résumé de la sélection (chiffres, puis répartition des cultures), avec le
 * bouton ouvrant le workspace.
 */
export default function ParcellesStepOverview({
  pmtilesUrl,
  millesime,
  onMillesimeChange,
  parcelles,
  aacs,
  territoireIds,
  title,
  onManage,
}: ParcellesStepOverviewProps) {
  // Calculée au montage seulement : la carte ne lit sa vue initiale qu'à sa création
  const [initialView] = useState(() => pickInitialMapView(aacs, { territoireIds }))
  const highlightedAacCodes = useMemo(
    () => getHighlightedAacCodes(aacs, { territoireIds }),
    [aacs, territoireIds]
  )
  const culturesSegments = useMemo(
    () => groupMinorCultures(getCulturesSegments(parcelles)),
    [parcelles]
  )
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
          hideBaseMapSelect
          hideMillesimeSelect
        />
      </div>

      <SectionCard
        title={title}
        icon="fr-icon-collage-line"
        size="small"
        additionalAction={<MillesimeSelect value={millesime} onChange={onMillesimeChange} />}
      >
        {parcelles.length === 0 ? (
          <EmptyPlaceholder
            label={`Aucune parcelle associée pour le RPG ${millesime}`}
            illustrativeIcon="fr-icon-collage-line"
            buttonLabel="Sélectionner des parcelles"
            buttonIcon="fr-icon-add-line"
            handleClick={onManage}
          />
        ) : (
          <div className="flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <div className="flex flex-wrap gap-4">
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
              <Button
                type="button"
                iconId="fr-icon-edit-line"
                className="justify-center"
                style={{ width: '100%' }}
                onClick={onManage}
              >
                Gérer les parcelles
              </Button>
            </div>

            <div className="flex flex-col gap-2">
              <p className="fr-text fr-text--bold fr-mb-0">Répartition des cultures</p>
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
          </div>
        )}
      </SectionCard>
    </div>
  )
}
