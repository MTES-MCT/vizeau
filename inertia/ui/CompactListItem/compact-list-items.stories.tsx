import CompactListItem, { CompactListItemProps } from './index.js'

const meta = {
  title: 'UI/CompactListItem',
  component: CompactListItem,
  tags: ['autodocs'],
  argTypes: {
    label: {
      control: 'text',
      description: 'Libellé principal affiché en gras',
      table: {
        type: { summary: 'string' },
      },
    },
    iconId: {
      control: 'text',
      description: "ID de l'icône DSFR à afficher à gauche du libellé (optionnel)",
      table: {
        type: { summary: 'string | undefined' },
      },
    },
    tags: {
      control: 'object',
      description: 'Liste des badges/étiquettes à afficher',
      table: {
        type: {
          summary: 'Array<Tag>',
          detail: `{
  label: string;           // Texte du badge
  iconId?: string;         // ID de l'icône DSFR optionnel
}[]`,
        },
      },
    },
    metas: {
      control: 'object',
      description: 'Liste des métadonnées avec icône à afficher en bas',
      table: {
        type: {
          summary: 'Array<Meta>',
          detail: `{
  content: string;          // Texte de la métadonnée
  iconId: string;           // ID de l'icône DSFR (ex: 'fr-icon-calendar-line')
}[]`,
        },
      },
    },
    actions: {
      control: 'object',
      description: 'Liste des actions disponibles dans le menu contextuel',
      table: {
        type: {
          summary: 'Array<Action>',
          detail: `{
  label: string;            // Libellé de l'action
  iconId?: string;          // ID de l'icône DSFR optionnel
  isCritical?: boolean;     // Afficher en rouge pour les actions critiques
  onClick: () => void;      // Fonction appelée au clic
}[]`,
        },
      },
    },
  },
  args: {
    label: 'Compact List Item Example',
    iconId: 'fr-icon-user-line',
    tags: [
      { label: 'Tag 1', iconId: 'fr-icon-check-line' },
      { label: 'Tag 2', iconId: 'fr-icon-star-line' },
      { label: 'Tag 3' },
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
    label:
      'This is a very long label to test how the CompactListItem component handles overflow and text wrapping in its layout',
  },
}

export const AvecBeaucoupDeTags = {
  args: {
    tags: [
      { label: 'Tag 1', iconId: 'fr-icon-check-line' },
      { label: 'Tag 2', iconId: 'fr-icon-star-line' },
      { label: 'Tag 3' },
      { label: 'Tag 4', iconId: 'fr-icon-alert-line' },
      { label: 'Tag 5' },
      { label: 'Tag 6', iconId: 'fr-icon-heart-line' },
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
