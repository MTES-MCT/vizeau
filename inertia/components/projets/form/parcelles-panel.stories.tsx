import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, within } from 'storybook/test'

import ParcellesPanel from './parcelles-panel'
import type { SelectedParcelleFormData } from './projet-form'
import type { ExploitationParcelle, ProjetExploitation } from '~/functions/projet_parcelles'

function parcelle(rpgId: string, year: number): ExploitationParcelle {
  return { id: `id-${rpgId}`, rpgId, year, surface: 1.5, cultureCode: 'BTH', centroid: null }
}

function selected(rpgId: string, year: number): SelectedParcelleFormData {
  return { rpgId, year, surface: 1.5, cultureCode: 'BTH', centroid: { x: 0, y: 45 } }
}

const projectExploitations: ProjetExploitation[] = [
  {
    id: 'requin',
    name: 'EARL Requin',
    parcelles: [parcelle('R1', 2024), parcelle('R2', 2024), parcelle('R3', 2023)],
  },
  { id: 'rigauds', name: 'GAEC des Rigauds', parcelles: [parcelle('G1', 2024)] },
]

const meta = {
  title: 'Projets/Formulaire/ParcellesPanel',
  component: ParcellesPanel,
  parameters: {
    docs: {
      description: {
        component:
          "Panneau latéral de l'étape Parcelles du formulaire de projet : liste des parcelles sélectionnées pour le millésime affiché, avec leur origine.",
      },
    },
  },
  args: {
    projectExploitations,
    onParcelleClick: fn(),
    parcelles: {
      millesime: '2024',
      items: [selected('R1', 2024), selected('HORS1', 2024), selected('R3', 2023)],
    },
  },
} satisfies Meta<typeof ParcellesPanel>

export default meta

type Story = StoryObj<typeof meta>

export const OrigineDesParcelles: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // Seules les parcelles du millésime affiché sont listées
    await expect(canvas.getByText('Parcelle RPG R1')).toBeInTheDocument()
    await expect(canvas.getByText('Parcelle RPG HORS1')).toBeInTheDocument()
    await expect(canvas.queryByText('Parcelle RPG R3')).not.toBeInTheDocument()

    await expect(canvas.getByText('EARL Requin')).toBeInTheDocument()
    await expect(canvas.getByText('Hors exploitations du projet')).toBeInTheDocument()
  },
}

export const Vide: Story = {
  args: { parcelles: { millesime: '2024', items: [] } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('Aucune parcelle associée pour le moment')).toBeInTheDocument()
  },
}
