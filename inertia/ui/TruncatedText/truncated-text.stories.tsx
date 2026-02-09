import TruncatedText, { TruncatedTextProps } from './index.js'

const meta = {
  title: 'UI/TruncatedText',
  component: TruncatedText,
  tags: ['autodocs'],
  argTypes: {
    children: {
      control: 'text',
      description: 'Texte à afficher. Peut être long ou court.',
      table: {
        type: { summary: 'ReactNode' },
      },
    },
    maxLines: {
      control: 'number',
      description: 'Nombre maximum de lignes à afficher avant troncature (CSS).',
      table: {
        type: { summary: 'number' },
        defaultValue: { summary: 1 },
      },
    },
    maxStringLength: {
      control: 'number',
      description:
        'Nombre maximum de caractères à afficher avant troncature (JS). Affiche automatiquement une tooltip avec le texte complet si le texte est tronqué.',
      table: {
        type: { summary: 'number' },
      },
    },
    tooltipTitle: {
      control: 'text',
      description:
        "Texte personnalisé pour l'info-bulle. Pour maxStringLength, si non fourni, affiche le texte complet. Pour maxLines, affiche la tooltip uniquement si fourni.",
      table: {
        type: { summary: 'string' },
      },
    },
    className: {
      control: 'text',
      description: 'Classes CSS additionnelles.',
      table: {
        type: { summary: 'string' },
      },
    },
  },
  args: {
    children: 'Ceci est un texte court',
    maxLines: 1,
    className: 'fr-text--md',
    tooltipTitle: undefined,
    maxStringLength: undefined,
  } as TruncatedTextProps,
}

export default meta

export const Défaut = {}

export const TroncatureParLigne = {
  args: {
    children:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    maxLines: 2,
  },
  decorators: [
    (Story: any) => (
      <div style={{ width: '300px' }}>
        <Story />
      </div>
    ),
  ],
}

export const TroncatureParLigneAvecTooltip = {
  args: {
    children:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
    maxLines: 2,
    tooltipTitle: "Voici le texte complet qui s'affiche dans la tooltip",
  },
  decorators: [
    (Story: any) => (
      <div style={{ width: '300px' }}>
        <Story />
      </div>
    ),
  ],
}

export const TroncatureParCaractère = {
  args: {
    children:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    maxStringLength: 50,
  },
}

export const TroncatureParCaractèreAvecTooltipPersonnalisé = {
  args: {
    children:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    maxStringLength: 50,
    tooltipTitle:
      'Texte personnalisé : Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
  },
}

export const TexteNonTronquéSansTooltip = {
  args: {
    children: 'Texte court qui ne sera pas tronqué',
    maxStringLength: 100,
  },
}
