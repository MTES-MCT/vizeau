import { useState } from 'react'
import type { Meta, StoryObj } from '@storybook/react-vite'
import { expect, fn, userEvent, waitFor, within } from 'storybook/test'

import ParcellesPanel from './parcelles-panel'
import type { ProjetParcellesFormData, SelectedParcelleFormData } from './projet-form'
import {
  deriveAddedExploitationIds,
  toggleParcelle,
  type ExploitationParcelle,
  type ProjetExploitation,
} from '~/functions/projet_parcelles'

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

const MAP_RPG_IDS = ['R1', 'R2', 'HORS1']

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
  /*
   * Le panneau est contrôlé : la story garde la sélection dans un état local. Des boutons
   * remplacent la carte pour simuler un clic sur une parcelle et un changement de millésime.
   */
  render: function Render(args) {
    const [parcelles, setParcelles] = useState<ProjetParcellesFormData>(args.parcelles)
    const update = (next: ProjetParcellesFormData) => {
      args.onParcellesChange(next)
      setParcelles(next)
    }
    return (
      <div className="flex flex-col gap-4">
        <div className="flex flex-wrap gap-2" aria-label="Carte simulée" role="group">
          {MAP_RPG_IDS.map((rpgId) => (
            <button
              key={rpgId}
              type="button"
              className="fr-btn fr-btn--tertiary fr-btn--sm"
              onClick={() =>
                update(
                  toggleParcelle(
                    parcelles,
                    { rpgId, surface: 1.5, cultureCode: 'BTH', centroid: { x: 0, y: 45 } },
                    args.projectExploitations
                  )
                )
              }
            >
              Clic carte {rpgId}
            </button>
          ))}
          {['2024', '2023'].map((millesime) => (
            <button
              key={millesime}
              type="button"
              className="fr-btn fr-btn--tertiary fr-btn--sm"
              onClick={() => update({ ...parcelles, millesime })}
            >
              RPG {millesime}
            </button>
          ))}
        </div>
        <ParcellesPanel {...args} parcelles={parcelles} onParcellesChange={update} />
      </div>
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
    await expect(
      canvas.getByText('Aucune parcelle sélectionnée pour le moment')
    ).toBeInTheDocument()
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

const existingItems = [selected('R1', 2024), selected('G1', 2024), selected('R3', 2023)]

export const ProjetExistant: Story = {
  args: {
    parcelles: {
      millesime: '2024',
      items: existingItems,
      addedExploitationIds: deriveAddedExploitationIds(existingItems, projectExploitations),
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    await userEvent.click(canvas.getByRole('combobox', { name: COMBOBOX_NAME }))

    // Les exploitations dont des parcelles sont déjà enregistrées sont considérées comme ajoutées
    await expect(canvas.getAllByRole('option').map((o) => o.textContent)).toEqual([
      'SCEA du Moufias',
    ])
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

// EARL Requin a été ajoutée (R1), puis R2 a été cliquée sur la carte ; R3 est sélectionnée en 2023
const withRequinAdded: ProjetParcellesFormData = {
  millesime: '2024',
  items: [
    selected('R1', 2024),
    selected('R2', 2024),
    selected('HORS1', 2024),
    selected('R3', 2023),
  ],
  addedExploitationIds: { 2024: ['requin'] },
}

const REQUIN_TAG_NAME = 'Retirer l’exploitation EARL Requin et ses parcelles'

export const RetraitExploitationAvecParcellesCliquees: Story = {
  args: { parcelles: withRequinAdded },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const page = within(canvasElement.ownerDocument.body)

    await userEvent.click(canvas.getByRole('button', { name: REQUIN_TAG_NAME }))

    const dialog = await page.findByRole('dialog', { name: 'Retirer EARL Requin du projet ?' })
    await expect(
      within(dialog).getByText(/Les 2 parcelles sélectionnées de cette exploitation/)
    ).toBeInTheDocument()
    await userEvent.click(within(dialog).getByRole('button', { name: 'Retirer l’exploitation' }))

    await expect(canvas.queryByText('Parcelle RPG R1')).not.toBeInTheDocument()
    await expect(canvas.queryByText('Parcelle RPG R2')).not.toBeInTheDocument()
    await expect(canvas.getByText('Parcelle RPG HORS1')).toBeInTheDocument()
    await expect(canvas.queryByRole('button', { name: REQUIN_TAG_NAME })).toBeNull()
    await expect(canvas.getByText('EARL Requin retirée, 2 parcelles retirées')).toBeInTheDocument()

    // Les autres millésimes ne sont pas touchés
    await expect(args.onParcellesChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        items: [selected('HORS1', 2024), selected('R3', 2023)],
        addedExploitationIds: { 2024: [] },
      })
    )

    // Le focus revient sur le champ d'ajout, qui propose de nouveau l'exploitation
    const combobox = canvas.getByRole('combobox', { name: COMBOBOX_NAME })
    await waitFor(() => expect(combobox).toHaveFocus())
    await userEvent.click(combobox)
    await expect(canvas.getByRole('option', { name: 'EARL Requin' })).toBeInTheDocument()
  },
}

export const AnnulationDuRetrait: Story = {
  args: { parcelles: withRequinAdded },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const page = within(canvasElement.ownerDocument.body)
    const tag = canvas.getByRole('button', { name: REQUIN_TAG_NAME })

    await userEvent.click(tag)
    const dialog = await page.findByRole('dialog', { name: 'Retirer EARL Requin du projet ?' })
    await userEvent.click(within(dialog).getByRole('button', { name: 'Annuler' }))

    await waitFor(() => expect(tag).toHaveFocus())
    await expect(canvas.getByText('Parcelle RPG R1')).toBeInTheDocument()
    await expect(args.onParcellesChange).not.toHaveBeenCalled()
  },
}

export const RetraitParLaCartePuisRajout: Story = {
  args: { parcelles: withRequinAdded },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    await expect(canvas.getByRole('tab', { name: 'Sélectionnées (3)' })).toBeInTheDocument()
    await userEvent.click(canvas.getByRole('tab', { name: 'EARL Requin (2)' }))
    await expect(canvas.getByText('2 sur 2 dans le projet')).toBeInTheDocument()
    await expect(canvas.queryByText('Retirée du projet')).toBeNull()

    // Un clic sur la carte retire R2 : compteurs et statut suivent
    await userEvent.click(canvas.getByRole('button', { name: 'Clic carte R2' }))
    await expect(canvas.getByRole('tab', { name: 'Sélectionnées (2)' })).toBeInTheDocument()
    await expect(canvas.getByText('1 sur 2 dans le projet')).toBeInTheDocument()
    await expect(canvas.getAllByText('Retirée du projet')).toHaveLength(1)

    await userEvent.click(canvas.getByRole('button', { name: 'Rajouter la parcelle retirée' }))
    // Le bouton a disparu : le focus reste dans le panneau de l'onglet
    await expect(canvas.getByRole('tabpanel')).toContainElement(
      canvasElement.ownerDocument.activeElement as HTMLElement
    )
    await expect(canvas.queryByText('Retirée du projet')).toBeNull()
    await expect(canvas.getByRole('tab', { name: 'Sélectionnées (3)' })).toBeInTheDocument()
    await expect(canvas.getByText('1 parcelle rajoutée depuis EARL Requin')).toBeInTheDocument()
  },
}

