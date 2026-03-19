import { useMemo } from 'react'

import { brightStringToColor } from '~/functions/colors'
import { fr } from '@codegouvfr/react-dsfr'

import SectionCard from '~/ui/SectionCard'
import ResumeCard from '~/ui/ResumeCard'
import Doughnut from '~/ui/Charts/Doughnut'
import LabeledProgressBar from '~/ui/LabeledProgressBar'
import SmallSection from '~/ui/SmallSection'

export type AacTerritoireSectionProps = {
  surface: number
  nb_captages_actifs: number | null
  nb_parcelles: number
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

export default function AacTerritoireSection({
  surface,
  nb_captages_actifs,
  nb_parcelles,
  communes,
}: AacTerritoireSectionProps) {
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
    <SectionCard title="Territoire">
      <div
        className="grid w-full gap-2"
        style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))' }}
      >
        <ResumeCard
          title="Surface totale"
          iconId="fr-icon-ruler-line"
          label="hectares"
          value={surface != null ? surface.toFixed(2) : '—'}
          priority="secondary"
        />
        <ResumeCard
          title="Captages actifs"
          iconId="fr-icon-drop-line"
          label="unités"
          value={nb_captages_actifs}
          priority="secondary"
        />
        <ResumeCard
          title="Parcelles agricoles"
          iconId="fr-icon-collage-line"
          label="unités"
          value={nb_parcelles}
          priority="secondary"
        />
      </div>

      <SmallSection
        title="Communes concernées"
        iconId="fr-icon-government-line"
        priority="secondary"
        hasBorder
      >
        <div className="fr-grid-row w-full items-center justify-center">
          <div className="fr-col-12 fr-col-lg-6 min-h-[200px]">
            <Doughnut chartItems={communesChartItems} unit="hectares" hideLegend />
          </div>
          <div className="fr-col-12 fr-col-lg-6 h-fit flex flex-col gap-2">
            {communeProgressBarsItems.map((item) => (
              <LabeledProgressBar
                label={item.label}
                size="sm"
                progressBarValues={{
                  value: item.value,
                  total: item.total,
                  progressColor: item.progressColor,
                }}
                key={item.key}
              />
            ))}
          </div>
        </div>
      </SmallSection>
    </SectionCard>
  )
}
