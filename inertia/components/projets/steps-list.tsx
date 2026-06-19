import { createModal } from '@codegouvfr/react-dsfr/Modal'
import { router } from '@inertiajs/react'
import { ReactNode, useState } from 'react'
import Alert from '@codegouvfr/react-dsfr/Alert'
import Button from '@codegouvfr/react-dsfr/Button'
import EmptyPlaceholder from '~/ui/EmptyPlaceholder'
import Timeline, { TimelineItem } from '~/ui/Timeline'
import ListItem from '~/ui/ListItem'
import AlertDrawer from '~/ui/AlertDrawer'
import { MoreButtonProps } from '~/ui/MoreButton'
import type { ProjectStepJson } from '#types/models'
import {
  getProjectStepAdditionalInfos,
  getProjectStepTitle,
  severityColorMap,
} from '~/functions/project_steps'

const deleteStepModal = createModal({
  id: 'delete-project-step-modal',
  isOpenedByDefault: false,
})

const completeStepModal = createModal({
  id: 'complete-project-step-modal',
  isOpenedByDefault: false,
})

export type StepsListProps = {
  steps: ProjectStepJson[]
  projectId: string
}

export default function StepsList({ steps, projectId }: StepsListProps) {
  const [stepToDelete, setStepToDelete] = useState<string>('')
  const [stepToComplete, setStepToComplete] = useState<string>('')

  if (steps?.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        <EmptyPlaceholder
          illustrativeIcon="fr-icon-booklet-line"
          label="Votre tableau de bord est vide."
          hint="Ajoutez une étape pour commencer à suivre vos informations."
          buttonLabel="Ajouter une première étape"
          buttonIcon="fr-icon-add-line"
          handleClick={() => router.visit(`/projets/${projectId}/etapes/creation`)}
        />
      </div>
    )
  }

  const timelineItems: TimelineItem[] = []
  const urgentListItems: ReactNode[] = []

  for (const step of steps) {
    const additionalInfos = getProjectStepAdditionalInfos(step)
    const actions: MoreButtonProps['actions'] = [
      {
        label: 'Éditer',
        iconId: 'fr-icon-edit-line',
        onClick: () => {
          router.visit(`/projets/${projectId}/etapes/${step.id}/edition`)
        },
      },
      {
        label: 'Supprimer',
        isCritical: true,
        iconId: 'fr-icon-delete-line',
        onClick: () => {
          setStepToDelete(step.id)
          deleteStepModal.open()
        },
      },
    ]

    if (step.date && !step.isValidated) {
      actions.push({
        label: 'Marquer comme effectuée',
        iconId: 'fr-icon-check-line',
        onClick: () => {
          setStepToComplete(step.id)
          completeStepModal.open()
        },
      })
    }

    const listItem: ReactNode = (
      <ListItem
        variant="compact"
        key={step.id}
        title={getProjectStepTitle(step)}
        linkProps={{ href: `/projets/${projectId}/etapes/${step.id}` }}
        tags={step.tags?.map((tag) => ({ label: tag.name })) || []}
        additionalInfos={step.date ? additionalInfos : undefined}
        hasBorder={true}
        metas={[
          {
            content: `Créée le ${new Date(step.createdAt).toLocaleDateString()}`,
            iconId: 'fr-icon-calendar-event-line',
          },
        ]}
        actions={actions}
      />
    )

    timelineItems.push({
      content: listItem,
      dotColor:
        additionalInfos.alert && additionalInfos.alert.severity
          ? severityColorMap[additionalInfos.alert.severity]
          : undefined,
    })

    if (
      additionalInfos.alert?.severity === 'error' ||
      additionalInfos.alert?.severity === 'warning'
    ) {
      urgentListItems.push(listItem)
    }
  }

  return (
    <div className="w-full flex flex-col gap-8">
      <Button
        priority="secondary"
        iconId="fr-icon-add-line"
        onClick={() => router.visit(`/projets/${projectId}/etapes/creation`)}
        style={{ width: '100%', justifyContent: 'center' }}
      >
        Ajouter une nouvelle étape
      </Button>

      <div className="flex flex-col gap-4">
        {urgentListItems.length > 0 && (
          <AlertDrawer
            title="Étapes urgentes et à venir"
            severity="warning"
            customIconId="fr-icon-notification-3-line"
          >
            <div className={'flex flex-col gap-3'}>{urgentListItems}</div>
          </AlertDrawer>
        )}

        <Timeline items={timelineItems} maxVisible={10} />
      </div>

      <deleteStepModal.Component
        title=""
        size="large"
        buttons={[
          { children: 'Annuler', doClosesModal: true },
          {
            children: "Supprimer l'étape",
            onClick: () => {
              router.delete(`/projets/${projectId}/etapes/${stepToDelete}`)
            },
          },
        ]}
      >
        <Alert
          severity="error"
          title="Suppression d'une étape"
          description="Vous êtes sur le point de supprimer cette étape, voulez-vous continuer ?"
        />
      </deleteStepModal.Component>

      <completeStepModal.Component
        title=""
        size="large"
        buttons={[
          { children: 'Annuler', doClosesModal: true },
          {
            children: 'Marquer comme effectuée',
            onClick: () => {
              router.post(`/projets/${projectId}/etapes/complete`, {
                id: stepToComplete,
              })
            },
          },
        ]}
      >
        <Alert
          severity="warning"
          title="Complétion d'une étape planifiée"
          description="Vous êtes sur le point de marquer cette étape comme effectuée, voulez-vous continuer ?"
        />
      </completeStepModal.Component>
    </div>
  )
}
