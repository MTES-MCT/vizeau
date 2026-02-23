import LegendItem, { LegendItemProps } from './index.js'

const meta = {
  title: 'UI/LegendItem',
  component: LegendItem,
  tags: ['autodocs'],
  argTypes: {
    hint: { control: 'text', description: "Texte affiché dans l'infobulle" },
    label: { control: 'text', description: 'Texte affiché à côté de la couleur' },
    color: {
      control: 'text',
      description: 'Couleur de la légende (classe Tailwind ou couleur CSS)',
    },
    checked: { control: 'boolean', description: 'Indique si la légende est cochée' },
    disabled: { control: 'boolean', description: 'Indique si la légende est désactivée' },
    onChange: {
      action: 'changed',
      description: "Action déclenchée lors du changement de l'état de la légende",
    },
  },
  args: {
    hint: 'Ceci est une légende',
    label: 'Légende',
    color: 'bg-blue-500',
    checked: true,
    disabled: false,
    onChange: () => {},
  } as LegendItemProps,
}

export default meta

export const Défaut = {}

export const SansCouleur = {
  args: {
    color: undefined,
  },
}

export const Désactivé = {
  args: {
    disabled: true,
    checked: false,
  },
}
