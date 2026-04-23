import Timeline, { TimelineItem } from '~/ui/Timeline'
import ListItem from '~/ui/ListItem'
import { LogEntryJson, ProjetEtapeJson } from '../../../types/models'
import { getLogEntryAdditionalInfos, severityColorMap } from '~/functions/log_entries'
import { fr } from '@codegouvfr/react-dsfr'
import { formatDateFr } from '~/functions/date'
import EmptyPlaceholder from '~/ui/EmptyPlaceholder'
import Button from '@codegouvfr/react-dsfr/Button'

export type ProjectLogEntriesProps = {
  logEntries: ProjetEtapeJson[]
}

function etapeAsLogEntry(etape: ProjetEtapeJson): LogEntryJson {
  return {
    date: etape.date,
    isCompleted: etape.is_validated,
    updatedAt: etape.date_maj,
  } as LogEntryJson
}

export default function ProjetLogEntries({ logEntries }: ProjectLogEntriesProps) {
  if (logEntries?.length === 0) {
    return (
      <EmptyPlaceholder
        illustrativeIcon="fr-icon-booklet-line"
        label="Votre tableau de bord est vide."
        hint="Commencez votre suivi de projet en créant votre première étape."
        buttonLabel="Créer la première étape"
        buttonIcon="fr-icon-add-line"
        handleClick={() => {
          // TODO: Implement the logic to create the first step
        }}
      />
    )
  }

  const timelineItems: TimelineItem[] = (logEntries ?? []).map((etape) => {
    const additionalInfos = getLogEntryAdditionalInfos(etapeAsLogEntry(etape))
    return {
      content: (
        <ListItem
          title={etape.title}
          subtitle={etape.note ?? undefined}
          additionalInfos={additionalInfos}
          actions={[
            {
              label: 'Éditer',
              iconId: 'fr-icon-edit-line',
              //tODO: isHidden: Check if the user has the right to edit the step
              onClick: () => {
                // TODO: Implement the logic to edit the step
              },
            },
            {
              label: 'Supprimer',
              isCritical: true,
              // TODO isHidden: etape.userId !== user.id,
              iconId: 'fr-icon-delete-line',
              onClick: () => {
                // TODO: Implement the logic to delete the step
              },
            },
            ...(etape.date && !etape.is_validated
              ? [
                  {
                    label: 'Marquer comme effectuée',
                    iconId: 'fr-icon-check-line',
                    onClick: () => {
                      // TODO: Implement the logic to mark the step as completed
                    },
                  },
                ]
              : []),
          ]}
          metas={[
            {
              content: `Créée le ${formatDateFr(etape.date)}`,
              iconId: 'fr-icon-calendar-event-line',
            },
            ...(etape.documents && etape.documents.length > 0
              ? [
                  {
                    content: `${etape.documents.length} fichier${etape.documents.length > 1 ? 's' : ''}`,
                    iconId: 'fr-icon-attachment-line',
                  },
                ]
              : []),
          ]}
          hasBorder={true}
        />
      ),
      dotColor: etape.is_validated
        ? fr.colors.decisions.text.default.success.default
        : additionalInfos.alert?.severity
          ? severityColorMap[additionalInfos.alert.severity]
          : undefined,
    }
  })

  return (
    <div className="flex flex-col gap-2">
      <Button
        iconId="fr-icon-add-line"
        priority="secondary"
        style={{
          width: '100%',
          justifyContent: 'center',
        }}
        onClick={() => {
          //TODO: Implement the logic to add a new step
        }}
      >
        Ajouter une prochaine étape
      </Button>
      <Timeline items={timelineItems} />
    </div>
  )
}
