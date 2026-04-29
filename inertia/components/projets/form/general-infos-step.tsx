import Input from '@codegouvfr/react-dsfr/Input'
import SectionCard from '~/ui/SectionCard'
import { Select } from '@codegouvfr/react-dsfr/Select'
import type { ProjetFormData, ProjetFormErrors } from './projet-form'

type GeneralInfosStepProps = {
  data: ProjetFormData
  setData: React.Dispatch<React.SetStateAction<ProjetFormData>>
  errors: ProjetFormErrors
}

export default function GeneralInfosStep({ data, setData, errors }: GeneralInfosStepProps) {
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
