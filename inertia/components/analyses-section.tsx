import { useMemo } from 'react'
import { getCulturesGroup } from '~/functions/cultures-group'
import { fr } from '@codegouvfr/react-dsfr'
import { orderBy } from 'lodash-es'

import DataVisualization from '@codegouvfr/react-dsfr/picto/DataVisualization'

import Doughnut from '~/ui/Charts/Doughnut'
import LabeledProgressBar from '~/ui/LabeledProgressBar'
import Divider from '~/ui/Divider'
import EmptyPlaceholder from '~/ui/EmptyPlaceholder'
import SmallSection from '~/ui/SmallSection'

export type AnalysesSectionProps = {
  parcelles: {
    id_parcel: string
    surf_parc: number
    code_group: string
  }[]
  surf_territoire?: number
}

export default function AnalysesSection({ parcelles }: AnalysesSectionProps) {
  const totalParcellesSurface = parcelles.reduce((total, parcelle) => total + parcelle.surf_parc, 0)

  const chartItems = useMemo(() => {
    return parcelles.map((parcelle) => ({
      data: parcelle.surf_parc,
      label: getCulturesGroup(parcelle.code_group).label,
      backgroundColor: getCulturesGroup(parcelle.code_group).color,
    }))
  }, [parcelles])

  return (
    <SmallSection title="Analyses" iconId="fr-icon-line-chart-line" priority="secondary" hasBorder>
      {parcelles.length > 0 ? (
        <div className="flex flex-col gap-10">
          <div className="flex flex-col gap-3">
            <Divider label="Répartition des cultures de l'exploitation" />

            <div className="flex flex-col gap-2">
              {orderBy(parcelles, 'surf_parc', 'desc').map((parcelle) => {
                const cultureGroup = getCulturesGroup(parcelle.code_group)

                return (
                  <LabeledProgressBar
                    key={parcelle.id_parcel}
                    label={cultureGroup.label}
                    progressBarValues={{
                      value: parcelle.surf_parc,
                      total: totalParcellesSurface,
                      progressColor: cultureGroup.color,
                    }}
                  />
                )
              })}
            </div>
          </div>

          <div
            className="fr-p-2w"
            style={{ backgroundColor: fr.colors.decisions.background.alt.grey.default }}
          >
            <div className="w-[300px]">
              <Doughnut chartItems={chartItems} legendSize="sm" />
            </div>
          </div>
        </div>
      ) : (
        <EmptyPlaceholder pictogram={DataVisualization} label="Données indisponibles" />
      )}
    </SmallSection>
  )
}
