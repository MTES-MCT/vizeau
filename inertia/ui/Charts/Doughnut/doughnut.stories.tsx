import Doughnut, { DoughnutProps } from './index.js'

const meta = {
  title: 'UI/Charts/Doughnut',
  component: Doughnut,
  tags: ['autodocs'],
  decorators: [
    (Story: any) => (
      <div style={{ width: '400px', height: '400px' }}>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    chartItems: {
      description: `Tableau d'objets représentant les éléments du graphique en camembert.\n\nChaque objet doit suivre le modèle :\n\n\u0060\u0060\u0060ts\ntype ChartItem = {\n  data: number; // valeur numérique à afficher\n  label: string; // nom de la catégorie\n  backgroundColor: string; // couleur au format hexadécimal\n}\u0060\u0060\u0060\n\nExemple complet :\n\u0060\u0060\u0060js\n[\n  { data: 300, label: 'Rouge', backgroundColor: '#FF6384' },\n  { data: 50, label: 'Bleu', backgroundColor: '#36A2EB' },\n  { data: 100, label: 'Jaune', backgroundColor: '#FFCE56' }\n]\n\u0060\u0060\u0060\n`,
      control: 'object',
      defaultValue: [
        { data: 300, label: 'Rouge', backgroundColor: '#FF6384' },
        { data: 50, label: 'Bleu', backgroundColor: '#36A2EB' },
        { data: 100, label: 'Jaune', backgroundColor: '#FFCE56' },
      ],
    },
    legendSize: {
      description: 'La taille des éléments de la légende',
      control: { type: 'radio', options: ['sm', 'md', 'lg'] },
      defaultValue: 'md',
    },
    legendSide: {
      description: 'Le côté où afficher la légende',
      control: { type: 'radio', options: ['top', 'left', 'bottom', 'right'] },
      defaultValue: 'right',
    },
  },
  args: {
    chartItems: [
      { data: 300, label: 'Rouge', backgroundColor: '#FF6384' },
      { data: 50, label: 'Bleu', backgroundColor: '#36A2EB' },
      { data: 100, label: 'Jaune', backgroundColor: '#FFCE56' },
    ],
  } as DoughnutProps,
}

export default meta

export const Défaut = {}

export const AvecLégendeEnHaut = {
  args: {
    legendSide: 'top',
  },
}

export const AvecLégendeÀGauche = {
  args: {
    legendSide: 'left',
  },
}

export const AvecLégendeEnBas = {
  args: {
    legendSide: 'bottom',
  },
}

export const LégendePetite = {
  args: {
    legendSize: 'sm',
  },
}

export const LégendeGrande = {
  args: {
    legendSize: 'lg',
  },
}
