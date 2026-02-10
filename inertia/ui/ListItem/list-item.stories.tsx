import ListItem, { ListItemProps } from './index'

const meta = {
  title: 'UI/ListItem',
  component: ListItem,
  tags: ['autodocs'],
  parameters: {
    docs: {
      description: {
        component:
          "Composant d'élément de liste personnalisable, utilisé pour afficher des informations synthétiques avec actions, tags, métadonnées, et différents styles. Supporte deux variantes (default, compact), la gestion de priorités visuelles, l'affichage conditionnel de sous-titres, tags, métadonnées, et actions contextuelles. Peut être utilisé comme lien ou simple élément de liste.",
      },
    },
  },
  argTypes: {
    variant: {
      control: 'radio',
      options: ['default', 'compact'],
      description:
        "Variante d'affichage du composant.\n- default : carte complète avec ombre,\n- compact : version condensée sans ombre, icône à gauche, bordure optionnelle.",
      table: {
        defaultValue: { summary: 'default' },
      },
    },
    title: {
      control: 'text',
      description: "Titre principal de l'élément (peut être un ReactNode). Obligatoire.",
      table: {
        type: { summary: 'string | ReactNode' },
      },
    },
    subtitle: {
      control: 'object',
      description:
        'Sous-titre affiché sous le titre (peut être un ReactNode, non affiché en mode compact).',
      table: {
        type: { summary: 'string | ReactNode' },
      },
    },
    href: {
      control: 'text',
      description:
        "URL de destination si l'élément est cliquable (mode default uniquement). Si défini, l'élément devient un lien.",
      table: {
        type: { summary: 'string' },
      },
    },
    priority: {
      control: 'radio',
      options: ['primary', 'secondary'],
      description:
        'Priorité visuelle affectant la couleur de fond.\n- primary : fond gris\n- secondary : fond bleu France',
      table: {
        defaultValue: { summary: 'primary' },
      },
    },
    iconId: {
      control: 'text',
      description:
        "Classe d'icône DSFR à afficher (utilisé en mode compact uniquement). Ex: 'fr-icon-user-line'",
    },
    hasBorder: {
      control: 'boolean',
      description: 'Affiche ou masque la bordure (mode compact uniquement).',
    },
    tags: {
      control: 'object',
      description: `Liste des tags à afficher.\nExemple : [{ label: 'Tag 1', iconId: 'fr-icon-seedling-line' }]`,
    },
    metas: {
      control: 'object',
      description: `Liste des métadonnées à afficher.\nExemple : [{ content: 'Meta 1', iconId: 'fr-icon-user-line' }]`,
    },
    actions: {
      control: 'object',
      description: `Liste des actions à afficher dans le menu contextuel.\nExemple : [{ label: 'Supprimer', onClick: () => {}, iconId: 'fr-icon-delete-line', isCritical: true }]`,
    },
    additionalInfos: {
      control: 'object',
      description: `Informations additionnelles à afficher en haut de l'élément.\nPermet d'afficher :\n- Une icône avec un message (iconId, message)\n- Une alerte avec texte et sévérité (alert: { text, severity })\nSévérités disponibles : 'infos', 'warning', 'error', 'success'\nExemple : { iconId: 'fr-icon-info-line', message: 'Information', alert: { text: 'Alerte', severity: 'warning' } }`,
      table: {
        type: { summary: 'AdditionalInfosProps' },
      },
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
    additionalInfos: {
      iconId: 'fr-icon-time-line',
      message: 'Message',
      alert: {
        text: 'Alerte importante',
        severity: 'warning',
      },
    },
  } as ListItemProps,
}

export default meta

export const Défaut = {}

export const SansInfosAdditionnelles = {
  args: {
    title: 'Élément avec toutes les infos additionnelles',
    subtitle: 'Icône, message et alerte combinés',
    additionalInfos: {},
    tags: [{ label: 'En cours' }, { label: 'Important' }],
    metas: [
      { content: 'Meta 1', iconId: 'fr-icon-user-line' },
      { content: 'Meta 2', iconId: 'fr-icon-calendar-line' },
    ],
    actions: [
      { label: 'Valider', onClick: () => alert('Validation') },
      { label: 'Rejeter', onClick: () => alert('Rejet'), isCritical: true },
    ],
  } as ListItemProps,
}

export const Secondaire = {
  args: {
    priority: 'secondary',
  },
}

export const AvecActionCritique = {
  args: {
    actions: [
      {
        label: 'Supprimer',
        onClick: () => alert('Suppression !'),
        iconId: 'fr-icon-delete-line',
        isCritical: true,
      },
      { label: 'Modifier', onClick: () => alert('Modification !'), iconId: 'fr-icon-edit-line' },
    ],
  },
}

export const ItemEnTantQueLien = {
  args: {
    href: '/exemple-de-lien',
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

export const Compact = {
  args: {
    variant: 'compact' as const,
    iconId: 'fr-icon-user-line',
    title: 'Compact List Item',
    tags: [{ label: 'Tag 1' }],
    metas: [{ content: 'Meta 1', iconId: 'fr-icon-calendar-line' }],
  } as ListItemProps,
}

export const CompactAvecInfosAdditionnelles = {
  args: {
    variant: 'compact' as const,
    iconId: 'fr-icon-user-line',
    title: 'Compact List Item',
    additionalInfos: {
      iconId: 'fr-icon-time-line',
      message: 'Message',
      alert: {
        text: 'Alerte importante',
        severity: 'warning',
      },
    },
  } as ListItemProps,
}

export const CompactAvecBordure = {
  args: {
    variant: 'compact' as const,
    title: 'Compact avec icône et bordure',
    iconId: 'fr-icon-user-line',
    hasBorder: true,
    tags: [{ label: 'Tag 1' }],
    metas: [{ content: 'Meta 1', iconId: 'fr-icon-calendar-line' }],
    actions: [{ label: 'Action', onClick: () => alert('Action') }],
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

export const infosAdditionnellesAvecSucces = {
  args: {
    iconId: 'fr-icon-user-line',
    title: 'List Item',
    additionalInfos: {
      iconId: 'fr-icon-time-line',
      message: 'Message',
      alert: {
        text: 'Bravo !',
        severity: 'success',
      },
    },
  } as ListItemProps,
}
