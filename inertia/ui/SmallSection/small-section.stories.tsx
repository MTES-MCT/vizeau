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
    actionIcon: 'add-circle-line',
    actionLabel: 'Ajouter',
    handleAction: () => {
      alert('Action déclenchée !')
    },
    children: <p className="fr-text--sm">Contenu de la petite section.</p>,
  } as SmallSectionProps,
}

export default meta

export const Défaut = {}

export const SansAction = {
  args: {
    title: 'Section sans action',
    actionIcon: null,
    actionLabel: null,
    handleAction: null,
    children: <p className="fr-text--sm">Section sans bouton d’action.</p>,
  },
}
