import { Alert } from '@codegouvfr/react-dsfr/Alert'
import CheckboxCard from '~/ui/CheckboxCard'
import { STEPS, STEP_KEYS } from '~/components/projets/form/steps_config'

const OPTIONAL_STEPS = [
  STEPS[STEP_KEYS.PARCELLES],
  STEPS[STEP_KEYS.EXPLOITATIONS],
  STEPS[STEP_KEYS.CAPTAGES],
]

type ConsolidationsStepProps = {
  stepsList: number[]
  setStepsList: React.Dispatch<React.SetStateAction<number[]>>
}

export default function ConsolidationsStep({ stepsList, setStepsList }: ConsolidationsStepProps) {
  const handleToggle = (stepKey: number, checked: boolean) => {
    setStepsList((prev) => {
      const baseSteps = prev.filter((step) => step <= STEP_KEYS.CONSOLIDATIONS)
      const currentOptionalSteps = prev.filter((step) => step > STEP_KEYS.CONSOLIDATIONS)
      const newOptional = checked
        ? [...currentOptionalSteps.filter((step) => step !== stepKey), stepKey].sort(
            (a, b) => a - b
          )
        : currentOptionalSteps.filter((step) => step !== stepKey)

      return [...baseSteps, ...newOptional]
    })
  }

  return (
    <div className="flex flex-col gap-6">
      <Alert
        severity="info"
        description={
          <p>
            Ces informations sont <b>entièrement optionnelles</b>. Vous pouvez les ajouter
            maintenant ou les compléter plus tard depuis la fiche du projet.{' '}
          </p>
        }
        small
      />

      <div className="flex flex-col gap-4">
        {OPTIONAL_STEPS.map(({ key, title, description, iconId }) => (
          <CheckboxCard
            key={key}
            value={String(STEP_KEYS[key])}
            title={title}
            subtitle={description}
            iconId={iconId}
            isSelected={stepsList.includes(STEP_KEYS[key])}
            onCheck={(_, checked) => handleToggle(STEP_KEYS[key], checked)}
          />
        ))}
      </div>
    </div>
  )
}
