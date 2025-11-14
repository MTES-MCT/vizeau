import { useState } from 'react'
import MajorSelector, { MajorSelectorProps } from './index.js'

const meta = {
  title: 'UI/MajorSelector',
  component: MajorSelector,
  tags: ['autodocs'],
  argTypes: {
    value: {
      control: 'text',
      description: 'La valeur associée au sélecteur principal.',
    },
    label: {
      control: 'text',
      description: 'Le libellé affiché pour le sélecteur principal.',
    },
    icon: {
      control: 'text',
      description: "Le nom de l'icône à afficher dans le sélecteur principal.",
    },
    isSelected: {
      control: 'boolean',
      description: 'Indique si le sélecteur principal est sélectionné.',
    },
    getValue: {
      action: 'getValue',
      description: 'Fonction permettant de récupérer la valeur.',
    },
  },
  args: {
    value: 'major-1',
    label: 'Major Selector 1',
    icon: 'star-line',
    isSelected: false,
    getValue: () => {},
  } as MajorSelectorProps,
}

export default meta

const InteractiveTemplate = (args: MajorSelectorProps) => {
  const [selectedValue, setSelectedValue] = useState<string | null>(null)
  const isSelected = selectedValue === args.value

  return (
    <MajorSelector
      {...args}
      isSelected={isSelected}
      getValue={(val: string) => setSelectedValue(val)}
    />
  )
}

export const Défaut = {}

export const Sélectionné = {
  args: {
    isSelected: true,
  },
}

export const TestDeSélection = {
  render: InteractiveTemplate,
}

export const SansLibellé = {
  args: {
    label: undefined,
  },
}

export const SansIcône = {
  args: {
    icon: undefined,
  },
}
