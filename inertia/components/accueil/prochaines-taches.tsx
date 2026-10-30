import { useState } from 'react'
import { DateTime } from 'luxon'
import { router, usePage } from '@inertiajs/react'
import type { SharedProps } from '@adonisjs/inertia/types'
import { createModal } from '@codegouvfr/react-dsfr/Modal'
import Alert from '@codegouvfr/react-dsfr/Alert'
import SectionCard from '~/ui/SectionCard'
import EmptyPlaceholder from '~/ui/EmptyPlaceholder'
import Timeline, { type TimelineItem } from '~/ui/Timeline'
import ListItem, { type AdditionalInfosProps } from '~/ui/ListItem'
import { MoreButtonProps } from '~/ui/MoreButton'
import { severityColorMap } from '~/functions/log_entries'
import { urlFor } from '~/client'
import type { ProchainesTacheJson } from '#types/models'

export type ProchainesTachesProps = {
  prochainesTaches: ProchainesTacheJson[]
}

const deleteTacheModal = createModal({
  id: 'delete-prochaine-tache-modal',
  isOpenedByDefault: false,
})

const completeTacheModal = createModal({
  id: 'complete-prochaine-tache-modal',
  isOpenedByDefault: false,
})

function getTacheAlert(date: string): AdditionalInfosProps['alert'] {
  const tacheDate = DateTime.fromISO(date, { zone: 'utc' }).startOf('day')
  const now = DateTime.now().setZone('utc').startOf('day')
  const diffInDays = tacheDate.diff(now, 'days').days

  if (diffInDays < 0) {
    const displayableDiffInDays = Math.abs(Math.ceil(diffInDays))
    return {
      severity: 'error',
      text: `Retard de ${displayableDiffInDays} jour${displayableDiffInDays > 1 ? 's' : ''}`,
    }
  }

  if (diffInDays <= 7) {
    if (diffInDays === 0) return { severity: 'warning', text: "Aujourd'hui" }
    if (diffInDays === 1) return { severity: 'warning', text: 'Demain' }
    return { severity: 'warning', text: `Dans ${Math.ceil(diffInDays)} jours` }
  }

  return { severity: 'infos', text: `Dans ${Math.ceil(diffInDays)} jours` }
}

// Project steps are already scoped to accessible projects, so any step in the list is editable.
// Log entries can only be edited/completed/deleted by their author.
function isReadOnlyForCurrentUser(tache: ProchainesTacheJson, userId?: string): boolean {
  return tache.userId !== undefined && tache.userId !== userId
}

function getTacheHref(tache: ProchainesTacheJson, suffix = ''): string {
  return tache.projetId
    ? `/projets/${tache.projetId}/etapes/${tache.id}${suffix}`
    : `/exploitations/${tache.exploitationId}/journal/${tache.id}${suffix}`
}

function completeTache(tache: ProchainesTacheJson) {
  if (tache.projetId) {
    router.post(`/projets/${tache.projetId}/etapes/complete`, { id: tache.id })
  } else if (tache.exploitationId) {
    router.post(urlFor('log_entries.complete', { exploitationId: tache.exploitationId }), {
      id: tache.id,
    })
  }
}

function deleteTache(tache: ProchainesTacheJson) {
  if (tache.projetId) {
    router.delete(`/projets/${tache.projetId}/etapes/${tache.id}`)
  } else if (tache.exploitationId) {
    router.delete(urlFor('log_entries.destroy', { exploitationId: tache.exploitationId }), {
      data: { id: tache.id },
    })
  }
}

export default function ProchainesTaches({ prochainesTaches }: ProchainesTachesProps) {
  const { user } = usePage<SharedProps>().props
  const [tacheToDelete, setTacheToDelete] = useState<ProchainesTacheJson | null>(null)
  const [tacheToComplete, setTacheToComplete] = useState<ProchainesTacheJson | null>(null)

  if (prochainesTaches.length === 0) {
    return (
      <SectionCard title="Prochaines tâches" icon="fr-icon-time-line">
        <EmptyPlaceholder label="Aucune tâche à venir." />
      </SectionCard>
    )
  }

  const timelineItems: TimelineItem[] = prochainesTaches.map((tache) => {
    const alert = getTacheAlert(tache.date)
    const lieu = tache.nomProjet ?? tache.nomExploitation
    const isHidden = isReadOnlyForCurrentUser(tache, user?.id)

    const actions: MoreButtonProps['actions'] = [
      {
        label: 'Éditer',
        iconId: 'fr-icon-edit-line',
        isHidden,
        onClick: () => router.visit(getTacheHref(tache, '/edition')),
      },
      {
        label: 'Marquer comme effectuée',
        iconId: 'fr-icon-check-line',
        isHidden,
        onClick: () => {
          setTacheToComplete(tache)
          completeTacheModal.open()
        },
      },
      {
        label: 'Supprimer',
        iconId: 'fr-icon-delete-line',
        isCritical: true,
        isHidden,
        onClick: () => {
          setTacheToDelete(tache)
          deleteTacheModal.open()
        },
      },
    ]

    return {
      content: (
        <ListItem
          key={tache.id}
          variant="compact"
          title={tache.titre}
          linkProps={{ href: getTacheHref(tache) }}
          hasBorder
          additionalInfos={{
            iconId: 'fr-icon-time-line',
            message: `Tâche planifiée pour le ${DateTime.fromISO(tache.date).toLocaleString(
              { year: 'numeric', month: 'long', day: 'numeric' },
              { locale: 'fr-FR' }
            )}`,
            alert,
          }}
          metas={
            lieu
              ? [
                  {
                    content: lieu,
                    iconId: tache.nomProjet
                      ? 'fr-icon-briefcase-line'
                      : 'fr-icon-map-pin-user-line',
                  },
                ]
              : []
          }
          actions={actions}
        />
      ),
      dotColor: alert?.severity ? severityColorMap[alert.severity] : undefined,
    }
  })

  return (
    <SectionCard
      title="Prochaines tâches programmées"
      caption="Tâches planifiées en retard ou à venir sur vos exploitations et projets"
      size="small"
    >
      <Timeline items={timelineItems} maxVisible={5} />

      <deleteTacheModal.Component
        title=""
        size="large"
        buttons={[
          { children: 'Annuler', doClosesModal: true },
          {
            children: 'Supprimer la tâche',
            onClick: () => {
              if (tacheToDelete) deleteTache(tacheToDelete)
            },
          },
        ]}
      >
        <Alert
          severity="error"
          title="Suppression d'une tâche"
          description="Vous êtes sur le point de supprimer cette tâche, voulez-vous continuer ?"
        />
      </deleteTacheModal.Component>

      <completeTacheModal.Component
        title=""
        size="large"
        buttons={[
          { children: 'Annuler', doClosesModal: true },
          {
            children: 'Marquer comme effectuée',
            onClick: () => {
              if (tacheToComplete) completeTache(tacheToComplete)
            },
          },
        ]}
      >
        <Alert
          severity="warning"
          title="Complétion d'une tâche planifiée"
          description="Vous êtes sur le point de marquer cette tâche comme effectuée, voulez-vous continuer ?"
        />
      </completeTacheModal.Component>
    </SectionCard>
  )
}
