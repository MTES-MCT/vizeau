import TruncatedText, { TruncatedTextProps } from './index.js'

const meta = {
  title: 'UI/TruncatedText',
  component: TruncatedText,
  tags: ['autodocs'],
  decorators: [
    (Story: any) => (
      <div style={{ width: '300px', height: '100px' }}>
        <Story />
      </div>
    ),
  ],
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
      description:
        'Nombre maximum de lignes à afficher avant troncature (CSS). La tooltip s’affiche si tooltipTitle est fourni ou si le texte dépasse 90 caractères.',
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
        "Texte personnalisé pour l'info-bulle. Pour maxStringLength, si non fourni, affiche le texte complet. Pour maxLines, personnalise le contenu de la tooltip lorsque le texte est tronqué (une tooltip peut aussi être affichée automatiquement au-delà d’un certain seuil de longueur).",
      table: {
        type: { summary: 'string' },
      },
    },
    hideTooltip: {
      control: 'boolean',
      description:
        "Masquer l'info-bulle même si le texte est tronqué ou si tooltipTitle est fourni.",
      table: {
        type: { summary: 'boolean' },
      },
    },
  },
  args: {
    children:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    maxLines: 1,
    className: 'fr-text--md',
    tooltipTitle: undefined,
    maxStringLength: undefined,
  } as TruncatedTextProps,
}

export default meta

export const TroncatureParLigne = {}

export const TroncatureParCaractère = {
  args: {
    children:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    maxStringLength: 50,
  },
}

export const TroncatureSansTooltip = {
  args: {
    children:
      'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
    maxStringLength: 30,
    hideTooltip: true,
  },
}
