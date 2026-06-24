import { Input } from '@codegouvfr/react-dsfr/Input'
import SectionCard from '~/ui/SectionCard'
import type { ProjetFormData } from './projet-form'
import { Alert } from '@codegouvfr/react-dsfr/Alert'
import { Upload } from '@codegouvfr/react-dsfr/Upload'
import { Button } from '@codegouvfr/react-dsfr/Button'
import SmallSection from '~/ui/SmallSection'
import { useRef } from 'react'

type FirstEntryStepProps = {
  data: ProjetFormData
  setData: React.Dispatch<React.SetStateAction<ProjetFormData>>
}

export default function FirstEntryStep({ data, setData }: FirstEntryStepProps) {
  const values = data.steps[0]
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleChange = (key: keyof ProjetFormData['steps'][number], value: string | File[]) => {
    setData((prev) => ({
      ...prev,
      steps: prev.steps.map((step, index) => (index === 0 ? { ...step, [key]: value } : step)),
    }))
  }

  return (
    <div className="grid grid-cols-[320px_1fr] gap-4">
      <aside className="flex flex-col gap-4">
        <SmallSection
          title="Documents"
          iconId="fr-icon-attachment-line"
          hasBorder
          priority="secondary"
        >
          <div className="flex flex-col gap-2">
            <Upload
              label=""
              hint="Format PDF, maximum 10 Mo"
              multiple={true}
              className="flex-1 border-2 font-bold border-dashed border-[var(--border-default-grey)] fr-p-1w text-sm"
              nativeInputProps={{
                accept: 'application/pdf',
                ref: fileInputRef,
                onChange: (e) => {
                  if (e.target.files) {
                    const files: File[] = []
                    for (let i = 0; i < e.target.files.length; i++) {
                      files.push(e.target.files[i])
                    }
                    handleChange('documents', files)
                  }
                },
              }}
            />
            <Button
              size="small"
              type="button"
              priority="tertiary"
              disabled={!values.documents || values.documents.length === 0}
              style={{ width: '100%', justifyContent: 'center' }}
              onClick={() => {
                handleChange('documents', [])
                if (fileInputRef.current) {
                  fileInputRef.current.files = new DataTransfer().files
                }
              }}
            >
              Réinitialiser la sélection
            </Button>
          </div>
        </SmallSection>
      </aside>

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
    </div>
  )
}
