import ListItem from '~/ui/ListItem'
import { ProjectJson } from '../../../types/models'
import { formatDateFr } from '~/functions/date'

export type ProjetsListProps = {
  projets: ProjectJson[]
  projetStatuts: Record<string, { label: string; iconId: string }>
}

export default function ProjetsList({ projets, projetStatuts }: ProjetsListProps) {
  return projets.map((projet, index) => {
    const { id, name, description, actionType, status, closedAt, updatedAt } = projet

    return (
      <div key={id} className="fr-mt-2w">
        <ListItem
          title={name}
          tags={[
            {
              label: actionType || "Type d'action non renseigné",
            },
          ]}
          subtitle={
            description && status !== 'completed' && status !== 'abandoned' && `→ ${description}`
          }
          hideTooltip
          additionalInfos={{
            iconId: projetStatuts[status].iconId,
            message: projetStatuts[status].label,
          }}
          metas={[
            {
              content: ['completed', 'abandoned'].includes(status)
                ? `Clôturé le ${formatDateFr(closedAt || updatedAt)}`
                : `Mis à jour le ${formatDateFr(updatedAt)}`,
              iconId: 'fr-icon-time-line',
            },
          ]}
          priority={index % 2 === 1 ? 'secondary' : 'primary'}
          linkProps={{ href: `/projets/${id}` }}
        />
      </div>
    )
  })
}
