import { useEffect, useRef, useState } from 'react'
import { Tabs } from '@codegouvfr/react-dsfr/Tabs'
import { Button } from '@codegouvfr/react-dsfr/Button'
import ListItem from '~/ui/ListItem'
import EmptyPlaceholder from '~/ui/EmptyPlaceholder'
import { getCultureByCode } from '~/functions/cultures_group'
import {
  getExploitationParcelles,
  getParcelleExploitation,
  getRemovedParcelles,
  getSelectedExploitationParcelles,
  getSelectedParcelles,
  type ProjetExploitation,
} from '~/functions/projet_parcelles'
import type { ProjetParcellesFormData, SelectedParcelleFormData } from './projet-form'
import { pluralize } from '~/functions/string'

const SELECTION_TAB_ID = 'selection'

export type ParcelleCardData = Pick<
  SelectedParcelleFormData,
  'rpgId' | 'surface' | 'cultureCode' | 'centroid'
>

type ParcellesTabsProps = {
  parcelles: ProjetParcellesFormData
  projectExploitations: ProjetExploitation[]
  /** Exploitations ajoutées pour le millésime affiché, une par onglet. */
  addedExploitations: ProjetExploitation[]
  /** Le champ d'ajout d'exploitation est-il affiché, pour orienter l'état vide. */
  hasPicker: boolean
  onReaddRemoved: (exploitation: ProjetExploitation) => void
  onParcelleClick: (parcelle: ParcelleCardData) => void
}

type ParcelleCardProps = {
  parcelle: ParcelleCardData
  index: number
  origin?: string
  onClick: (parcelle: ParcelleCardData) => void
}

function ParcelleCard({ parcelle, index, origin, onClick }: ParcelleCardProps) {
  const content = (
    <ListItem
      priority={index % 2 === 0 ? 'primary' : 'secondary'}
      hasBorder
      variant="compact"
      title={`Parcelle RPG ${parcelle.rpgId}`}
      tags={[getCultureByCode(parcelle.cultureCode)]}
      metas={[
        {
          content: `${parcelle.surface ?? 'Non renseigné'} ha`,
          iconId: 'fr-icon-ruler-line',
        },
        ...(origin ? [{ content: origin, iconId: 'fr-icon-building-line' as const }] : []),
      ]}
    />
  )

  // Sans centroïde, impossible de situer la parcelle sur la carte : la carte n'est pas cliquable
  if (!parcelle.centroid) return <li>{content}</li>

  return (
    <li>
      <button
        type="button"
        className="w-full text-left cursor-pointer hover:brightness-95"
        onClick={() => onClick(parcelle)}
      >
        {content}
        <span className="fr-sr-only">, voir sur la carte</span>
      </button>
    </li>
  )
}

/*
 * Onglet « Sélectionnées » puis un onglet par exploitation ajoutée, qui ne liste que ses parcelles
 * encore sélectionnées. Le retrait d'une parcelle se fait uniquement sur la carte : les cartes de
 * parcelles ne portent pas de bouton de retrait.
 */
