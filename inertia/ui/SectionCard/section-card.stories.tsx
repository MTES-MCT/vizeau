import SectionCard, { SectionCardProps } from './index'

const meta = {
  title: 'ui/SectionCard',
  component: SectionCard,
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'Titre affiché dans l’en-tête de la section.',
    },
    icon: {
      control: 'text',
      description: 'Nom de l’icône FR à afficher à gauche du titre (ex: "map-pin-2-line").',
    },
    size: {
      control: { type: 'radio' },
      options: ['small', 'medium'],
      description: 'Définit la taille du titre et du bouton d’action.',
    },
    background: {
      control: { type: 'radio' },
      options: ['primary', 'secondary'],
      description: 'Définit la couleur de fond de la section.',
    },
    actionIcon: {
      control: 'text',
      description: 'Nom de l’icône FR à afficher sur le bouton d’action.',
    },
    actionLabel: {
      control: 'text',
      description: 'Texte affiché sur le bouton d’action.',
    },
    handleAction: {
      action: 'clicked',
      description: 'Callback déclenché lors du clic sur le bouton d’action.',
    },
    children: {
      control: 'text',
      description: 'Contenu de la section (ReactNode).',
      table: { type: { summary: 'ReactNode' } },
    },
  },
  args: {
    title: 'Titre de la section',
    icon: 'fr-icon-map-pin-2-line',
    actionIcon: 'fr-icon-edit-line',
    actionLabel: 'Modifier',
    size: 'medium',
    background: 'primary',
    handleAction: () => alert('Action déclenchée !'),
    children: (
      <p className="fr-m-0">
        Une fois rien, c’est rien ; deux fois rien, ce n’est pas beaucoup, mais pour trois fois
        rien, on peut déjà s’acheter quelque chose, et pour pas cher. Alors maintenant si vous
        multipliez trois fois rien par trois fois rien, rien multiplié par rien égale rien, trois
        multiplié par trois égale neuf, ça fait rien de neuf.
      </p>
    ),
  } as SectionCardProps,
}

export default meta

export const Défaut = {}

export const CouleurSecondaire = {
  args: {
    background: 'secondary',
  },
}

export const SansAction = {
  args: {
    actionIcon: null,
    handleAction: null,
  },
}

export const SansIcone = {
  args: {
    icon: null,
  },
}

export const SansIconeNiAction = {
  args: {
    icon: null,
    actionIcon: null,
    handleAction: null,
  },
}
