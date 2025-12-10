import SmallSection, { SmallSectionProps } from './index.js'

const meta = {
  title: 'UI/SmallSection',
  component: SmallSection,
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'Titre affiché en haut de la section. Doit être concis et informatif.',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'Titre de la petite section' },
      },
    },
    iconId: {
      control: 'text',
      description: 'Nom de l’icône FR à afficher à gauche du titre (ex: "map-pin-2-line").',
    },
    hasBorder: {
      control: 'boolean',
      description: 'Indique si la section doit afficher une bordure autour de son contenu.',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: false },
      },
    },
    priority: {
      control: { type: 'radio', options: ['primary', 'secondary'] },
      description: "Priorité visuelle de la section. 'primary' pour une mise en avant, 'secondary' pour un style plus discret.",
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'primary' },
      },
    },
    actionIcon: {
      control: 'text',
      description: "Nom de l'icône à afficher dans le bouton d'action (ex: 'add-circle-line').",
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'add-circle-line' },
      },
    },
    actionLabel: {
      control: 'text',
      description: "Label du bouton d'action. Permet d'expliciter l'action proposée.",
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'Ajouter' },
      },
    },
    handleAction: {
      action: 'clicked',
      description: "Fonction appelée lors du clic sur le bouton d'action.",
      table: {
        type: { summary: '() => void' },
      },
    },
    children: {
      control: 'text',
      description: 'Contenu affiché dans la section. Peut contenir du texte ou des éléments React.',
      table: {
        type: { summary: 'ReactNode' },
      },
    },
  },
  args: {
    title: 'Titre de la petite section',
    icondId: 'fr-icon-information-line',
    hasBorder: false,
    priority: 'primary',
    actionIcon: 'fr-icon-add-circle-line',
    actionLabel: 'Ajouter',
    handleAction: () => {
      alert('Action déclenchée !')
    },
    children: <p className="fr-text--sm">Contenu de la petite section.</p>,
  } as SmallSectionProps,
}

export default meta

export const Défaut = {}

export const AvecBordure = {
  args: {
    hasBorder: true
  },
}

export const Secondaire = {
  args: {
    priority: 'secondary',
  },
}

export const SansAction = {
  args: {
    title: 'Section sans action',
    actionIcon: undefined,
    actionLabel: undefined,
    handleAction: undefined,
    children: <p className="fr-text--sm">Section sans bouton d’action.</p>,
  },
}
