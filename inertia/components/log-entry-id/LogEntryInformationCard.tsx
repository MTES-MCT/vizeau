import { formatDateFr } from '~/functions/date'
import LabelInfo from '~/ui/LabelInfo'
import SectionCard from '~/ui/SectionCard'

export type LogEntryInformationCardProps = {
  userName: string
  createdAt: string
}

export default function LogEntryInformationCard({
  userName,
  createdAt,
}: LogEntryInformationCardProps) {
  return (
    <SectionCard title="Informations générales" size={'small'} icon="fr-icon-info-line">
      <div className="flex flex-col gap-4">
        <LabelInfo
          icon="fr-icon-account-line"
          label="Auteur"
          info={userName || 'Utilisateur inconnu'}
        />
        <LabelInfo
          icon="fr-icon-calendar-line"
          label="Date de création"
          info={formatDateFr(createdAt)}
        />
      </div>
    </SectionCard>
  )
}
