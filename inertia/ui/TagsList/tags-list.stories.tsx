import TagsList, { TagsListProps } from './index.js'

const meta = {
  title: 'UI/TagsList',
  component: TagsList,
  tags: ['autodocs'],
  argTypes: {
    tags: { control: 'object' },
    size: { control: 'radio', options: ['sm', 'md'] },
  },
  args: {
    tags: [
      {label: 'Rappel', iconId: 'fr-icon-phone-line' },
      {label: 'Rendez-vous', iconId: 'fr-icon-calendar-line' },
      {label: 'Visite', iconId: 'fr-icon-user-line' },
      {label: 'Information', iconId: 'fr-icon-information-line' },
    ],
    size: 'sm',
  } as TagsListProps,
}

export default meta

export const Défaut = {}

export const PetitsTags = {
  args: {
    size: 'sm',
  }
}
