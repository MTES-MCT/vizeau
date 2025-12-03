import CompactListItem, { CompactListItemProps } from './index.js'

const meta = {
  title: 'UI/CompactListItem',
  component: CompactListItem,
  tags: ['autodocs'],
  argTypes: {
    // Définir les argTypes si nécessaire
  },
  args: {
    label: 'Compact List Item Example',
    tags: [
      { label: 'Tag 1', severity: 'info', hasIcon: true },
      { label: 'Tag 2', severity: 'success', hasIcon: true },
      { label: 'Tag 3', severity: 'warning', hasIcon: false },
    ],
    metas: [
      { content: 'Meta 1', iconId: 'fr-icon-calendar-line' },
      { content: 'Meta 2', iconId: 'fr-icon-user-line' },
    ],
    actions: [
      {
        label: 'Action 1',
        iconId: 'fr-icon-edit-fill',
        onClick: () => alert('Action 1 clicked'),
      },
      {
        label: 'Action 2',
        iconId: 'fr-icon-delete-bin-fill',
        isCritical: true,
        onClick: () => alert('Action 2 clicked'),
      },
    ],
  } as CompactListItemProps,
}

export default meta

export const Défaut = {}

export const SansActions = {
  args: {
    actions: [],
  },
}

export const SansMetas = {
  args: {
    metas: [],
  },
}

export const SansTags = {
  args: {
    tags: [],
  },
}

export const AvecLongLabel = {
  args: {
    label: 'This is a very long label to test how the CompactListItem component handles overflow and text wrapping in its layout',
  },
}

export const AvecBeaucoupDeTags = {
  args: {
    tags: [
      { label: 'Tag 1', severity: 'info', hasIcon: true },
      { label: 'Tag 2', severity: 'success', hasIcon: true },
      { label: 'Tag 3', severity: 'warning', hasIcon: false },
      { label: 'Tag 4', severity: 'error', hasIcon: true },
      { label: 'Tag 5', severity: 'info', hasIcon: false },
      { label: 'Tag 6', severity: 'success', hasIcon: true },
    ],
  },
}

export const AvecBeaucoupDeMetas = {
  args: {
    metas: [
      { content: 'Meta 1', iconId: 'fr-icon-calendar-line' },
      { content: 'Meta 2', iconId: 'fr-icon-user-line' },
      { content: 'Meta 3', iconId: 'fr-icon-map-pin-line' },
      { content: 'Meta 4', iconId: 'fr-icon-clock-line' },
    ],
  },
}
