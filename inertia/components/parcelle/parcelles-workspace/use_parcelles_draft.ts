import { useCallback, useMemo, useState } from 'react'

import type { SelectedParcelle } from '~/components/map/parcelles-selection-map'
import {
  getChanges,
  type ParcellesSelection,
} from '~/components/parcelle/parcelles-workspace/selection'

/**
 * Copie de travail de la sélection, par millésime, à appliquer ou abandonner d'un bloc.
 * Les parcelles nouvelles et retirées sont comparées à `savedSelection`, la sélection
 * enregistrée, qui peut différer de la sélection à l'ouverture de l'éditeur.
 */
export function useParcellesDraft(
  initialSelection: ParcellesSelection,
  millesime: string,
  savedSelection: ParcellesSelection = initialSelection
) {
  // Seulement les millésimes modifiés : initialSelection peut se compléter en cours d'édition
  const [draft, setDraft] = useState<ParcellesSelection>({})

  const selection = useMemo(() => ({ ...initialSelection, ...draft }), [initialSelection, draft])
  const selectedParcelles = useMemo(() => selection[millesime] ?? [], [selection, millesime])
  const selectedParcelleIds = useMemo(
    () => selectedParcelles.map((parcelle) => parcelle.rpgId),
    [selectedParcelles]
  )
  const removedParcelles = useMemo(() => {
    const selectedIds = new Set(selectedParcelleIds)
    return (savedSelection[millesime] ?? []).filter((p) => !selectedIds.has(p.rpgId))
  }, [savedSelection, millesime, selectedParcelleIds])
  const addedParcelleIds = useMemo(() => {
    const savedIds = new Set((savedSelection[millesime] ?? []).map((p) => p.rpgId))
    return new Set(selectedParcelleIds.filter((id) => !savedIds.has(id)))
  }, [savedSelection, millesime, selectedParcelleIds])
  const changes = useMemo(
    () => getChanges(initialSelection, selection),
    [initialSelection, selection]
  )

  // Applique une transformation aux parcelles du millésime affiché
  const updateParcelles = useCallback(
    (update: (parcelles: SelectedParcelle[]) => SelectedParcelle[]) => {
      setDraft((previous) => ({
        ...previous,
        [millesime]: update(previous[millesime] ?? initialSelection[millesime] ?? []),
      }))
    },
    [millesime, initialSelection]
  )

  const toggleParcelle = useCallback(
    (parcelle: SelectedParcelle) =>
      updateParcelles((parcelles) =>
        parcelles.some((p) => p.rpgId === parcelle.rpgId)
          ? parcelles.filter((p) => p.rpgId !== parcelle.rpgId)
          : [...parcelles, parcelle]
      ),
    [updateParcelles]
  )

  /** Ajoute les parcelles qui ne sont pas encore sélectionnées. */
  const addParcelles = useCallback(
    (toAdd: SelectedParcelle[]) =>
      updateParcelles((parcelles) => {
        const ids = new Set(parcelles.map((p) => p.rpgId))
        return [...parcelles, ...toAdd.filter((p) => !ids.has(p.rpgId))]
      }),
    [updateParcelles]
  )

  const removeParcelles = useCallback(
    (rpgIds: Set<string>) =>
      updateParcelles((parcelles) => parcelles.filter((p) => !rpgIds.has(p.rpgId))),
    [updateParcelles]
  )

  const resetDraft = useCallback(() => setDraft({}), [])

  return {
    selection,
    selectedParcelles,
    selectedParcelleIds,
    addedParcelleIds,
    removedParcelles,
    changes,
    toggleParcelle,
    addParcelles,
    removeParcelles,
    resetDraft,
  }
}