export const RetraitDeLExploitationDeLOngletActif: Story = {
  args: { parcelles: withRequinAdded },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    const page = within(canvasElement.ownerDocument.body)

    await userEvent.click(canvas.getByRole('tab', { name: 'EARL Requin (2)' }))
    await userEvent.click(canvas.getByRole('button', { name: REQUIN_TAG_NAME }))
    const dialog = await page.findByRole('dialog', { name: 'Retirer EARL Requin du projet ?' })
    await userEvent.click(within(dialog).getByRole('button', { name: 'Retirer l’exploitation' }))

    await expect(canvas.queryByRole('tab', { name: 'EARL Requin (2)' })).toBeNull()
    await expect(canvas.getByRole('tab', { name: 'Sélectionnées (1)' })).toHaveAttribute(
      'aria-selected',
      'true'
    )
  },
}

export const SelectionsSurPlusieursMillesimes: Story = {
  args: { parcelles: { millesime: '2024', items: [], addedExploitationIds: {} } },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const combobox = canvas.getByRole('combobox', { name: COMBOBOX_NAME })

    await userEvent.click(combobox)
    await userEvent.click(canvas.getByRole('option', { name: 'EARL Requin' }))
    await userEvent.click(canvas.getByRole('tab', { name: 'EARL Requin (2)' }))

    // Changer de millésime ramène sur la sélection, vide pour 2023
    await userEvent.click(canvas.getByRole('button', { name: 'RPG 2023' }))
    await expect(canvas.getByRole('tab', { name: 'Sélectionnées (0)' })).toHaveAttribute(
      'aria-selected',
      'true'
    )
    await userEvent.click(combobox)
    await userEvent.click(canvas.getByRole('option', { name: 'EARL Requin' }))
    await expect(canvas.getByText('Parcelle RPG R3')).toBeInTheDocument()

    // Même si l'exploitation de l'onglet actif existe aussi sur l'autre millésime, on revient
    // sur la sélection ; et rien n'est perdu en revenant sur 2024
    await userEvent.click(canvas.getByRole('tab', { name: 'EARL Requin (1)' }))
    await userEvent.click(canvas.getByRole('button', { name: 'RPG 2024' }))
    await expect(canvas.getByRole('tab', { name: 'Sélectionnées (2)' })).toHaveAttribute(
      'aria-selected',
      'true'
    )
    await expect(canvas.getByText('Parcelle RPG R1')).toBeInTheDocument()
    await expect(canvas.getByText('Parcelle RPG R2')).toBeInTheDocument()
    await expect(canvas.getByRole('tab', { name: 'EARL Requin (2)' })).toBeInTheDocument()

    // Toutes les parcelles, chacune avec son millésime, sont transmises au formulaire
    await expect(args.onParcellesChange).toHaveBeenLastCalledWith(
      expect.objectContaining({
        items: [
          expect.objectContaining({ rpgId: 'R1', year: 2024 }),
          expect.objectContaining({ rpgId: 'R2', year: 2024 }),
          expect.objectContaining({ rpgId: 'R3', year: 2023 }),
        ],
        addedExploitationIds: { 2024: ['requin'], 2023: ['requin'] },
      })
    )
  },
}

