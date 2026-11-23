import Button from '@codegouvfr/react-dsfr/Button'

import type { SelectedParcelle } from '~/components/map/parcelles-selection-map'
import ParcelleItem from '~/components/parcelle/parcelles-workspace/parcelle-item'
import ParcellesDrawer from '~/components/parcelle/parcelles-workspace/parcelles-drawer'
import {
  formatSurface,
  getCulturesSegments,
  plural,
} from '~/components/parcelle/parcelles-workspace/selection'
import type { PacagesDraft } from '~/components/parcelle/parcelles-workspace/use_pacages_draft'
import EmptyPlaceholder from '~/ui/EmptyPlaceholder'

type PacagesGroupingProps = {
  millesime: string
  /** Parcelles affichées, après filtre éventuel par culture. */
  parcelles: SelectedParcelle[]
  addedParcelleIds: Set<string>
  pacages: PacagesDraft
  /** Filtre actif : les tiroirs sans parcelle filtrée sont masqués. */
  isFiltered?: boolean
  onParcelleClick: (parcelle: SelectedParcelle) => void
}

const listClassName = 'flex flex-col fr-mb-0 fr-mt-1w'
const listStyle = { listStyle: 'none', padding: 0 }

/*
 * Parcelles rangées par PACAGE ajouté, dans l'ordre d'ajout. Les autres parcelles de la sélection
 * ne sont pas affichées : leur PACAGE n'est pas connu du navigateur, seuls les PACAGE saisis par
 * l'utilisateur le sont. Une parcelle n'apparaît que dans un tiroir.
 */
export default function PacagesGrouping({
  millesime,
  parcelles,
  addedParcelleIds,
  pacages,
  isFiltered = false,
  onParcelleClick,
}: PacagesGroupingProps) {
  const groupedRpgIds = new Set<string>()
  const groups = pacages.added.map((group) => {
    const rpgIds = new Set(group.parcelles.map((p) => p.rpgId))
    const groupParcelles = parcelles.filter(
      (p) => rpgIds.has(p.rpgId) && !groupedRpgIds.has(p.rpgId)
    )
    groupParcelles.forEach((p) => groupedRpgIds.add(p.rpgId))
    return { group, parcelles: groupParcelles }
  })

  const renderList = (list: SelectedParcelle[]) => (
    <ul className={listClassName} style={listStyle}>
      {list.map((parcelle) => (
        <ParcelleItem
          key={parcelle.rpgId}
          parcelle={parcelle}
          isNew={addedParcelleIds.has(parcelle.rpgId)}
          onClick={onParcelleClick}
        />
      ))}
    </ul>
  )

  const countNew = (list: SelectedParcelle[]) =>
    list.filter((p) => addedParcelleIds.has(p.rpgId)).length

  if (groups.length === 0) {
    return (
      <EmptyPlaceholder
        label={`Aucun PACAGE ajouté pour le RPG ${millesime}`}
        illustrativeIcon="fr-icon-hashtag"
        hint="Ajoutez les parcelles d’un PACAGE avec la méthode « PACAGE »."
      />
    )
  }

  const visibleGroups = isFiltered ? groups.filter((g) => g.parcelles.length > 0) : groups

  if (visibleGroups.length === 0) {
    return (
      <EmptyPlaceholder
        label="Aucun PACAGE ne correspond aux filtres"
        illustrativeIcon="fr-icon-search-line"
      />
    )
  }

  return (
    <div className="flex flex-col gap-2">
      {visibleGroups.map(({ group, parcelles: groupParcelles }) => {
        // Le résumé décrit le PACAGE entier, la liste et la répartition ce qui est filtré
        const total = group.parcelles.length
        const selected = pacages.getSelectedParcelles(group)
        const selectedCount = selected.length
        const missingCount = total - selectedCount
        return (
          <ParcellesDrawer
            key={group.pacage}
            title={`PACAGE ${group.pacage}`}
            summary={[
              plural(selectedCount, 'parcelle'),
              selectedCount === total ? 'PACAGE complet' : `${selectedCount} sur ${total}`,
              `${formatSurface(selected)} ha`,
            ].join(' · ')}
            newCount={countNew(groupParcelles)}
            culturesSegments={getCulturesSegments(groupParcelles)}
          >
            {missingCount > 0 && (
              <Button
                className="fr-mt-1w"
                priority="secondary"
                size="small"
                iconId="fr-icon-add-line"
                onClick={() => pacages.addMissing(group)}
              >
                {missingCount > 1
                  ? `Ajouter les ${missingCount} parcelles manquantes`
                  : 'Ajouter la parcelle manquante'}
              </Button>
            )}
            {selectedCount === 0 ? (
              <EmptyPlaceholder
                label="Toutes les parcelles de ce PACAGE ont été retirées de la sélection"
                illustrativeIcon="fr-icon-collage-line"
              />
            ) : (
              renderList(groupParcelles)
            )}
          </ParcellesDrawer>
        )
      })}
    </div>
  )
}
