import { useMemo } from 'react'

import { fr } from '@codegouvfr/react-dsfr'
import { flatMap, keys, map, sortBy, uniq, filter } from 'lodash-es'

import EvolutiveChartLine from '~/ui/Charts/EvolutiveChartLine'
import ResumeCard from '~/ui/ResumeCard'
import SectionCard from '~/ui/SectionCard'
import SmallSection from '~/ui/SmallSection'
import { getCultureColorByLabel } from '~/functions/cultures-group'
import AacCulturesRepartition from './aac-cultures-repartition'

import { AacJson } from '../../../types/aac'
import EmptyPlaceholder from '~/ui/EmptyPlaceholder'

export type AacAgricultureSectionProps = Pick<
  AacJson,
  | 'surface_agricole_ppe'
  | 'surface_agricole_ppr'
  | 'surface_agricole_utile'
  | 'surface_agricole_bio'
  | 'communes'
  | 'culture_evolution'
>

function concatSurfaces(
  surfaces: Record<string, { surface: number | null } | null> | null | undefined
): number {
  if (!surfaces) return 0
  const total = Object.values(surfaces).reduce((acc, agr) => acc + (agr?.surface ?? 0), 0)
  return Number(total.toFixed(2))
}

export default function AacAgricultureSection({
  surface_agricole_utile,
  surface_agricole_bio,
  surface_agricole_ppr,
  surface_agricole_ppe,
  culture_evolution,
}: AacAgricultureSectionProps) {
  const bioEvolutiveChartData = useMemo(() => {
    const sorted = [...(surface_agricole_bio?.evolution ?? [])].sort((a, b) => a.annee - b.annee)

    return {
      labels: sorted.map((entry) => entry.annee),
      datasets: [
        {
          label: 'Agriculture Bio',
          data: sorted.map((entry) => entry.surface),
          borderColor: '#447049',
          backgroundColor: '#447049',
        },
      ],
    }
  }, [surface_agricole_bio])

  const cultureEvolutionChartData = useMemo(() => {
    const repartition = culture_evolution?.repartition
    if (!repartition) return { labels: [] as number[], datasets: [] }

    // Années triées en ordre croissant (les clés sont des strings, on les convertit en number uniquement pour le tri)
    const yearKeys = sortBy(keys(repartition), (yearKey) => Number(yearKey))
    // Cultures ayant au moins une valeur non-nulle sur la période, sans doublons
    const activeCultures = uniq(
      flatMap(yearKeys, (yearKey) =>
        filter(keys(repartition[yearKey]), (name) => repartition[yearKey]?.[name] != null)
      )
    )
    const datasets = map(activeCultures, (name) => {
      const color = getCultureColorByLabel(name)
      return {
        label: name,
        data: map(yearKeys, (yearKey) => repartition[yearKey]?.[name]?.surface_ha ?? 0),
        borderColor: color,
        backgroundColor: color,
      }
    })
    return { labels: yearKeys.map((yearKey) => Number(yearKey)), datasets }
  }, [culture_evolution])

  return (
    <SectionCard title="Agriculture">
      <div className="flex flex-col gap-5">
        <div
          className="grid w-full gap-2"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}
        >
          <ResumeCard
            title="Agriculture utile (SAU)"
            value={concatSurfaces(surface_agricole_utile)}
            label="hectares"
            iconId="fr-icon-seedling-line"
            priority="secondary"
          />
          <ResumeCard
            title="Agriculture utile en PPE"
            value={concatSurfaces(surface_agricole_ppe)}
            label="hectares"
            iconId="fr-icon-seedling-line"
            priority="secondary"
          />
          <ResumeCard
            title="Agriculture utile en PPR"
            value={concatSurfaces(surface_agricole_ppr)}
            label="hectares"
            iconId="fr-icon-seedling-line"
            priority="secondary"
          />
          <ResumeCard
            title="Culture Bio"
            value={surface_agricole_bio?.surface.toFixed(2) ?? 0}
            label="hectares"
            iconId="fr-icon-leaf-line"
            priority="secondary"
            color={fr.colors.decisions.text.label.greenBourgeon.default}
          />
        </div>

        <SmallSection
          title="Répartition des types de cultures"
          iconId="fr-icon-seedling-line"
          priority="secondary"
          hasBorder
        >
          <AacCulturesRepartition
            surface_agricole_ppe={surface_agricole_ppe}
            surface_agricole_ppr={surface_agricole_ppr}
            surface_agricole_utile={surface_agricole_utile}
          />
        </SmallSection>

        <SmallSection
          title="Évolution des types de cultures"
          iconId="fr-icon-seedling-line"
          priority="secondary"
          hasBorder
        >
          {cultureEvolutionChartData.labels.length > 0 &&
          cultureEvolutionChartData.datasets.length > 0 ? (
            <EvolutiveChartLine chartItems={cultureEvolutionChartData} unit="ha" legendSize="sm" />
          ) : (
            <EmptyPlaceholder
              illustrativeIcon="fr-icon-line-chart-fill"
              label="Aucune donnée d'évolution des cultures n'est disponible pour cet AAC."
            />
          )}
        </SmallSection>

        {bioEvolutiveChartData.labels.length > 0 && (
          <SmallSection
            title="Évolution de l'agriculture biologique"
            iconId="fr-icon-leaf-line"
            priority="secondary"
            hasBorder
          >
            <EvolutiveChartLine chartItems={bioEvolutiveChartData} legendSize="sm" />
          </SmallSection>
        )}
      </div>
    </SectionCard>
  )
}
