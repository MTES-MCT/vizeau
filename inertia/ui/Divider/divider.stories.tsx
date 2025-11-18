import Divider, { DividerProps } from './index.js'

const meta = {
  title: 'UI/Divider',
  component: Divider,
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
      description: 'Le texte à afficher au centre du diviseur (optionnel)',
    },
  },
  args: {
    label: 'Texte du diviseur',
  } as DividerProps,
}

export default meta

export const Défaut = {}

export const SansTexte = {
  args: {
    label: undefined,
  },
}