export const VidageCompletDUnMillesime: Story = {
  args: { parcelles: withRequinAdded },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const page = within(canvasElement.ownerDocument.body)

    await userEvent.click(canvas.getByRole('button', { name: REQUIN_TAG_NAME }))
    const dialog = await page.findByRole('dialog', { name: 'Retirer EARL Requin du projet ?' })
    await userEvent.click(within(dialog).getByRole('button', { name: 'Retirer l’exploitation' }))
    await userEvent.click(canvas.getByRole('button', { name: 'Clic carte HORS1' }))

    await expect(
      canvas.getByText('Aucune parcelle sélectionnée pour le moment')
    ).toBeInTheDocument()
    // 2024 est vide, 2023 est conservé
    await expect(args.onParcellesChange).toHaveBeenLastCalledWith(
      expect.objectContaining({ items: [selected('R3', 2023)] })
    )
  },
}

export const ZoomDepuisLaListe: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement)
    const card = canvas.getByRole('button', { name: /Parcelle RPG R1.*voir sur la carte/ })

    // Chaque carte de parcelle est un bouton, activable au clavier
    card.focus()
    await userEvent.keyboard('{Enter}')
    await expect(args.onParcelleClick).toHaveBeenCalledWith(
      expect.objectContaining({ rpgId: 'R1' })
    )
  },
}
