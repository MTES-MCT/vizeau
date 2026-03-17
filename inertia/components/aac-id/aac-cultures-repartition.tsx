import { useMemo, useState } from 'react'
import { SegmentedControl } from '@codegouvfr/react-dsfr/SegmentedControl'
import LabeledProgressBar from '~/ui/LabeledProgressBar'
import Doughnut from '~/ui/Charts/Doughnut'
import { orderBy } from 'lodash-es'
import { getCultureCategoryColor } from '~/functions/cultures-group'

type CultureInfo = { surface: number | null; SAU: number | null } | null
type SurfaceAgricole = Record<string, CultureInfo>

export type AacCulturesRepartitionProps = {
  surface_agricole_ppe: SurfaceAgricole
  surface_agricole_ppr: SurfaceAgricole
  surface_agricole_utile: SurfaceAgricole
}

export default function AacCulturesRepartition({
  surface_agricole_ppe,
  surface_agricole_ppr,
  surface_agricole_utile,
}: AacCulturesRepartitionProps) {
  const [selectedTab, setSelectedTab] = useState('total')

  const cultureItems = useMemo(() => {
    const source =
      selectedTab === 'ppe'
        ? surface_agricole_ppe
        : selectedTab === 'ppr'
          ? surface_agricole_ppr
          : surface_agricole_utile

    const filteredSource = Object.entries(source).filter(
      ([, entry]) => entry !== null && entry.SAU !== null
    )

    const totalSAU = filteredSource.reduce((acc, [, entry]) => acc + (entry?.surface ?? 0), 0)

    return orderBy(
      filteredSource.map(([name, entry]) => {
        const color = getCultureCategoryColor(name)
        return {
          label: name,
          data: totalSAU > 0 ? Number(((entry!.surface! / totalSAU) * 100).toFixed(1)) : 0,
          tooltipValue: entry?.surface ?? undefined,
          backgroundColor: color,
          progressColor: color,
        }
      }),
      'data',
      'desc'
    )
  }, [selectedTab, surface_agricole_ppe, surface_agricole_ppr, surface_agricole_utile])

  return (
    <div className="flex flex-col gap-4">
      <SegmentedControl
        hideLegend
        segments={[
          {
            label: 'SAU totale',
            nativeInputProps: {
              checked: selectedTab === 'total',
              onChange: () => setSelectedTab('total'),
            },
          },
          {
            label: 'SAU en PPE',
            nativeInputProps: {
              checked: selectedTab === 'ppe',
              onChange: () => setSelectedTab('ppe'),
            },
          },
          {
            label: 'SAU en PPR',
            nativeInputProps: {
              checked: selectedTab === 'ppr',
              onChange: () => setSelectedTab('ppr'),
            },
          },
        ]}
      />

      <div className="fr-grid-row w-full items-center justify-center">
        <div className="fr-col-12 fr-col-lg-6 h-fit flex flex-col gap-2">
          {cultureItems.map((item) => (
            <LabeledProgressBar
              label={item.label}
              size="sm"
              progressBarValues={{
                value: item.data,
                total: 100,
                progressColor: item.progressColor,
              }}
              key={item.label}
            />
          ))}
        </div>
        <div className="fr-col-12 fr-col-lg-6 min-h-[200px]">
          <Doughnut chartItems={cultureItems} unit="hectares" hideLegend />
        </div>
      </div>
    </div>
  )
}
