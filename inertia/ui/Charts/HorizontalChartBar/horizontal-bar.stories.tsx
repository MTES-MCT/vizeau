import HorizontalChartBar, { HorizontalChartBarProps } from './index.js'

const defaultItems: HorizontalChartBarProps['chartItems'] = [
  { label: 'Catégorie A', data: 420, backgroundColor: '#4E9AF1' },
  { label: 'Catégorie B', data: 310, backgroundColor: '#36A2EB' },
  { label: 'Catégorie C', data: 280, backgroundColor: '#FF6384' },
  { label: 'Catégorie D', data: 190, backgroundColor: '#FFCE56' },
  { label: 'Catégorie E', data: 150, backgroundColor: '#4BC0C0' },
]

const meta = {
  title: 'UI/Charts/HorizontalChartBar',
  component: HorizontalChartBar,
  tags: ['autodocs'],
  decorators: [
    (Story: any) => (
      <div style={{ width: '600px' }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    chartItems: {
      description: `Tableau d'objets représentant les barres horizontales.\n\nChaque objet doit suivre le modèle :\n\n\`\`\`ts\ntype ChartItem = {\n  label: string;           // nom de la catégorie (affiché dans la barre)\n  data: number;            // valeur numérique\n  backgroundColor: string; // couleur au format hexadécimal\n  tooltipValue?: number;   // valeur optionnelle affichée dans le tooltip\n}\`\`\`\n`,
      control: 'object',
    },
    xAxisLabel: {
      description: "Libellé de l'axe horizontal",
      control: 'text',
    },
    unit: {
      description: 'Unité affichée dans le tooltip',
      control: 'text',
    },
    fontSize: {
      description: 'Taille de la police des labels dans les barres',
      control: { type: 'number' },
    },
    chartHeight: {
      description: 'Hauteur du graphique en pixels (calculée automatiquement si absent)',
      control: { type: 'number' },
    },
  },
  args: {
    chartItems: defaultItems,
  } as HorizontalChartBarProps,
}

export default meta

export const Défaut = {}

export const AvecUnité = {
  args: {
    unit: 'm³',
    xAxisLabel: 'Volume',
  },
}
