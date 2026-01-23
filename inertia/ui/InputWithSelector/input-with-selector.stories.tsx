import InputWithSelector, { OptionType } from './index'
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
        'Liste des options avec leur état de sélection et leurs actions.\n\nModèle obligatoire :\n[\n  {\n    value: string,\n    label: string,\n    isSelected: boolean,\n    group?: string,\n    actions?: [\n      {\n        label: string,\n        iconId?: string,\n        isCritical?: bool,\n        onClick: (value: string) => void,\n      }\n    ]\n  }\n]',
      type: { name: 'array', required: true },
      table: {
        type: {
          summary:
            '[{ value: string; label: string; isSelected: boolean; group?: string; actions?: DropdownAction[] }]',
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
    onOptionChange: {
      control: false,
      description:
        "Callback appelé lors du changement d'une option.\n\nModèle obligatoire :\n(option: OptionType) => void",
      type: { name: 'function', required: true },
      table: {
        type: { summary: '(option: OptionType) => void' },
      },
    },
  },
}

export default meta

export const Défaut = () => {
  const [inputValue, setInputValue] = useState('')

  const [options, setOptions] = useState<OptionType<string>[]>([
    {
      value: 'option1',
      label: 'Option 1',
      isSelected: false,
      group: 'Groupe A',
      actions: [
        {
          value: 'option1',
          label: 'Supprimer',
          iconId: 'fr-icon-delete-line',
          isCritical: true,
          onClick: () => {
            alert('Option supprimée: option1')
            setOptions((prevOptions: OptionType<string>[]) =>
              prevOptions.filter((opt) => opt.value !== 'option1')
            )
          },
        },
        {
          value: 'option1',
          label: 'Autre action',
          onClick: () => {
            alert('Action effectuée : other')
          },
        },
      ],
    },
    {
      value: 'option2',
      label: 'Option 2',
      isSelected: false,
      group: 'Groupe A',
      actions: [
        {
          value: 'option2',
          label: 'Supprimer',
          iconId: 'fr-icon-delete-line',
          isCritical: true,
          onClick: () => {
            alert('Option supprimée: option2')
            setOptions((prevOptions: OptionType<string>[]) =>
              prevOptions.filter((opt) => opt.value !== 'option2')
            )
          },
        },
        {
          value: 'option2',
          label: 'Autre action',
          onClick: () => {
            alert('Action effectuée : other')
          },
        },
      ],
    },
    {
      value: 'option3',
      label: 'Option 3',
      isSelected: false,
      group: 'Groupe B',
      actions: [
        {
          value: 'option3',
          label: 'Supprimer',
          iconId: 'fr-icon-delete-line',
          isCritical: true,
          onClick: () => {
            alert('Option supprimée: option3')
            setOptions((prevOptions: OptionType<string>[]) =>
              prevOptions.filter((opt) => opt.value !== 'option3')
            )
          },
        },
        {
          value: 'option3',
          label: 'Autre action',
          onClick: () => {
            alert('Action effectuée : other')
          },
        },
      ],
    },
  ])

  const handleOptionChange = (updatedOption: OptionType<string>) => {
    setOptions((prev) =>
      prev.map((opt) => (opt.value === updatedOption.value ? updatedOption : opt))
    )
    console.log('Option mise à jour:', updatedOption)
  }

  return (
    <div>
      <InputWithSelector
        inputValue={inputValue}
        options={options}
        handleInputChange={setInputValue}
        onOptionChange={handleOptionChange}
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
          <p className="fr-text fr-m-0">
            <strong>Valeur de l'input :&nbsp;</strong>
            {inputValue || '(vide)'}
          </p>
          <p className="fr-text fr-m-0">
            <strong>Nombre d'options :&nbsp;</strong>
            {options.length}
          </p>
          <p className="fr-text fr-m-0">
            <strong>Options sélectionnées :&nbsp;</strong>
            {options
              .filter((opt: OptionType<string>) => opt.isSelected)
              .map((opt: OptionType<string>) => opt.label)
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
      onOptionChange={() => {}}
      label="Sélectionnez des options"
      hintText="Aucune option disponible"
    />
  )
}
