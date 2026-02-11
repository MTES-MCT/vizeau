import { formatDateFr } from '~/functions/date'
import LabelInfo from '~/ui/LabelInfo'
import SectionCard from '~/ui/SectionCard'
import { fr } from '@codegouvfr/react-dsfr'
import { getLogEntryAdditionalInfos, severityColorMap } from '~/functions/log_entries'
import { LogEntryJson } from '../../../types/models'
import { Button } from '@codegouvfr/react-dsfr/Button'
import { router } from '@inertiajs/react'
import { Alert } from '@codegouvfr/react-dsfr/Alert'
import { createModal } from '@codegouvfr/react-dsfr/Modal'

export type LogEntryInformationCardProps = {
  userName?: string
  logEntry: LogEntryJson
  completeEntryLogUrl: string
}

export default function LogEntryInformationCard({
  userName,
  logEntry,
  completeEntryLogUrl,
}: LogEntryInformationCardProps) {
  const completeEntryLogModal = createModal({
    id: 'complete-entry-log-modal',
    isOpenedByDefault: false,
  })

  const additionalInfos = getLogEntryAdditionalInfos(logEntry)

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
          info={formatDateFr(logEntry.createdAt)}
        />
      </div>
      {logEntry.date && (
        <div className="flex flex-col fr-mt-6w">
          <div className="items-start">
            <span
              className={`fr-icon-time-line fr-mr-1v shrink-0`}
              style={{ color: severityColorMap[additionalInfos.alert?.severity || 'infos'] }}
              aria-hidden="true"
            />
            <div className="flex-1 min-w-0">
              <p className={`fr-mb-0`}>
                <span
                  style={{ color: severityColorMap[additionalInfos.alert?.severity || 'infos'] }}
                >
                  {additionalInfos.message}
                </span>
                <br />
                <span
                  className={'fr-text--sm'}
                  style={{
                    color: fr.colors.decisions.text.mention.grey.default,
                  }}
                >
                  {additionalInfos.alert?.text}
                </span>
              </p>
            </div>
          </div>
          {logEntry.date && !logEntry.isCompleted && (
            <Button
              title="Marquer comme effectuée"
              iconId="fr-icon-check-line"
              nativeButtonProps={{
                onClick: completeEntryLogModal.open,
              }}
              className="fr-mt-2w"
            >
              Marquer comme effectuée
            </Button>
          )}

          <completeEntryLogModal.Component
            title=""
            size="large"
            buttons={[
              { children: 'Annuler', doClosesModal: true },
              {
                children: 'Marquer comme effectuée',
                onClick: () => {
                  router.post(completeEntryLogUrl, { id: logEntry.id })
                },
              },
            ]}
          >
            <Alert
              severity="warning"
              title="Complétion d'une tâche planifiée"
              description="Vous êtes sur le point de marquer cette tâche comme effectuée, voulez-vous continuer ?"
            />
          </completeEntryLogModal.Component>
        </div>
      )}
    </SectionCard>
  )
}
