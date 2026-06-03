import { Button } from '@codegouvfr/react-dsfr/Button'
import { Alert } from '@codegouvfr/react-dsfr/Alert'
import { SetDataAction } from '@inertiajs/react'
import Input from '@codegouvfr/react-dsfr/Input'
import { Select } from '@codegouvfr/react-dsfr/Select'
import SectionCard from '~/ui/SectionCard'
import CheckboxCard from '~/ui/CheckboxCard'

export type ProjetFormErrors = {
  projectName?: string
}

export type SelectedParcelleFormData = {
  id?: string
  rpgId: string
  surface: number | null
  cultureCode: string | null
  centroid: { x: number; y: number } | undefined
  exploitationName: string | null
}

export type SelectedExploitationFormData = {
  id: string
  name: string
}

export type ProjetFormData = {
  generalInfos: {
    projectName: string
    label: string
    description: string
    type_action: string
    statut: string
  }
  firstEntry: {
    title: string
    notes: string
    tags: number[]
    date: string
    documents: File[]
  }
  parcelles: {
    millesime: string
    items: SelectedParcelleFormData[]
  }
  exploitations: string[]
  captages: string[]
}

export const defaultFormData: ProjetFormData = {
  generalInfos: {
    projectName: '',
    label: '',
    description: '',
    type_action: '',
    statut: 'to_be_started',
  },
  firstEntry: {
    title: '',
    notes: '',
    tags: [],
    date: '',
    documents: [],
  },
  parcelles: {
    millesime: '2024',
    items: [],
  },
  exploitations: [],
  captages: [],
}

export type ProjetFormProps = {
  handleStepsList: React.Dispatch<React.SetStateAction<number[]>>
  setCurrentStep: (step: number) => void
  currentStep: number
  stepsList: number[]
  steps: Record<number, { title: string; nextTitle?: string; component?: React.ComponentType<any> }>
  data: ProjetFormData
  setData: SetDataAction<ProjetFormData>
  errors: ProjetFormErrors
  setErrors: (errors: ProjetFormErrors) => void
  onSubmit: () => void
}

function validate(step: number, formData: ProjetFormData): ProjetFormErrors {
  if (step === 1) {
    return {
      projectName: formData.generalInfos.projectName.trim() ? undefined : 'Ce champ est requis',
    }
  }
  return {}
}

function hasErrors(errors: ProjetFormErrors): boolean {
  return Object.values(errors).some(Boolean)
}

export default function ProjetForm({
  handleStepsList,
  setCurrentStep,
  currentStep,
  stepsList,
  steps,
  data,
  setData,
  errors,
  setErrors,
  onSubmit,
}: ProjetFormProps) {
  const currentIndex = stepsList.indexOf(currentStep)
  const prevStep = currentIndex > 0 ? stepsList[currentIndex - 1] : null
  const nextStep = currentIndex < stepsList.length - 1 ? stepsList[currentIndex + 1] : null

  const handleNext = () => {
    const newErrors = validate(currentStep, data)
    setErrors(newErrors)
    if (hasErrors(newErrors)) return
    if (nextStep !== null) {
      setCurrentStep(nextStep)
    } else {
      onSubmit()
    }
  }

  const handlePrev = () => {
    setErrors({})
    if (prevStep !== null) setCurrentStep(prevStep)
  }

  return (
    <div className="flex flex-col gap-6">
      {steps[currentStep].component &&
        (() => {
          const StepComponent = steps[currentStep].component!

          return (
            <StepComponent
              stepsList={stepsList}
              setStepsList={handleStepsList}
              data={data}
              setData={setData}
              errors={errors}
            />
          )
        })()}

      {hasErrors(errors) && (
        <Alert
          small
          severity="error"
          description="Des erreurs sont présentes dans le formulaire, veuillez les corriger avant de continuer."
        />
      )}

      <div className="flex justify-end gap-3">
        {prevStep !== null && (
          <Button
            type="button"
            priority="secondary"
            onClick={handlePrev}
            iconId="fr-icon-arrow-left-line"
          >
            Précédent
          </Button>
        )}
        {nextStep !== null ? (
          <Button type="button" onClick={handleNext} iconId="fr-icon-arrow-right-line">
            Suivant
          </Button>
        ) : (
          <Button type="button" onClick={handleNext} iconId="fr-icon-check-line">
            Valider
          </Button>
        )}
      </div>
    </div>
  )
}

type GeneralInfosStepProps = {
  data: ProjetFormData
  setData: React.Dispatch<React.SetStateAction<ProjetFormData>>
  errors: ProjetFormErrors
}

export function GeneralInfosStep({ data, setData, errors }: GeneralInfosStepProps) {
  const values = data.generalInfos

  const handleValueChange = (key: keyof ProjetFormData['generalInfos'], value: string) => {
    setData((prev) => ({ ...prev, generalInfos: { ...prev.generalInfos, [key]: value } }))
  }

  return (
    <div>
      <SectionCard>
        <Input
          label="Nom du projet"
          hintText="Ex: Accompagnement MAEC Martin, Zone tampon secteur nord..."
          state={errors.projectName ? 'error' : 'default'}
          stateRelatedMessage={errors.projectName || undefined}
          nativeInputProps={{
            value: values.projectName,
            onChange: (event) => handleValueChange('projectName', event.target.value),
          }}
        />

        <div className="flex gap-3">
          <Select
            className="w-full"
            label="Type d'action"
            hint="Ex : MAEC, PSE..."
            nativeSelectProps={{
              onChange: (event) => handleValueChange('type_action', event.target.value),
              value: values.type_action,
            }}
          >
            <option value="" disabled>
              Sélectionnez un type d'action
            </option>
            <option value="maec">MAEC</option>
            <option value="pse">PSE</option>
            <option value="accompagnement">Accompagnement technique</option>
            <option value="bio">Conversion bio</option>
            <option value="autre">Autre</option>
          </Select>

          <Select
            className="w-full"
            label="Statut"
            hint='"À démarrer" par défaut'
            nativeSelectProps={{
              onChange: (event) => handleValueChange('statut', event.target.value),
              value: values.statut,
            }}
          >
            <option value="to_be_started">À démarrer</option>
            <option value="current">En cours</option>
            <option value="completed">Terminé</option>
            <option value="abandoned">Abandonné</option>
          </Select>
        </div>

        <Input
          label="Description du projet"
          hintText="Contexte, objectif, enjeux — visible sur la fiche projet."
          textArea
          nativeTextAreaProps={{
            value: values.description,
            onChange: (event) => handleValueChange('description', event.target.value),
          }}
        />
      </SectionCard>
    </div>
  )
}

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

export function ConsolidationsStep({ stepsList, setStepsList }: ConsolidationsStepProps) {
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

export function FirstEntryStep() {
  return (
    <div>
      <Alert
        severity="info"
        title="Fonctionnalité à venir"
        description="La possibilité d'ajouter une première étape de suivi sera disponible prochainement."
      />
    </div>
  )
}
