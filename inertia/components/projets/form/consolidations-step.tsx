import { Alert } from '@codegouvfr/react-dsfr/Alert'
import CheckboxCard from '~/ui/CheckboxCard'

const OPTIONAL_STEPS: { key: number; title: string; description?: string; iconId?: string }[] = [
  {
    key: 4,
    title: 'Parcelles',
    description: 'Associer les parcelles agricoles concernées par ce projet. Sélection via carte.',
    iconId: 'fr-icon-collage-line',
  },
  {
    key: 5,
    title: 'Exploitations',
    description:
      'Liez une ou plusieurs exploitations agricoles. Utile pour les projets collectifs.',
    iconId: 'fr-icon-map-pin-user-line',
  },
  {
    key: 6,
    title: 'Points de prélèvements',
    description: 'Associer des points de prélèvements concernés par ce projet.',
    iconId: 'fr-icon-drop-line',
  },
]

type ConsolidationsStepProps = {
  stepsList: number[]
  setStepsList: React.Dispatch<React.SetStateAction<number[]>>
}

export default function ConsolidationsStep({ stepsList, setStepsList }: ConsolidationsStepProps) {
  const handleToggle = (stepKey: number, checked: boolean) => {
    setStepsList((prev) => {
      const baseSteps = prev.filter((step) => step <= 3)
      const currentOptionalSteps = prev.filter((step) => step > 3)
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
            value={String(key)}
            title={title}
            subtitle={description}
            iconId={iconId}
            isSelected={stepsList.includes(key)}
            onCheck={(_, checked) => handleToggle(key, checked)}
          />
        ))}
      </div>
    </div>
  )
}
