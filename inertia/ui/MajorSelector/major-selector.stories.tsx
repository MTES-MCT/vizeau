import { useState } from 'react'
import MajorSelector, { MajorSelectorProps } from './index.js'

const meta = {
  title: 'UI/MajorSelector',
  component: MajorSelector,
  tags: ['autodocs'],
  decorators: [
    (Story: any, context: any) => {
      const [value, setValue] = useState(context.args.value)

      return <Story {...context.args} value={value} getValue={setValue} />
    },
  ],
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

export const Défaut = {}

export const Sélectionné = {
  args: {
    isSelected: true,
  },
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
