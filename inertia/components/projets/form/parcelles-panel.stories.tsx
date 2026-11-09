import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, within } from 'storybook/test'

import ParcellesPanel from './parcelles-panel'
import type { ProjetParcellesFormData, SelectedParcelleFormData } from './projet-form'
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
  // Aucune parcelle en 2023 : ne doit pas être proposée sur ce millésime
  { id: 'moufias', name: 'SCEA du Moufias', parcelles: [parcelle('M1', 2024)] },
]

const COMBOBOX_NAME = /Ajouter les parcelles d’une exploitation du projet/

const meta = {
  title: 'Projets/Formulaire/ParcellesPanel',
  component: ParcellesPanel,
  parameters: {
    docs: {
      description: {
        component:
          "Panneau latéral de l'étape Parcelles du formulaire de projet : ajout des parcelles d'une exploitation du projet et liste des parcelles sélectionnées pour le millésime affiché, avec leur origine.",
      },
    },
  },
  args: {
    projectExploitations,
    onParcelleClick: fn(),
    onParcellesChange: fn(),
    parcelles: {
      millesime: '2024',
      items: [selected('R1', 2024), selected('HORS1', 2024), selected('R3', 2023)],
      addedExploitationIds: {},
    },
  },
  // Le panneau est contrôlé : la story garde la sélection dans un état local
  render: function Render(args) {
    const [parcelles, setParcelles] = useState<ProjetParcellesFormData>(args.parcelles)
    return (
      <ParcellesPanel
        {...args}
        parcelles={parcelles}
        onParcellesChange={(next) => {
          args.onParcellesChange(next)
          setParcelles(next)
        }}
      />
    )
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
  args: { parcelles: { millesime: '2024', items: [], addedExploitationIds: {} } },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await expect(canvas.getByText('Aucune parcelle associée pour le moment')).toBeInTheDocument()
  },
}

export const AjoutExploitationAuClavier: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const combobox = canvas.getByRole('combobox', { name: COMBOBOX_NAME })

    await userEvent.type(combobox, 'rig')
    await expect(combobox).toHaveAttribute('aria-expanded', 'true')
    await expect(canvas.getAllByRole('option').map((o) => o.textContent)).toEqual([
      'GAEC des Rigauds',
    ])
    await expect(combobox).toHaveAttribute(
      'aria-activedescendant',
      canvas.getByRole('option', { name: 'GAEC des Rigauds' }).id
    )

    await userEvent.keyboard('{Enter}')

    await expect(canvas.getByText('Parcelle RPG G1')).toBeInTheDocument()
    await expect(canvas.getByText('1 parcelle ajoutée depuis GAEC des Rigauds')).toBeInTheDocument()
    await expect(combobox).toHaveValue('')
    await expect(combobox).toHaveAttribute('aria-expanded', 'false')
    await expect(args.onParcellesChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ addedExploitationIds: { 2024: ['rigauds'] } })
    )

    // L'exploitation ajoutée n'est plus proposée
    await userEvent.click(combobox)
    await expect(canvas.queryByRole('option', { name: 'GAEC des Rigauds' })).toBeNull()

    // Échap ferme la liste
    await userEvent.keyboard('{Escape}')
    await expect(combobox).toHaveAttribute('aria-expanded', 'false')
  },
}

export const AjoutExploitationDejaPartiellementSelectionnee: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const combobox = canvas.getByRole('combobox', { name: COMBOBOX_NAME })

    // R1 est déjà sélectionnée : seule R2 est ajoutée, sans doublon
    await userEvent.click(combobox)
    await userEvent.click(canvas.getByRole('option', { name: 'EARL Requin' }))

    await expect(canvas.getAllByText('Parcelle RPG R1')).toHaveLength(1)
    await expect(canvas.getByText('Parcelle RPG R2')).toBeInTheDocument()
    await expect(canvas.getByText('1 parcelle ajoutée depuis EARL Requin')).toBeInTheDocument()
  },
}

export const MillesimeSansParcellePourUneExploitation: Story = {
  args: {
    parcelles: { millesime: '2023', items: [], addedExploitationIds: {} },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('combobox', { name: COMBOBOX_NAME }))

    // En 2023, seule EARL Requin a des parcelles
    await expect(canvas.getAllByRole('option').map((o) => o.textContent)).toEqual(['EARL Requin'])
  },
}

export const ToutesLesExploitationsAjoutees: Story = {
  args: {
    parcelles: {
      millesime: '2024',
      items: [],
      addedExploitationIds: { 2024: ['requin', 'rigauds', 'moufias'] },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('combobox', { name: COMBOBOX_NAME }))
    await expect(
      canvas.getByText('Toutes les exploitations du projet ont été ajoutées')
    ).toBeInTheDocument()
  },
}
