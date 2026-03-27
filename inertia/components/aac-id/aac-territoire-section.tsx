import { useMemo } from 'react'

import { brightStringToColor } from '~/functions/colors'

import SectionCard from '~/ui/SectionCard'
import ResumeCard from '~/ui/ResumeCard'
import SmallSection from '~/ui/SmallSection'
import AacCommunesRepartition from './aac-communes-repartition'

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
  return (
    <SectionCard title="Territoire">
      <div
        className="grid w-full gap-2 fr-mb-2w"
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
        <AacCommunesRepartition communes={communes} />
      </SmallSection>
    </SectionCard>
  )
}
