import { useMemo, useState } from 'react'
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
} from '~/components/parcelle/parcelles-workspace/selection'
import { getHighlightedAacCodes, pickInitialMapView } from '~/functions/map_focus'
import EmptyPlaceholder from '~/ui/EmptyPlaceholder'
import LabeledProgressBar from '~/ui/LabeledProgressBar'
import ResumeCard from '~/ui/ResumeCard'
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
  const culturesSegments = useMemo(() => getCulturesSegments(parcelles), [parcelles])
  const culturesTotalHa = culturesSegments.reduce((sum, culture) => sum + culture.value, 0)

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[3fr_2fr] gap-6">
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

      {/* Même hauteur que la carte sur grand écran : c'est la répartition des cultures qui défile */}
      <div className="lg:h-[520px]">
        <SectionCard
          title={title}
          icon="fr-icon-collage-line"
          additionalAction={<MillesimeSelect value={millesime} onChange={onMillesimeChange} />}
          fillHeight
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
            <div className="flex flex-col gap-6 h-full">
              <div className="flex flex-col gap-2 shrink-0">
                <div className="grid grid-cols-2 gap-2">
                  <ResumeCard
                    title="Quantité"
                    iconId="fr-icon-collage-line"
                    value={parcelles.length}
                    label={parcelles.length > 1 ? 'parcelles' : 'parcelle'}
                    priority="secondary"
                    size="sm"
                  />
                  <ResumeCard
                    title="Surface totale"
                    iconId="fr-icon-ruler-line"
                    value={formatSurface(parcelles)}
                    label="hectares"
                    priority="secondary"
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

              <div className="flex flex-col gap-2 min-h-0">
                <p className="fr-text fr-text--bold fr-mb-0">Répartition des cultures</p>
                <div className="flex flex-col gap-2 overflow-y-auto min-h-0">
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
            </div>
          )}
        </SectionCard>
      </div>
    </div>
  )
}
