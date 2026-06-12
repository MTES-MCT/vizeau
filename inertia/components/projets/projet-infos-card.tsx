import SectionCard from '~/ui/SectionCard'
import LabelInfo from '~/ui/LabelInfo'
import { ProjectJson } from '../../../types/models'
import { formatDateFr } from '~/functions/date'
import CustomTag from '~/ui/CustomTag'

const projetStatuts = {
  to_be_started: {
    label: 'À démarrer',
    iconId: 'fr-icon-flag-line',
    color: '#e8edff',
  },
  current: {
    label: 'En cours',
    iconId: 'fr-icon-play-line',
    color: '#f5f5fe',
  },
  completed: {
    label: 'Terminé',
    iconId: 'fr-icon-calendar-check-line',
    color: '#b8fec9',
  },
  abandoned: {
    label: 'Abandonné',
    iconId: 'fr-icon-error-line',
    color: '#ffe9e9',
  },
}

export default function ProjetInfosCard({ projet }: { projet: ProjectJson }) {
  const { status, actionType, createdAt, closedAt, updatedAt } = projet

  return (
    <SectionCard title="Informations générales" icon="fr-icon-pass-pending-line" size="small">
      {projetStatuts[status] ? (
        <CustomTag
          iconId={projetStatuts[status].iconId}
          label={projetStatuts[status].label}
          color={projetStatuts[status].color}
        />
      ) : null}

      <div className="flex flex-col gap-1 fr-mt-2v">
        <LabelInfo label="Créé le" info={formatDateFr(createdAt)} />
        <LabelInfo label="Mis à jour le" info={formatDateFr(updatedAt)} />
        {closedAt && <LabelInfo label="Clôturé le" info={formatDateFr(closedAt)} />}
        <LabelInfo label="Type d'action" info={actionType} />
      </div>
    </SectionCard>
  )
}
