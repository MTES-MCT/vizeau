import LabelInfo from '~/ui/LabelInfo'
import SmallSection from '~/ui/SmallSection'

export type AacCommunesCardProps = {
  communes: {
    nom: string
    code_insee: string
  }[]
}

export default function AacCommunesCard({ communes }: AacCommunesCardProps) {
  return (
    <SmallSection title="Communes" iconId="fr-icon-government-line" priority="secondary" hasBorder>
      <div className="flex flex-col gap-2">
        {communes.map((commune, index) => (
          <LabelInfo key={index} label={commune.nom} info={commune.code_insee} />
        ))}
      </div>
    </SmallSection>
  )
}
