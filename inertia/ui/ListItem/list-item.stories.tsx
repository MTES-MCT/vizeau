import ListItem, { ListItemProps } from './index'

const meta = {
  title: 'UI/ListItem',
  component: ListItem,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'radio',
      options: ['default', 'compact'],
      description: 'Variante d\'affichage du composant. Default: carte complète avec ombre, Compact: version condensée sans ombre'
    },
    title: {
      control: 'text',
      description: 'Titre principal de l\'élément (peut être un ReactNode)'
    },
    subtitle: {
      control: 'object',
      description: 'Sous-titre affiché sous le titre (peut être un ReactNode, non affiché en mode compact)'
    },
    href: {
      control: 'text',
      description: 'URL de destination si l\'élément est cliquable (mode default uniquement)'
    },
    priority: {
      control: 'radio',
      options: ['primary', 'secondary'],
      description: 'Priorité visuelle affectant la couleur de fond. Primary: gris, Secondary: bleu France'
    },
    iconId: {
      control: 'text',
      description: 'Classe d\'icône DSFR à afficher (utilisé en mode compact uniquement)'
    },
    hasBorder: {
      control: 'boolean',
      description: 'Affiche ou masque la bordure (mode compact uniquement)',
    },
    tags: {
      control: 'object',
      description: `Liste des tags à afficher.\n{
    label: string;
    iconId?: string;
  }`,
    },
    metas: {
      control: 'object',
      description: `Liste des métadonnées à afficher.\n{
    content: string;
    iconId?: string;
  }`,
    },
    actions: {
      control: 'object',
      description: `Liste des actions à afficher dans le menu contextuel.\n{
    label: string;
    onClick: () => void;
    iconId?: string;
    isCritical?: boolean;
  }`,
    },
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

export const CompactSansActions = {
  args: {
    variant: 'compact' as const,
    iconId: 'fr-icon-user-line',
    title: 'Compact List Item',
    actions: [],
    tags: [{ label: 'Tag 1' }],
    metas: [{ content: 'Meta 1', iconId: 'fr-icon-calendar-line' }],
  } as ListItemProps,
}

export const CompactSansMetas = {
  args: {
    variant: 'compact' as const,
    title: 'Compact List Item',
    iconId: 'fr-icon-user-line',
    metas: [],
    tags: [{ label: 'Tag 1' }],
    actions: [{ label: 'Action 1', onClick: () => alert('Action 1') }],
  } as ListItemProps,
}

export const CompactSansTags = {
  args: {
    variant: 'compact' as const,
    title: 'Compact List Item',
    iconId: 'fr-icon-user-line',
    tags: [],
    metas: [{ content: 'Meta 1', iconId: 'fr-icon-calendar-line' }],
    actions: [{ label: 'Action 1', onClick: () => alert('Action 1') }],
  } as ListItemProps,
}

export const CompactAvecLongLabel = {
  args: {
    variant: 'compact' as const,
    title:
      'This is a very long label to test how the compact variant handles overflow and text wrapping in its layout',
    iconId: 'fr-icon-user-line',
    tags: [{ label: 'Tag 1' }],
    metas: [{ content: 'Meta 1', iconId: 'fr-icon-calendar-line' }],
    actions: [],
  } as ListItemProps,
}

export const CompactAvecBordure = {
  args: {
    variant: 'compact' as const,
    title: 'Compact List Item avec bordure',
    iconId: 'fr-icon-user-line',
    hasBorder: true,
    tags: [{ label: 'Tag 1' }],
    metas: [{ content: 'Meta 1', iconId: 'fr-icon-calendar-line' }],
    actions: [{ label: 'Action 1', onClick: () => alert('Action 1') }],
  } as ListItemProps,
}
