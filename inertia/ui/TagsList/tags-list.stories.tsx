import TagsList, { TagsListProps } from './index.js'

const meta = {
  title: 'UI/TagsList',
  component: TagsList,
  tags: ['autodocs'],
  argTypes: {
    tags: { control: 'object' },
    size: { control: 'radio', options: ['sm', 'md'] },
    limit: { control: 'number' },
  },
  args: {
    tags: [
      { label: 'Rappel', iconId: 'fr-icon-phone-line' },
      { label: 'Rendez-vous', iconId: 'fr-icon-calendar-line' },
      { label: 'Visite', iconId: 'fr-icon-user-line' },
      { label: 'Information', iconId: 'fr-icon-information-line' },
    ],
    size: 'md',
    limit: undefined,
  } as TagsListProps,
}

export default meta

export const Défaut = {}

export const PetitsTags = {
  args: {
    size: 'sm',
  },
}

export const AvecLimite = {
  args: {
    tags: [
      { label: 'Tag 1' },
      { label: 'Tag 2' },
      { label: 'Tag 3' },
      { label: 'Tag 4' },
      { label: 'Tag 5' },
      { label: 'Tag 6' },
      { label: 'Tag 7' },
      { label: 'Tag 8' },
      { label: 'Tag 9' },
      { label: 'Tag 10' },
    ],
    limit: 5,
  },
}
