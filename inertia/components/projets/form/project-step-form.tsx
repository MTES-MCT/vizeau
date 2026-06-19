import { Input } from '@codegouvfr/react-dsfr/Input'
import { SetDataAction } from '@inertiajs/react'
import SectionCard from '~/ui/SectionCard'
import type { ProjectStepFormData } from '~/pages/projets/etapes/creation'

type ProjectStepFormProps = {
  data: ProjectStepFormData
  setData: SetDataAction<ProjectStepFormData>
}

export default function ProjectStepForm({ data, setData }: ProjectStepFormProps) {
  return (
    <SectionCard background="secondary">
      <Input
        label="Titre"
        nativeInputProps={{
          name: 'title',
          maxLength: 255,
          value: data.title,
          onChange: (e) => setData('title', e.target.value),
        }}
      />

      <Input
        label="Date de l'étape"
        nativeInputProps={{
          name: 'date',
          type: 'date',
          value: data.date,
          onChange: (e) => setData('date', e.target.value),
        }}
      />

      <Input
        label="Note"
        textArea
        nativeTextAreaProps={{
          name: 'note',
          maxLength: 1000,
          rows: 5,
          value: data.note,
          onChange: (e) => setData('note', e.target.value),
        }}
      />
    </SectionCard>
  )
}
