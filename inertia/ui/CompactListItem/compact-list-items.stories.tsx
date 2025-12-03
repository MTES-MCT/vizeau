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
