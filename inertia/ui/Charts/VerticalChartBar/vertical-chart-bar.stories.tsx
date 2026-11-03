import VerticalChartBar, { VerticalChartBarProps } from './index.js'

const defaultChartItems: VerticalChartBarProps['chartItems'] = {
  labels: [2023, 2024, 2025],
  datasets: [
    {
      label: 'Conforme (sans dépassement)',
      backgroundColor: '#003189',
      data: [3, 8, 4],
    },
    {
      label: 'En dépassement',
      backgroundColor: '#D40000',
      data: [6, 1, 5],
    },
  ],
  tooltipExtras: [
    { label: 'Nombre de prélèvements', data: [1, 3, 2] },
    { label: "Nombre d'analyses", data: [9, 9, 9] },
  ],
}

const meta = {
  title: 'UI/Charts/VerticalChartBar',
  component: VerticalChartBar,
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
      description: `Structure des données du graphique.\n\n\`\`\`ts\ntype ChartItems = {\n  labels: (string | number)[]       // étiquettes de l'axe X\n  datasets: {\n    label: string                   // nom de la série\n    data: number[]                  // valeurs\n    backgroundColor: string         // couleur\n  }[]\n  tooltipExtras?: {                 // lignes supplémentaires dans le tooltip\n    label: string\n    data: (string | number)[]\n  }[]\n}\n\`\`\``,
      control: 'object',
    },
    legendSize: {
      description: 'Taille de la légende',
      control: { type: 'radio', options: ['sm', 'md', 'lg'] },
    },
    yAxisLabel: {
      description: "Libellé de l'axe vertical",
      control: 'text',
    },
    unit: {
      description: 'Unité affichée dans le tooltip',
      control: 'text',
    },
    chartHeight: {
      description: 'Hauteur du graphique en pixels',
      control: { type: 'number' },
    },
  },
  args: {
    chartItems: defaultChartItems,
    yAxisLabel: "Nombre d'analyses",
  } as VerticalChartBarProps,
}

export default meta

export const Défaut = {}
