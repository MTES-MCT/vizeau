import { useMemo } from 'react'

import { brightStringToColor } from '~/functions/colors'
import { fr } from '@codegouvfr/react-dsfr'

import Doughnut from '~/ui/Charts/Doughnut'
import LabeledProgressBar from '~/ui/LabeledProgressBar'

export type AacCommunesRepartitionProps = {
  communes: {
    nb_communes: number
    communes: Record<
      string,
      {
        surface: number
        code_insee: string
        repartition: number
      }
    >
  }
}

export default function AacCommunesRepartition({ communes }: AacCommunesRepartitionProps) {
  const communeRepartitionItems = useMemo(() => {
    const allCommunesPresent = Object.keys(communes.communes).length >= communes.nb_communes

    const totalSurface = allCommunesPresent
      ? Object.values(communes.communes).reduce((acc, { surface }) => acc + surface, 0)
      : 0

    return Object.entries(communes.communes).map(([nom, info]) => {
      const repartition =
        allCommunesPresent && totalSurface > 0
          ? Number(((info.surface / totalSurface) * 100).toFixed(1))
          : Number(info.repartition.toFixed(1))
      return {
        label: nom,
        surface: info.surface,
        repartition,
        backgroundColor: brightStringToColor(nom),
      }
    })
  }, [communes])

  const communesChartItems = useMemo(() => {
    const items = communeRepartitionItems.map(
      ({ label, surface, repartition, backgroundColor }) => ({
        label,
        data: repartition,
        tooltipValue: surface,
        backgroundColor,
      })
    )

    if (communes.nb_communes > items.length) {
      const totalRepartition = items.reduce((acc, { data }) => acc + data, 0)
      const autresRepartition = Number(Math.max(0, 100 - totalRepartition).toFixed(1))

      items.push({
        label: 'Autres',
        data: autresRepartition,
        tooltipValue: Math.round(
          (autresRepartition / 100) *
            Object.values(communes.communes).reduce((acc, { surface }) => acc + surface, 0)
        ),
        backgroundColor: fr.colors.decisions.background.alt.blueFrance.default,
      })
    }
    return items
  }, [communes.nb_communes, communeRepartitionItems])

  const communeProgressBarsItems = useMemo(() => {
    return communeRepartitionItems.map(({ label, repartition, backgroundColor }, index) => ({
      key: `${label}-${communes.communes[label]?.code_insee ?? index}`,
      label,
      value: repartition,
      total: 100,
      progressColor: backgroundColor,
    }))
  }, [communeRepartitionItems, communes.communes])

  return (
    <div className="flex w-full flex-wrap items-center gap-2">
      <div className="min-h-[200px] h-full min-w-0 sm:min-w-[300px] flex-[1_1_250px] flex justify-center items-center">
        <Doughnut chartItems={communesChartItems} unit="hectares" hideLegend />
      </div>
      <div className="min-w-0 sm:min-w-[300px] flex-1">
        {communeProgressBarsItems.map((item) => (
          <div key={item.key} className="w-full">
            <LabeledProgressBar
              label={item.label}
              size="sm"
              progressBarValues={{
                value: item.value,
                total: item.total,
                progressColor: item.progressColor,
              }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
