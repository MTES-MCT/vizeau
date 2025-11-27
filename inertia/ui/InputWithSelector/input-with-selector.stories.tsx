import InputWithSelector, { OptionType } from './index.js'
import { useState } from 'react'

import { fr } from '@codegouvfr/react-dsfr'

const meta = {
  title: 'UI/InputWithSelector',
  component: InputWithSelector,
  tags: ['autodocs'],
  argTypes: {
    inputValue: {
      control: 'text',
      description: "Valeur actuelle de l'input.",
      type: { name: 'string', required: true },
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: "''" },
      },
    },
    options: {
      control: 'object',
      description:
        'Liste des options avec leur état de sélection et leurs actions.\n\nModèle obligatoire :\n[\n  {\n    value: string,\n    label: string,\n    isSelected: boolean,\n    actions?: [\n      {\n        label: string,\n        iconId?: string,\n        isCritical?: bool,\n        onClick: (value: string) => void,\n      }\n    ]\n  }\n]',
      type: { name: 'array', required: true },
      table: {
        type: {
          summary:
            '[{ value: string; label: string; isSelected: boolean; actions?: DropdownAction[] }]',
        },
        defaultValue: { summary: '[]' },
      },
    },
    label: {
      control: 'text',
      description: 'Label du champ.\n\nModèle obligatoire :\nstring',
      type: { name: 'string', required: true },
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: "''" },
      },
    },
    hintText: {
      control: 'text',
      description: "Texte d'aide sous le champ.\n\nModèle obligatoire :\nstring",
      type: { name: 'string', required: false },
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: "''" },
      },
    },
    handleInputChange: {
      control: false,
      description:
        "Callback appelé lors du changement de l'input.\n\nModèle obligatoire :\n(value: string) => void",
      type: { name: 'function', required: true },
      table: {
        type: { summary: '(value: string) => void' },
      },
    },
    onOptionsChange: {
      control: false,
      description:
        'Callback appelé lors du changement des options.\n\nModèle obligatoire :\n(options: OptionType[]) => void',
      type: { name: 'function', required: true },
      table: {
        type: { summary: '(options: OptionType[]) => void' },
      },
    },
  },
}

export default meta

export const Défaut = () => {
  const [inputValue, setInputValue] = useState('')
  const [options, setOptions] = useState<OptionType[]>([
    {
      value: 'option1',
      label: 'Option 1',
      isSelected: false,
      actions: [
        {
          value: 'delete',
          label: 'Supprimer',
          iconId: 'fr-icon-delete-line',
          isCritical: true,
          onClick: (value: string) => {
            alert(`Option supprimée: ${value}`)
            const updatedOptions = options.filter((opt) => opt.value !== value)
            setOptions(updatedOptions)
          },
        },
        {
          value: 'option1',
          label: 'Autre action',
          onClick: (value: string) => {
            alert(`Action effectuée: ${value}`)
          },
        },
      ],
    },
    {
      value: 'option2',
      label: 'Option 2',
      isSelected: false,
      actions: [
        {
          value: 'delete',
          label: 'Supprimer',
          iconId: 'fr-icon-delete-line',
          isCritical: true,
          onClick: (value: string) => {
            alert(`Option supprimée: ${value}`)
            const updatedOptions = options.filter((opt) => opt.value !== value)
            setOptions(updatedOptions)
          },
        },
        {
          value: 'option2',
          label: 'Autre action',
          onClick: (value: string) => {
            alert(`Action effectuée: ${value}`)
          },
        },
      ],
    },
    {
      value: 'option3',
      label: 'Option 3',
      isSelected: false,
      actions: [
        {
          value: 'delete',
          label: 'Supprimer',
          iconId: 'fr-icon-delete-line',
          isCritical: true,
          onClick: (value: string) => {
            alert(`Option supprimée: ${value}`)
            const updatedOptions = options.filter((opt) => opt.value !== value)
            setOptions(updatedOptions)
          },
        },
        {
          value: 'delete',
          label: 'Autre action',
          onClick: (value: string) => {
            alert(`Action effectuée: ${value}`)
          },
        },
      ],
    },
  ])

  const handleOptionsChange = (updatedOptions: OptionType[]) => {
    setOptions(updatedOptions)
    console.log('Options mises à jour:', updatedOptions)
    console.log(
      'Options sélectionnées:',
      updatedOptions.filter((opt) => opt.isSelected)
    )
  }

  return (
    <div>
      <InputWithSelector
        inputValue={inputValue}
        options={options}
        handleInputChange={setInputValue}
        onOptionsChange={handleOptionsChange}
        label="Sélectionnez des options"
        hintText="Cliquez pour ouvrir et cocher les options"
      />

      <div
        className="fr-p-4v fr-mt-2v"
        style={{
          border: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
          backgroundColor: fr.colors.decisions.background.alt.blueFrance.default,
        }}
      >
        <h6>Valeurs récupérées par le champ :</h6>

        <div className="flex flex-col gap-2">
          <p className="fr-text fr-m-0"><strong>Valeur de l'input :&nbsp;</strong>{inputValue || '(vide)'}</p>
          <p className="fr-text fr-m-0"><strong className="bold">Nombre d'options :&nbsp;</strong>{options.length}</p>
          <p className="fr-text fr-m-0">
            <strong >Options sélectionnées :&nbsp;</strong>
            {options
              .filter((opt) => opt.isSelected)
              .map((opt) => opt.label)
              .join(', ') || '(aucune)'}
          </p>

          <details>
            <summary className="cursor-pointer">Voir l'état complet des options</summary>
            <pre className="fr-text--xs fr-mt-2v">{JSON.stringify(options, null, 2)}</pre>
          </details>
        </div>
      </div>
    </div>
  )
}

export const SansOptions = () => {
  const [inputValue, setInputValue] = useState('')

  return (
    <InputWithSelector
      inputValue={inputValue}
      options={[]}
      handleInputChange={setInputValue}
      onOptionsChange={() => {}}
      label="Sélectionnez des options"
      hintText="Aucune option disponible"
    />
  )
}
