import StackedProgressBar, { StackedProgressBarProps } from './index.js'

const meta = {
  title: 'UI/StackedProgressBar',
  component: StackedProgressBar,
  tags: ['autodocs'],
  argTypes: {
    segments: { control: 'object', description: 'Les segments (libellé, valeur, couleur)' },
    total: { control: 'number', description: 'Le total (par défaut, la somme des segments)' },
    size: {
      control: 'select',
      options: ['md', 'sm', 'lg'],
      description: 'La taille de la barre',
    },
  },
  args: {
    segments: [
      { label: 'Blé tendre', value: 12.4, color: '#e1c340' },
      { label: 'Maïs', value: 8.1, color: '#f08a24' },
      { label: 'Prairies permanentes', value: 5.3, color: '#5fae5c' },
    ],
    size: 'md',
  } as StackedProgressBarProps,
}

export default meta

export const Défaut = {}

export const GrandeTaille = {
  args: {
    size: 'lg',
  },
}

export const AvecPartVide = {
  args: {
    total: 40,
  },
}

export const SansSegment = {
  args: {
    segments: [],
  },
}