export default function ParcellesTabs({
  parcelles,
  projectExploitations,
  addedExploitations,
  hasPicker,
  onReaddRemoved,
  onParcelleClick,
}: ParcellesTabsProps) {
  const { millesime } = parcelles
  const selectedParcelles = getSelectedParcelles(parcelles)
  const selectedRpgIds = new Set(selectedParcelles.map((p) => p.rpgId))
  const panelRef = useRef<HTMLDivElement>(null)

  const [activeTabId, setActiveTabId] = useState(SELECTION_TAB_ID)
  // Changer de millésime ramène sur la sélection
  useEffect(() => setActiveTabId(SELECTION_TAB_ID), [millesime])
  // L'onglet d'une exploitation retirée disparaît : on revient alors sur la sélection
  const activeExploitation = addedExploitations.find((e) => e.id === activeTabId)
  const currentTabId = activeExploitation ? activeTabId : SELECTION_TAB_ID

  const tabs = [
    { tabId: SELECTION_TAB_ID, label: `Sélectionnées (${selectedParcelles.length})` },
    ...addedExploitations.map((e) => ({
      tabId: e.id,
      label: `${e.name} (${getSelectedExploitationParcelles(parcelles, e).length})`,
    })),
  ]

  const renderSelection = () => {
    if (selectedParcelles.length === 0) {
      return (
        <EmptyPlaceholder
          label="Aucune parcelle sélectionnée pour le moment"
          illustrativeIcon="fr-icon-collage-line"
          hint={
            hasPicker
              ? 'Ajoutez une exploitation du projet avec le champ ci-dessus, ou cliquez sur une parcelle de la carte.'
              : 'Cliquez sur une parcelle de la carte pour la sélectionner.'
          }
        />
      )
    }
    const totalSurface = selectedParcelles.reduce((sum, p) => sum + (p.surface ?? 0), 0)
    return (
      <>
        <p className="fr-text--sm">
          {pluralize(selectedParcelles.length, 'parcelle', 'parcelles')}, {totalSurface.toFixed(2)}{' '}
          ha. Cliquez sur une parcelle pour la voir sur la carte. Pour la retirer, cliquez dessus
          sur la carte.
        </p>
        <ul className="flex flex-col gap-2 fr-mb-0" style={{ listStyle: 'none', padding: 0 }}>
          {selectedParcelles.map((parcelle, index) => (
            <ParcelleCard
              key={parcelle.rpgId}
              parcelle={parcelle}
              index={index}
              origin={
                getParcelleExploitation(parcelle.rpgId, millesime, projectExploitations)?.name ??
                'Hors exploitations du projet'
              }
              onClick={onParcelleClick}
            />
          ))}
        </ul>
      </>
    )
  }

  const renderExploitation = (exploitation: ProjetExploitation) => {
    const exploitationParcelles = getExploitationParcelles(exploitation, millesime)
    const removedCount = getRemovedParcelles(parcelles, exploitation).length
    // Les parcelles désélectionnées sortent de la liste ; le bouton permet de les rajouter
    const keptParcelles = exploitationParcelles.filter((p) => selectedRpgIds.has(p.rpgId))
    return (
      <>
        <div className="flex flex-wrap items-center justify-between gap-2 fr-mb-2w">
          <p className="fr-text--sm fr-mb-0">
            {keptParcelles.length} sur {exploitationParcelles.length} dans le projet
          </p>
          {removedCount > 0 && (
            <Button
              type="button"
              priority="secondary"
              size="small"
              iconId="fr-icon-add-line"
              onClick={() => {
                onReaddRemoved(exploitation)
                // Le bouton disparaît : le focus est confié au panneau de l'onglet
                panelRef.current?.focus()
              }}
            >
              {removedCount > 1
                ? `Rajouter les ${removedCount} parcelles retirées`
                : 'Rajouter la parcelle retirée'}
            </Button>
          )}
        </div>
        {keptParcelles.length === 0 ? (
          <EmptyPlaceholder
            label="Toutes les parcelles de cette exploitation ont été retirées du projet"
            illustrativeIcon="fr-icon-collage-line"
          />
        ) : (
          <ul className="flex flex-col gap-2 fr-mb-0" style={{ listStyle: 'none', padding: 0 }}>
            {keptParcelles.map((parcelle, index) => (
              <ParcelleCard
                key={parcelle.rpgId}
                parcelle={{ ...parcelle, centroid: parcelle.centroid ?? undefined }}
                index={index}
                onClick={onParcelleClick}
              />
            ))}
          </ul>
        )}
      </>
    )
  }

  return (
    // Les onglets DSFR fixent leur hauteur en JS (--tabs-height) : on les étire dans l'espace
    // restant et seul le panneau (sous la barre d'onglets de 3rem) défile.
    <Tabs
      label="Parcelles du projet"
      tabs={tabs}
      selectedTabId={currentTabId}
      onTabChange={setActiveTabId}
      className="flex-1 min-h-0"
      classes={{ panel: 'h-[calc(100%-3rem)]! overflow-y-auto' }}
    >
      <div ref={panelRef} tabIndex={-1} className="outline-none">
        {activeExploitation ? renderExploitation(activeExploitation) : renderSelection()}
      </div>
    </Tabs>
  )
}
