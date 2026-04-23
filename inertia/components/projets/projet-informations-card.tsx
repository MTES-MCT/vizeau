import CustomTag from '~/ui/CustomTag'
import { ProjetStatutJson } from '../../../types/models'
import SmallSection from '~/ui/SmallSection'
import { PROJECT_STATUTS } from '~/utils/project-statuts'
import LabelInfo from '~/ui/LabelInfo'
import { formatDateFr } from '~/functions/date'

export type ProjetInformationsCardProps = {
  updatedAt: string
  createdAt: string
  statut: ProjetStatutJson
  typeAction: string
}

export default function ProjetInformationsCard({
  updatedAt,
  createdAt,
  statut,
  typeAction,
}: ProjetInformationsCardProps) {
  return (
    <SmallSection
      hasBorder
      title="Informations générales"
      iconId="fr-icon-passport-line"
      priority="secondary"
    >
      <div className="flex flex-col gap-6">
        <CustomTag
          label={PROJECT_STATUTS[statut].label}
          iconId={PROJECT_STATUTS[statut].iconId}
          color={PROJECT_STATUTS[statut].color}
        />

        <div className="flex flex-col gap-3">
          <LabelInfo
            icon="fr-icon-time-line"
            label="Dernière mise à jour le"
            info={formatDateFr(updatedAt)}
          />
          <LabelInfo
            icon="fr-icon-calendar-event-line"
            label="Date de création le"
            info={formatDateFr(createdAt)}
          />
          <LabelInfo
            icon="fr-icon-information-line"
            label="Type"
            info={<CustomTag label={typeAction} />}
          />
        </div>
      </div>
    </SmallSection>
  )
}
