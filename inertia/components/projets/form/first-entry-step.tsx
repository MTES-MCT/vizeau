import { Input } from '@codegouvfr/react-dsfr/Input'
import SectionCard from '~/ui/SectionCard'
import type { ProjetFormData } from './projet-form'
import { Alert } from '@codegouvfr/react-dsfr/Alert'

type FirstEntryStepProps = {
  data: ProjetFormData
  setData: React.Dispatch<React.SetStateAction<ProjetFormData>>
}

export default function FirstEntryStep({ data, setData }: FirstEntryStepProps) {
  const values = data.steps[0]

  const handleChange = (key: keyof ProjetFormData['steps'][number], value: string) => {
    setData((prev) => ({
      ...prev,
      steps: prev.steps.map((step, index) => (index === 0 ? { ...step, [key]: value } : step)),
    }))
  }

  return (
    <div className="flex flex-col gap-4">
      <Alert
        title="Pourquoi définir une première étape ?"
        description="Viz'eau structure chaque projet comme une séquence d'étapes actionnables. La première étape vous donne une ligne de départ concrète, visible directement depuis la liste des projets. Vous pourrez en ajouter d'autres depuis la fiche projet."
        severity="info"
      />
      <SectionCard background="secondary">
        <Input
          label="Titre"
          nativeInputProps={{
            maxLength: 255,
            value: values.title,
            onChange: (e) => handleChange('title', e.target.value),
          }}
        />

        <Input
          label="Date de la première étape"
          nativeInputProps={{
            type: 'date',
            value: values.date,
            onChange: (e) => handleChange('date', e.target.value),
          }}
        />

        <Input
          label="Note"
          textArea
          nativeTextAreaProps={{
            maxLength: 1000,
            rows: 5,
            value: values.notes,
            onChange: (e) => handleChange('notes', e.target.value),
          }}
        />
      </SectionCard>
    </div>
  )
}
