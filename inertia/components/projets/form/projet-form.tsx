import { Button } from '@codegouvfr/react-dsfr/Button'
import { Alert } from '@codegouvfr/react-dsfr/Alert'
import { Stepper } from '@codegouvfr/react-dsfr/Stepper'
import { SetDataAction } from '@inertiajs/react'
import StepRenderer from '~/components/projets/form/step-renderer'
import {
  ParcellesStep,
  ExploitationsStep,
  CaptagesStep,
  GeneralInfosStep,
  ConsolidationsStep,
  FirstEntryStep,
} from '~/components/projets/form'
import { STEP_KEYS, STEPS } from '~/components/projets/form/steps_config'

// Attach components to steps (done here to avoid circular imports)
STEPS[STEP_KEYS.GENERAL_INFOS].component = GeneralInfosStep
STEPS[STEP_KEYS.FIRST_ENTRY].component = FirstEntryStep
STEPS[STEP_KEYS.CONSOLIDATIONS].component = ConsolidationsStep
STEPS[STEP_KEYS.PARCELLES].component = ParcellesStep
STEPS[STEP_KEYS.EXPLOITATIONS].component = ExploitationsStep
STEPS[STEP_KEYS.CAPTAGES].component = CaptagesStep

export type ProjetFormErrors = {
  projectName?: string
}

export type SelectedParcelleFormData = {
  id?: string
  year: number
  rpgId: string
  surface: number | null
  cultureCode: string | null
  centroid: { x: number; y: number } | undefined
  exploitationName: string | null
}

export type ProjetFormData = {
  generalInfos: {
    projectName: string
    label: string
    description: string
    type_action: string
    statut: string
  }
  steps: {
    title: string
    notes: string
    tags: number[]
    date: string
    documents: File[]
  }[]
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
  steps: [{ title: '', notes: '', tags: [], date: '', documents: [] }],
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
  data,
  setData,
  errors,
  setErrors,
  onSubmit,
}: ProjetFormProps) {
  const currentIndex = stepsList.indexOf(currentStep)
  const prevStep = currentIndex > 0 ? stepsList[currentIndex - 1] : null
  const nextStep = currentIndex < stepsList.length - 1 ? stepsList[currentIndex + 1] : null

  const nextStepKey = stepsList[currentIndex + 1]
  const nextTitle = nextStepKey ? STEPS[nextStepKey].title : undefined

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
      <div className="min-h-[120px] fr-mb-4w">
        <Stepper
          currentStep={currentIndex + 1}
          nextTitle={nextTitle}
          stepCount={stepsList.length}
          title={STEPS[currentStep].title}
        />
      </div>

      <StepRenderer
        component={STEPS[currentStep].component}
        handleStepsList={handleStepsList}
        stepsList={stepsList}
        data={data}
        setData={setData}
        errors={errors}
      />

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
