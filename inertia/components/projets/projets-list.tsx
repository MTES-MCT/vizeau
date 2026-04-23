import ListItem from '~/ui/ListItem'
import { ProjetJson } from '../../../types/models'
import { formatDateFr } from '~/functions/date'

export type ProjetsListProps = {
  projets: ProjetJson[]
  projetStatuts: Record<string, { label: string; iconId: string }>
}

export default function ProjetsList({ projets, projetStatuts }: ProjetsListProps) {
  return projets.map((projet, index) => {
    const {
      id,
      nom,
      description,
      type_action,
      statut,
      updated_at,
      parcelles,
      exploitations,
      installations,
    } = projet

    return (
      <div key={id} className="fr-mt-2w">
        <ListItem
          title={nom}
          tags={[{ label: type_action }]}
          subtitle={
            description && statut !== 'completed' && statut !== 'abandoned' && `→ ${description}`
          }
          hideTooltip
          additionalInfos={{
            iconId: projetStatuts[statut].iconId,
            message: projetStatuts[statut].label,
          }}
          metas={[
            ...(parcelles.length > 0
              ? [
                  {
                    content: `${parcelles.length} parcelle(s)`,
                    iconId: 'fr-icon-collage-line',
                  },
                ]
              : []),
            ...(exploitations.length > 0
              ? [
                  {
                    content: `${exploitations.length} exploitation(s)`,
                    iconId: 'fr-icon-map-pin-user-line',
                  },
                ]
              : []),
            ...(installations.length > 0
              ? [
                  {
                    content: `${installations.length} point(s) de prélèvements`,
                    iconId: 'fr-icon-calendar-event-line',
                  },
                ]
              : []),
            {
              content: ['completed', 'abandoned'].includes(statut)
                ? `Clôturé le ${formatDateFr(updated_at)}`
                : `Mis à jour le ${formatDateFr(updated_at)}`,
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
