import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { SelectedParcelle } from '~/components/map/parcelles-selection-map'
import {
  PACAGE_FORMAT,
  type PacageParcelle,
  PacageSearchError,
  searchPacage,
} from '~/components/parcelle/parcelles-workspace/pacage_search'
import type { useParcellesDraft } from '~/components/parcelle/parcelles-workspace/use_parcelles_draft'
import { showFlashToasts } from '~/functions/flash_messages'
import { pluralize } from '~/functions/string'

const PACAGE_NOT_FOUND_ERROR =
  'Aucune parcelle trouvée pour ce numéro PACAGE. Vérifiez le numéro ou assurez-vous que les parcelles se situent dans votre périmètre géographique (vos AAC et leurs alentours immédiats).'
const SEARCH_FAILED_ERROR = 'La recherche a échoué. Réessayez dans quelques instants.'

/** PACAGE ajouté au brouillon, avec toutes ses parcelles disponibles. */
export type AddedPacage = { pacage: string; parcelles: SelectedParcelle[] }

const toSelectedParcelle = ({ rattacheeA: _, ...parcelle }: PacageParcelle): SelectedParcelle =>
  parcelle

const notifySuccess = (message: string) => showFlashToasts({ success: { message } })

/**
 * Recherche par numéro PACAGE et PACAGE ajoutés au brouillon, par millésime. La recherche
 * ajoute directement les parcelles trouvées, sauf celles rattachées à une autre exploitation.
 */
export function usePacagesDraft(
  millesime: string,
  draft: ReturnType<typeof useParcellesDraft>,
  unavailableRpgIds: string[] = [],
  /** Fictif uniquement : parcelles où piocher le résultat, à retirer avec le vrai back. */
  getFakeCandidates?: () => SelectedParcelle[]
) {
  const { selectedParcelleIds, addParcelles } = draft
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [added, setAdded] = useState<Record<string, AddedPacage[]>>({})
  // Une réponse arrivée après un changement de millésime est ignorée
  const requestId = useRef(0)

  const selectedIds = useMemo(() => new Set(selectedParcelleIds), [selectedParcelleIds])
  // Sélection à jour au retour d'une requête, la carte restant cliquable pendant la recherche
  const latestSelectedIds = useRef(selectedIds)
  useEffect(() => {
    latestSelectedIds.current = selectedIds
  }, [selectedIds])
  const unavailableIds = useMemo(() => new Set(unavailableRpgIds), [unavailableRpgIds])

  const clear = useCallback(() => {
    requestId.current++
    setValue('')
    setError(null)
    setIsLoading(false)
  }, [])

  // Chaque millésime a ses propres parcelles : une recherche en cours n'est plus valable
  useEffect(clear, [millesime])

  const remember = (group: AddedPacage) =>
    setAdded((previous) => {
      const current = previous[millesime] ?? []
      if (current.some(({ pacage }) => pacage === group.pacage)) return previous
      return { ...previous, [millesime]: [...current, group] }
    })

  const search = async () => {
    if (!PACAGE_FORMAT.test(value)) return
    const pacage = value
    const id = ++requestId.current
    setError(null)
    setIsLoading(true)
    try {
      const { parcelles } = await searchPacage(pacage, millesime, getFakeCandidates?.())
      if (id !== requestId.current) return
      if (parcelles.length === 0) {
        setError(PACAGE_NOT_FOUND_ERROR)
        return
      }
      const available = parcelles
        .filter((p) => !p.rattacheeA && !unavailableIds.has(p.rpgId))
        .map(toSelectedParcelle)
      if (available.length === 0) {
        const owner = parcelles.find((p) => p.rattacheeA)?.rattacheeA
        setError(
          `Les parcelles de ce PACAGE sont déjà rattachées à ${owner ?? 'une autre exploitation'}. Une parcelle ne peut appartenir qu’à une seule exploitation par millésime.`
        )
        return
      }
      const toAdd = available.filter((p) => !latestSelectedIds.current.has(p.rpgId))
      addParcelles(toAdd)
      remember({ pacage, parcelles: available })
      const rattacheesCount = parcelles.length - available.length
      notifySuccess(
        [
          toAdd.length > 0
            ? `${pluralize(toAdd.length, 'parcelle ajoutée', 'parcelles ajoutées')} depuis le PACAGE ${pacage}`
            : `PACAGE ${pacage} ajouté, ses parcelles étaient déjà sélectionnées`,
          rattacheesCount > 0 &&
            `${pluralize(rattacheesCount, 'parcelle ignorée', 'parcelles ignorées')}, rattachée${rattacheesCount > 1 ? 's' : ''} à une autre exploitation`,
        ]
          .filter(Boolean)
          .join(' · ')
      )
      setValue('')
    } catch (searchError) {
      if (id !== requestId.current) return
      setError(searchError instanceof PacageSearchError ? searchError.message : SEARCH_FAILED_ERROR)
    } finally {
      if (id === requestId.current) setIsLoading(false)
    }
  }

  /** Ajoute les parcelles d'un PACAGE déjà ajouté qui ont été retirées depuis. */
  const addMissing = (group: AddedPacage) => {
    const missing = group.parcelles.filter((p) => !selectedIds.has(p.rpgId))
    addParcelles(missing)
    notifySuccess(
      `${pluralize(missing.length, 'parcelle ajoutée', 'parcelles ajoutées')} depuis le PACAGE ${group.pacage}`
    )
  }

  const reset = useCallback(() => {
    clear()
    setAdded({})
  }, [clear])

  return {
    value,
    /** Ne garde que les chiffres, 9 au plus. */
    setValue: (input: string) => {
      setValue(input.replace(/\D/g, '').slice(0, 9))
      setError(null)
    },
    isValid: PACAGE_FORMAT.test(value),
    error,
    isLoading,
    search,
    added: added[millesime] ?? [],
    getSelectedCount: (group: AddedPacage) =>
      group.parcelles.filter((p) => selectedIds.has(p.rpgId)).length,
    addMissing,
    reset,
  }
}

export type PacagesDraft = ReturnType<typeof usePacagesDraft>
