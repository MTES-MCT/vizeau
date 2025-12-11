import { useState } from 'react'
import ButtonWithSelector, { ButtonWithSelectorProps, OptionType } from './index.js'

import { fr } from '@codegouvfr/react-dsfr'

const meta = {
  title: 'UI/ButtonWithSelector',
  component: ButtonWithSelector,
  tags: ['autodocs'],
  decorators: [
    (Story: React.ComponentType) => (
      <div style={{ height: '200px' }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    label: {
      control: 'text',
      description: 'Texte affiché sur le bouton.',
      type: { name: 'string', required: true },
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: '""' },
      },
    },
    priority: {
      control: 'select',
      options: ['primary', 'secondary', 'tertiary', 'tertiary no outline'],
      description:
        "Priorité visuelle du bouton.\n\nValeurs possibles : 'primary', 'secondary', 'tertiary', 'tertiary no outline'.\n\nPar défaut : 'secondary'.",
      type: { name: 'string', required: false },
      table: {
        type: { summary: "'primary' | 'secondary' | 'tertiary' | 'tertiary no outline'" },
        defaultValue: { summary: "'secondary'" },
      },
    },
    handleClick: {
      control: false,
      description:
        'Callback appelé lors du clic sur le bouton.\n\nModèle obligatoire :\n() => void',
      type: { name: 'function', required: true },
      table: {
        type: { summary: '() => void' },
      },
    },
    options: {
      control: false,
      description:
        'Liste des options disponibles dans le sélecteur.\n\nChaque option peut contenir des actions associées.\n\nModèle obligatoire :\nOptionType<T>[]',
      type: { name: 'array', required: true },
      table: {
        type: { summary: 'OptionType<T>[]' },
      },
    },
    onOptionChange: {
      control: false,
      description:
        "Callback appelé lorsqu'une option est sélectionnée ou désélectionnée.\n\nModèle obligatoire :\n(updatedOption: OptionType<T>) => void",
      type: { name: 'function', required: true },
      table: {
        type: { summary: '(updatedOption: OptionType<T>) => void' },
      },
    },
  },
  args: {
    label: 'Cliquez-moi',
    options: [
      {
        value: 'option1',
        label: 'Option 1',
        isSelected: false,
        actions: [
          {
            value: 'action1',
            label: 'Action A',
            onClick: (value: string) => {
              alert(`Action effectuée : Action A pour ${value}`)
            },
          },
          {
            value: 'action2',
            label: 'Action B',
            isCritical: true,
            onClick: (value: string) => {
              alert(`Action effectuée : Action B pour ${value}`)
            },
          },
        ],
      },
      {
        value: 'option2',
        label: 'Option 2',
        isSelected: true,
      },
      {
        value: 'option3',
        label: 'Option 3',
        isSelected: false,
      },
    ],
    onOptionChange: (updatedOption: OptionType<string>) => {
      alert(
        `Option mise à jour : ${updatedOption.label}, sélectionnée : ${updatedOption.isSelected}`
      )
    },
    priority: 'secondary',
  } as ButtonWithSelectorProps<string>,
}

export default meta

export const Défaut = () => {
  const [options, setOptions] = useState<OptionType<string>[]>([
    {
      value: 'option1',
      label: 'Option 1',
      isSelected: false,
      actions: [
        {
          value: 'action1',
          label: 'Action A',
          onClick: (value: string) => alert(`Action effectuée : Action A pour ${value}`),
        },
        {
          value: 'action2',
          label: 'Action B',
          onClick: (value: string) => alert(`Action effectuée : Action B pour ${value}`),
        },
      ],
    },
    { value: 'option2', label: 'Option 2', isSelected: true },
    { value: 'option3', label: 'Option 3', isSelected: false },
  ])

  const handleOptionChange = (updatedOption: OptionType<string>) => {
    setOptions((prev) =>
      prev.map((opt) => (opt.value === updatedOption.value ? updatedOption : opt))
    )
    console.log('Option mise à jour:', updatedOption)
  }

  return (
    <div>
      <ButtonWithSelector
        label="Cliquez sur moi !"
        options={options}
        onOptionChange={handleOptionChange}
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
