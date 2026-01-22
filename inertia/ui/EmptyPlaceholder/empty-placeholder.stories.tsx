import EmptyPlaceholder, { EmptyPlaceholderProps } from './index'
import Ecosystem from '@codegouvfr/react-dsfr/picto/Ecosystem'

const meta = {
  title: 'UI/EmptyPlaceholder',
  component: EmptyPlaceholder,
  tags: ['autodocs'],
  argTypes: {
    priority: {
      control: 'radio',
      options: ['primary', 'secondary'],
      description: 'Priorité visuelle du placeholder (fond coloré ou transparent)',
      table: {
        defaultValue: { summary: 'primary' },
        type: { summary: "'primary' | 'secondary'" },
      },
    },
    size: {
      control: 'radio',
      options: ['md', 'lg'],
      description: 'Taille du placeholder (medium ou large)',
      table: {
        defaultValue: { summary: 'md' },
        type: { summary: "'md' | 'lg'" },
      },
    },
    label: {
      control: 'text',
      description: 'Texte principal affiché',
      table: {
        type: { summary: 'string' },
      },
    },
    pictogram: {
      control: 'object',
      description: 'Composant pictogramme React DSFR (ex: Ecosystem)',
      table: {
        type: { summary: 'React.ElementType' },
      },
    },
    illustrativeIcon: {
      control: 'text',
      description: "Classe CSS d'icône illustrative du DSFR (ex: fr-icon-heavy-showers-line)",
      table: {
        type: { summary: 'string' },
      },
    },
    illustrationSrc: {
      control: 'text',
      description: "URL de l'image d'illustration personnalisée",
      table: {
        type: { summary: 'string' },
      },
    },
    hint: {
      control: 'text',
      description: "Texte d'aide secondaire affiché sous le label",
      table: {
        type: { summary: 'string' },
      },
    },
    buttonLabel: {
      control: 'text',
      description: "Label du bouton d'action",
      table: {
        type: { summary: 'string' },
      },
    },
    actionAriaLabel: {
      control: 'text',
      description: "Label aria pour l'accessibilité du bouton",
      table: {
        type: { summary: 'string' },
      },
    },
    buttonIcon: {
      control: 'text',
      description: "Icône du bouton d'action (ex: fr-icon-add-circle-line)",
      table: {
        type: { summary: 'string' },
      },
    },
    handleClick: {
      action: 'clicked',
      description: 'Fonction appelée au clic sur le bouton',
      table: {
        type: { summary: '() => void' },
      },
    },
  },
  args: {
    priority: 'primary',
    size: 'md',
    label: 'Aucun élément à afficher',
    pictogram: Ecosystem,
    hint: 'Il n’y a actuellement aucun élément disponible dans cette section.',
    buttonLabel: 'Ajouter un élément',
    actionAriaLabel: 'Ajouter un élément',
    buttonIcon: 'fr-icon-add-circle-line',
  } as EmptyPlaceholderProps,
}

export default meta

export const Défaut = {}

export const AvecIllustrativeIcon = {
  args: {
    pictogram: undefined,
    illustrativeIcon: 'fr-icon-heavy-showers-line',
  },
}

export const AvecImageSrc = {
  args: {
    priority: 'secondary',
    pictogram: undefined,
    illustrativeIcon: undefined,
    illustrationSrc: '/placeholder-illustrations/journal-colored.png',
    label: 'Aucune illustration disponible',
    hint: 'Utilisez une image personnalisée comme placeholder',
  },
}

export const TailleGrande = {
  args: {
    size: 'lg',
    label: 'Aucune donnée disponible',
    hint: 'Commencez par créer votre premier élément',
  },
}

export const PrioritéSecondaire = {
  args: {
    priority: 'secondary',
    label: 'Liste vide',
    hint: 'Cette section ne contient pas encore de données',
  },
}

export const SansBouton = {
  args: {
    buttonLabel: undefined,
    actionAriaLabel: undefined,
    buttonIcon: undefined,
    handleClick: undefined,
    label: 'Aucun résultat',
    hint: 'Aucun élément ne correspond à vos critères de recherche',
  },
}

export const SansIllustration = {
  args: {
    pictogram: undefined,
    illustrativeIcon: undefined,
    illustrationSrc: undefined,
    label: 'Contenu vide',
    hint: 'Placeholder sans illustration',
  },
}

export const SansHint = {
  args: {
    hint: undefined,
    label: 'Pas de données',
  },
}

export const Minimal = {
  args: {
    pictogram: undefined,
    illustrativeIcon: undefined,
    illustrationSrc: undefined,
    hint: undefined,
    buttonLabel: undefined,
    actionAriaLabel: undefined,
    buttonIcon: undefined,
    handleClick: undefined,
    priority: 'secondary',
    label: 'Aucun élément',
  },
}
