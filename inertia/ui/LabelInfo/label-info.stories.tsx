import LabelInfo, { LabelInfoProps } from './index'

const meta = {
  title: 'UI/LabelInfo',
  component: LabelInfo,
  tags: ['autodocs'],
  argTypes: {
    icon: { control: 'text' },
    label: { control: 'text' },
    info: { control: 'text' },
    size: {
      control: { type: 'select' },
      options: ['sm', 'md'],
    },
  },
  args: {
    icon: 'fr-icon-info-line',
    label: 'Label',
    info: 'info',
    size: 'md',
  } as LabelInfoProps,
}

export default meta

export const Défaut = {}

export const Petit = {
  args: {
    size: 'sm',
  },
}

export const SansIcône = {
  args: {
    icon: null,
  },
}

export const LongueInfo = {
  args: {
    info: 'Ceci est une information très longue qui doit démontrer comment le composant gère le texte qui dépasse normalement la largeur disponible dans son conteneur parent.',
  },
}

export const SansInfo = {
  args: {
    info: undefined,
  },
}
