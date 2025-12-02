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
      { label: 'Tag 1', severity: 'info', hasIcon: true },
      { label: 'Tag 2', severity: 'success', hasIcon: true },
      { label: 'Tag 3', severity: 'warning', hasIcon: true },
      { label: 'Tag 4', hasIcon: true },
    ],
    size: 'md',
  } as TagsListProps,
}

export default meta

export const Défaut = {}

export const PetitsTags = {
  args: {
    size: 'sm',
  },
}

export const SansIcônes = {
  args: {
    tags: [
      { label: 'Tag 1', severity: 'info', hasIcon: false },
      { label: 'Tag 2', severity: 'success', hasIcon: false },
      { label: 'Tag 3', severity: 'warning', hasIcon: false },
      { label: 'Tag 4', hasIcon: false },
    ],
  },
}
