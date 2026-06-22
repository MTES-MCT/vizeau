import SectionCard from '~/ui/SectionCard'
import { formatDateFr } from '~/functions/date'
import { getProjectStepAdditionalInfos, severityColorMap } from '~/functions/project_steps'
import type { ProjectStepJson } from '#types/models'
import { Button } from '@codegouvfr/react-dsfr/Button'
import { router } from '@inertiajs/react'
import LabelInfo from '~/ui/LabelInfo'
import { fr } from '@codegouvfr/react-dsfr'

export type StepInfoCardProps = {
  step: ProjectStepJson
  completeStepUrl: string
}

export default function StepInfoCard({ step, completeStepUrl }: StepInfoCardProps) {
  const additionalInfos = getProjectStepAdditionalInfos(step)

  return (
    <SectionCard title="Informations" icon="fr-icon-information-line" size="small">
      <div className="flex flex-col gap-2">
        <LabelInfo
          icon="fr-icon-calendar-event-line"
          label="Date de création"
          info={formatDateFr(step.createdAt)}
        />

        <LabelInfo
          icon="fr-icon-calendar-line"
          label="Mis à jour"
          info={formatDateFr(step.updatedAt)}
        />
      </div>

      <div className="flex flex-col gap-2">
        <div>
          {additionalInfos.message && (
            <div className="fr-mt-4w">
              <span
                className={`fr-icon-time-line fr-mr-1v shrink-0`}
                style={{ color: severityColorMap[additionalInfos.alert?.severity || 'infos'] }}
                aria-hidden="true"
              />
              <span style={{ color: severityColorMap[additionalInfos.alert?.severity || 'infos'] }}>
                {additionalInfos.message}
              </span>
            </div>
          )}
          <span
            className={'fr-text--sm'}
            style={{
              color: fr.colors.decisions.text.mention.grey.default,
            }}
          >
            {additionalInfos.alert?.text}
          </span>
        </div>

        {step.date && !step.isValidated && (
          <Button
            iconId="fr-icon-check-line"
            onClick={() => {
              router.post(completeStepUrl, { id: step.id })
            }}
          >
            Marquer comme effectuée
          </Button>
        )}
      </div>
    </SectionCard>
  )
}
