import MetasList, { MetasListProps } from './index.js'

const meta = {
  title: 'UI/MetasList',
  component: MetasList,
  tags: ['autodocs'],
  argTypes: {
    metas: { control: 'object' },
    size: { control: 'radio', options: ['sm', 'md'] },
  },
  args: {
    metas: [
      { content: 'Meta 1', iconId: 'fr-icon-user-line' },
      { content: 'Meta 2', iconId: 'fr-icon-calendar-2-line' },
      { content: 'Meta 3', iconId: 'fr-icon-heart-line' },
      { content: 'Meta 4', iconId: 'fr-icon-map-pin-user-line' },
    ],
  } as MetasListProps,
}

export default meta

export const Défaut = {}

export const PetiteTaille = {
  args: {
    size: 'sm',
  },
}
