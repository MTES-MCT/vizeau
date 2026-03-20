import LabelInfo from '~/ui/LabelInfo'
import { formatDateFr } from '~/functions/date'
import SmallSection from '~/ui/SmallSection'

export type AacInformationsCardProps = {
  code: string
  date_creation: string
  date_maj: string
}

export default function AacInformationsCard({
  code,
  date_creation,
  date_maj,
}: AacInformationsCardProps) {
  return (
    <SmallSection
      title="Informations générales"
      iconId="fr-icon-passport-line"
      priority="secondary"
      hasBorder
    >
      <div className="flex flex-col gap-2">
        <LabelInfo label="Code AAC" info={code} />
        <LabelInfo label="Date de création" info={formatDateFr(date_creation)} />
        <LabelInfo label="Dernière mise à jour" info={formatDateFr(date_maj)} />
      </div>
    </SmallSection>
  )
}
