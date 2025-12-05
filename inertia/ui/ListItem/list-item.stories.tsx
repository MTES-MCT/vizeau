import ListItem, { ListItemProps } from './index.js'

const meta = {
  title: 'UI/ListItem',
  component: ListItem,
  tags: ['autodocs'],
  argTypes: {
    title: { control: 'text' },
    subtitle: { control: 'object' },
    href: { control: 'text' },
    priority: { control: 'radio', options: ['primary', 'secondary'] },
    tags: { control: 'object' },
    metas: { control: 'object' },
    actions: { control: 'object' },
  },
  args: {
    title: "Titre de l'élément de liste",
    subtitle: "Sous-titre de l'élément",
    href: undefined,
    priority: 'primary',
    tags: [
      { label: 'Tag 1', iconId: 'fr-icon-seedling-line' },
      { label: 'Tag 2', iconId: 'fr-icon-seedling-line' },
    ],
    metas: [
      { content: 'Meta 1', iconId: 'fr-icon-user-line' },
      { content: 'Meta 2', iconId: 'fr-icon-calendar-line' },
    ],
    actions: [
      { label: 'Action 1', onClick: () => alert('Action 1 clicked') },
      { label: 'Action 2', onClick: () => alert('Action 2 clicked') },
    ],
  } as ListItemProps,
}

export default meta

export const Défaut = {}

export const Secondaire = {
  args: {
    priority: 'secondary',
  },
}

export const SansSousTitre = {
  args: {
    subtitle: undefined,
  },
}

export const SansActions = {
  args: {
    actions: [],
  },
}

export const SansTagsEtMetas = {
  args: {
    tags: [],
    metas: [],
  },
}

export const ItemEnTantQueLien = {
  args: {
    href: '/exemple-de-lien',
  },
}
