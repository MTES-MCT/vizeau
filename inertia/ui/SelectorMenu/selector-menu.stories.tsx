import SelectorMenu, { SelectorMenuProps } from './index'
import { useState } from 'react'

const meta = {
  title: 'UI/SelectorMenu',
  component: SelectorMenu,
  tags: ['autodocs'],
  decorators: [(Story: React.ComponentType) => (
      <div style={{ height: '200px' }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    options: {
      control: 'object',
      description:
        'Liste des options avec leur état de sélection et leurs actions.\n\nModèle obligatoire :\n[\n  {\n    value: string | number,\n    label: string,\n    isSelected: boolean,\n    actions?: [\n      {\n        label: string,\n        iconId?: string,\n        isCritical?: bool,\n        onClick: (value: string | number) => void,\n      }\n    ]\n  }\n]',
      type: { name: 'array', required: true },
      table: {
        type: {
          summary:
            '[{ value: string | number; label: string; isSelected: boolean; actions?: DropdownAction[] }]',
        },
        defaultValue: { summary: '[]' },
      },
    },
    onOptionChange: {
      control: false,
      description:
        "Callback appelé lors de la sélection/désélection d'une option.\n\nModèle obligatoire :\n(option: { value: string | number; label: string; isSelected: boolean; actions?: DropdownAction[] }) => void",
      type: { name: 'function', required: true },
      table: {
        type: {
          summary:
            '(option: { value: string | number; label: string; isSelected: boolean; actions?: DropdownAction[] }) => void',
        },
      },
    },
  },
  args: {} as SelectorMenuProps<string>
}

export default meta

export const Défaut = () => {
  const [options, setOptions] = useState([
      {
        value: 'option1',
        label: 'Option 1',
        isSelected: false,
        actions: [
          {
            value: 'action1',
            label: 'Action A',
            onClick: (value: string) => {
              alert(`Option supprimée : Action A pour ${value}`)
            },
          },
          {
            value: 'action2',
            label: 'Action B',
            onClick: (value: string) => {alert(`Action effectuée : Action B pour ${value}`)},
          },
        ]
      },
      { value: 'option2', label: 'Option 2', isSelected: true, actions: [] },
      { value: 'option3', label: 'Option 3', isSelected: false, actions: [] },
    ])

    const handleOptionChange = (updatedOption: { value: string; label: string; isSelected: boolean; actions?: { value: string; label: string; onClick: (value: string) => void; }[] }) => {
      setOptions((prev) =>
        prev.map((opt) => (opt.value === updatedOption.value ? { ...opt, isSelected: updatedOption.isSelected } : opt))
      )

      console.log('Option mise à jour:', updatedOption)
    }

  return (
    <div className='relative'>
      <SelectorMenu
        options={options}
        onOptionChange={(updatedOption) => {
          console.log('Option mise à jour :', updatedOption)
          handleOptionChange(updatedOption)
        }}
      />
    </div>
  )
}
