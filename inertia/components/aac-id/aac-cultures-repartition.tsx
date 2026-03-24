import { useMemo, useState } from 'react'
import { SegmentedControl } from '@codegouvfr/react-dsfr/SegmentedControl'
import LabeledProgressBar from '~/ui/LabeledProgressBar'
import Doughnut from '~/ui/Charts/Doughnut'
import { orderBy } from 'lodash-es'
import { getCultureCategoryColor } from '~/functions/cultures-group'
import { AacJson } from '../../../types/aac'

type SurfaceAgricole =
  | AacJson['surface_agricole_utile']
  | AacJson['surface_agricole_ppe']
  | AacJson['surface_agricole_ppr']

export type AacCulturesRepartitionProps = Pick<
  AacJson,
  'surface_agricole_ppe' | 'surface_agricole_ppr' | 'surface_agricole_utile'
>

type SurfaceAgricoleTab = 'total' | 'ppe' | 'ppr'

export default function AacCulturesRepartition({
  surface_agricole_ppe,
  surface_agricole_ppr,
  surface_agricole_utile,
}: AacCulturesRepartitionProps) {
  const [selectedTab, setSelectedTab] = useState<SurfaceAgricoleTab>('total')

  const cultureItems = useMemo(() => {
    let source: SurfaceAgricole

    switch (selectedTab) {
      case 'ppe':
        source = surface_agricole_ppe
        break
      case 'ppr':
        source = surface_agricole_ppr
        break
      case 'total':
      default:
        source = surface_agricole_utile
    }

    if (!source) {
      return []
    }

    const filteredSource = Object.entries(source).filter(
      (entry): entry is [string, { nb_parcelles: number; surface: number; SAU: number | null }] =>
        entry[1] !== null && entry[1].surface !== null && entry[1].SAU !== null
    )

    const totalSAU = filteredSource.reduce((acc, [, entry]) => acc + entry.surface, 0)

    return orderBy(
      filteredSource.map(([name, entry]) => {
        const color = getCultureCategoryColor(name)
        return {
          label: name,
          data: totalSAU > 0 ? Number(((entry.surface / totalSAU) * 100).toFixed(1)) : 0,
          tooltipValue: entry.surface,
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
