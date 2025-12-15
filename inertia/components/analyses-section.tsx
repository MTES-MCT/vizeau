import { useMemo } from 'react'
import { getContrastedPicto, getCulturesGroup } from '~/functions/cultures-group'
import { fr } from '@codegouvfr/react-dsfr'

import DataVisualization from '@codegouvfr/react-dsfr/picto/DataVisualization'

import Doughnut from '~/ui/Charts/Doughnut'
import LabeledProgressBar from '~/ui/LabeledProgressBar'
import SectionCard from '~/ui/SectionCard'
import Divider from '~/ui/Divider'
import EmptyPlaceholder from '~/ui/EmptyPlaceholder'

export type AnalysesSectionProps = {
  parcelles: {
    id_parcel: string
    surf_parc: number
    code_group: string
    cat_cult_p: string
  }[]
  surf_territoire?: number
}

export default function AnalysesSection({ parcelles = [] }: AnalysesSectionProps) {
  const totalParcellesSurface = parcelles.reduce((total, parcelle) => total + parcelle.surf_parc, 0)

  const chartItems = useMemo(() => {
    const items: { data: number; label: string; backgroundColor: string }[] = []

    parcelles.map((parcelle) => {
      items.push({
        data: parcelle.surf_parc,
        label: getCulturesGroup(parcelle.code_group).label,
        backgroundColor: getCulturesGroup(parcelle.code_group).color,
      })
    })

    return items
  }, [parcelles])

  return (
    <SectionCard title="Analyses" icon="fr-icon-line-chart-line" size="small">
      {parcelles.length > 0 ? (
        <div className="flex flex-col gap-10">
          <div className="flex flex-col gap-3">
            <Divider label="Répartition des cultures de l'exploitation" />

            <div className="flex flex-col gap-2">
              {parcelles.map((parcelle) => {
                const cultureGroup = getCulturesGroup(parcelle.code_group)

                return (
                  <LabeledProgressBar
                    key={parcelle.id_parcel}
                    label={cultureGroup.label}
                    src={getContrastedPicto(cultureGroup)}
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
                <div style={{ width: 300 }}>
                  <Doughnut chartItems={chartItems} legendSize="sm" />
                </div>
              </div>
        </div>
      ) : (
        <EmptyPlaceholder pictogram={DataVisualization} label="Données indisponibles" />
      )}
    </SectionCard>
  )
}
