import { useState } from 'react'
import { fr } from '@codegouvfr/react-dsfr'

import { SegmentedControl } from '@codegouvfr/react-dsfr/SegmentedControl'
import { Table } from '@codegouvfr/react-dsfr/Table'
import Button from '@codegouvfr/react-dsfr/Button'
import Loader from '~/ui/Loader'
import VerticalChartBar from '~/ui/Charts/VerticalChartBar'
import SectionCard from '~/ui/SectionCard'

export type QualiteSuiviProps = {
  perYearData:
    | {
        annee: number
        sans_dep: number
        avec_dep: number
        total: number
      }[]
    | null
  installationCode: string
  loadingPerYear: boolean
}
export default function QualiteSuivi({
  perYearData,
  installationCode,
  loadingPerYear,
}: QualiteSuiviProps) {
  const [activeView, setActiveView] = useState<'graphique' | 'tableau'>('graphique')

  const handleExportCsv = () => {
    if (!perYearData) return
    const header = 'Année,Conformes,En dépassement,Total'
    const rows = perYearData.map((d) => `${d.annee},${d.sans_dep},${d.avec_dep},${d.total}`)
    const csv = [header, ...rows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `qualite-eau-${installationCode}.csv`
    a.style.visibility = 'hidden'
    document.body.append(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  const chartItems =
    perYearData && perYearData.length > 0
      ? {
          labels: perYearData.map((d) => String(d.annee)),
          datasets: [
            {
              label: 'Analyses conformes',
              data: perYearData.map((d) => d.sans_dep),
              backgroundColor: '#003189',
            },
            {
              label: 'Analyses en dépassement',
              data: perYearData.map((d) => d.avec_dep),
              backgroundColor: '#D40000',
            },
          ],
          tooltipExtras: [
            { label: "Nombre d'analyses", data: perYearData.map((d) => d.total) },
            { label: 'Dont en dépassement', data: perYearData.map((d) => d.avec_dep) },
            { label: 'Conformes', data: perYearData.map((d) => d.sans_dep) },
          ],
        }
      : null

  return (
    <SectionCard
      title="Suivi de la qualité de l'eau"
      icon="fr-icon-bar-chart-fill"
      caption="Consulter sur un nombre d'analyses données, l'évolution des dépassements par années."
      size="small"
    >
      {/* Segmented control + exporter */}
      <div
        className="flex items-center justify-between fr-px-3w fr-py-2w"
        style={{
          backgroundColor: fr.colors.decisions.background.alt.blueFrance.default,
        }}
      >
        <SegmentedControl
          hideLegend
          segments={[
            {
              label: 'Graphique',
              nativeInputProps: {
                checked: activeView === 'graphique',
                onChange: () => setActiveView('graphique'),
              },
            },
            {
              label: 'Tableau',
              nativeInputProps: {
                checked: activeView === 'tableau',
                onChange: () => setActiveView('tableau'),
              },
            },
          ]}
        />
        <Button
          iconId="fr-icon-download-line"
          onClick={handleExportCsv}
          disabled={!perYearData || perYearData.length === 0}
          type="button"
        >
          Exporter
        </Button>
      </div>

      {/* Content */}
      {loadingPerYear ? (
        <div className="flex items-center gap-2 fr-py-3w">
          <Loader type="dots" size="sm" />
        </div>
      ) : !perYearData || perYearData.length === 0 ? (
        <p
          className="fr-text--sm fr-mb-0"
          style={{ color: fr.colors.decisions.text.mention.grey.default }}
        >
          Aucune donnée disponible pour cette période.
        </p>
      ) : activeView === 'graphique' ? (
        chartItems && (
          <VerticalChartBar
            chartItems={chartItems}
            yAxisLabel="Nombre d'analyses"
            unit="analyse(s)"
            chartHeight={350}
          />
        )
      ) : (
        <Table
          headers={['Année', 'Conformes', 'En dépassement', 'Total']}
          fixed
          className="w-full"
          data={perYearData.map((d) => [
            d.annee,
            d.sans_dep.toLocaleString('fr-FR'),
            d.avec_dep > 0 ? (
              <span style={{ color: fr.colors.decisions.text.default.error.default }}>
                {d.avec_dep.toLocaleString('fr-FR')}
              </span>
            ) : (
              d.avec_dep.toLocaleString('fr-FR')
            ),
            d.total.toLocaleString('fr-FR'),
          ])}
        />
      )}
    </SectionCard>
  )
}
