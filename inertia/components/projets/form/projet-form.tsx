import { Button } from '@codegouvfr/react-dsfr/Button'
import { SetDataAction } from '@inertiajs/react'

export type ProjetFormErrors = {
  projectName?: string
}

export type SelectedParcelleFormData = {
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
