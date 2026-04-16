import ScatterChart, { ScatterChartProps } from './index.js'

const defaultArgs: ScatterChartProps = {
  chartItems: [
    { x: 2023, y: 0.05, category: 'conforme', tooltipTitle: '15 mars 2023' },
    { x: 2023, y: 0.15, category: 'reglementaire', tooltipTitle: '15 mars 2023' },
    {
      x: 2024,
      y: 0.2,
      category: 'reglementaire',
      tooltipTitle: '10 juin 2024',
    },
    { x: 2024, y: 0.06, category: 'conforme', tooltipTitle: '10 juin 2024' },
    {
      x: 2025,
      y: 0.93,
      category: 'alerte',
      tooltipTitle: '7 septembre 2025',
      tooltipMessage: 'DÉPASSEMENT DE 0,8% DU SEUIL RÉGLEMENTAIRE',
    },
    {
      x: 2023.5,
      y: 1.45,
      category: 'alerte',
      tooltipTitle: '1 juillet 2023',
      tooltipMessage: 'DÉPASSEMENT DU SEUIL RÉGLEMENTAIRE',
    },
  ],
  categories: {
    conforme: { label: 'Conforme', color: '#1F3B8C', badgeSeverity: 'success' },
    reglementaire: {
      label: 'Au dessus du seuil réglementaire',
      color: '#E88A00',
      badgeSeverity: 'warning',
    },
    alerte: { label: "Au dessus du seuil d'alerte", color: '#D40000', badgeSeverity: 'error' },
  },
  thresholds: [
    { value: 1.0, label: 'Seuil réglementaire (1 µg/L)', color: '#E88A00', borderDash: [6, 4] },
    { value: 0.8, label: "Seuil d'alerte (0,8 µg/L)", color: '#D40000', borderDash: [6, 4] },
  ],
  yAxisLabel: 'Concentration [µg/L]',
  unit: 'µg/L',
}

const meta = {
  title: 'UI/Charts/ScatterChart',
  component: ScatterChart,
  tags: ['autodocs'],
  decorators: [
    (Story: any) => (
      <div style={{ width: '650px' }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    chartItems: {
      description: `Points du graphique.\n\n\`\`\`ts\ntype DataPoint = {\n  x: number              // valeur axe X (année, timestamp…)\n  y: number              // valeur axe Y\n  category: string       // clé dans "categories"\n  tooltipTitle?: string  // titre du tooltip\n  tooltipMessage?: string // message affiché dans le tooltip\n}\`\`\``,
      control: 'object',
    },
    categories: {
      description:
        'Dictionnaire des catégories de points. Clé = identifiant, valeur = { label, color, pointRadius? }',
      control: 'object',
    },
    thresholds: {
      description: 'Lignes de seuil horizontales en tirets. { value, label, color, borderDash? }',
      control: 'object',
    },
    yAxisLabel: {
      description: "Libellé de l'axe Y",
      control: 'text',
    },
    unit: {
      description: 'Unité affichée sur les ticks Y et dans le tooltip',
      control: 'text',
    },
    legendSize: {
      description: 'Taille de la légende',
      control: { type: 'radio', options: ['sm', 'md', 'lg'] },
    },
    chartHeight: {
      description: 'Hauteur du graphique en pixels',
      control: { type: 'number' },
    },
  },
  args: defaultArgs,
}

export default meta

export const Défaut = {}
