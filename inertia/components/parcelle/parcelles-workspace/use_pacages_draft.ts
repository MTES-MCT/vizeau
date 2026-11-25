import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { SelectedParcelle } from '~/components/map/parcelles-selection-map'
import {
  PACAGE_FORMAT,
  findParcellePacage,
  searchPacage,
  toSelectedParcelle,
} from '~/components/parcelle/parcelles-workspace/pacage_search'
import type { useParcellesDraft } from '~/components/parcelle/parcelles-workspace/use_parcelles_draft'
import { showFlashToasts } from '~/functions/flash_messages'
import { pluralize } from '~/functions/string'

const PACAGE_NOT_FOUND_ERROR =
  'Aucune parcelle trouvée pour ce numéro PACAGE. Vérifiez le numéro ou assurez-vous que les parcelles se situent dans votre périmètre géographique (vos AAC et leurs alentours immédiats).'
const SEARCH_FAILED_ERROR = 'La recherche a échoué. Réessayez dans quelques instants.'

/** PACAGE ajouté au brouillon, avec toutes ses parcelles disponibles. */
export type AddedPacage = {
  pacage: string
  /** Nom de l'exploitation déclarante, `null` s'il n'est pas connu. */
  exploitant: string | null
  parcelles: SelectedParcelle[]
}

/** Proposition d'ajouter tout le PACAGE d'une parcelle choisie sur la carte. */
export type PacageSuggestion = AddedPacage & {
  /** Parcelle choisie sur la carte, à l'origine de la proposition. */
  rpgId: string
  /** Parcelles du PACAGE qui ne sont pas encore sélectionnées. */
  missing: SelectedParcelle[]
}

/**
 * Pause attendue après un clic avant de chercher le PACAGE de la parcelle : des clics rapprochés
 * ne déclenchent qu'une recherche, pour la dernière parcelle choisie.
 */
const SUGGESTION_DELAY_MS = 300

const notifySuccess = (message: string) => showFlashToasts({ success: { message } })

const knownKey = (millesime: string, rpgId: string) => `${millesime}:${rpgId}`

// Valeur par défaut stable : un nouveau tableau à chaque rendu relancerait les calculs mémoïsés
const NO_RPG_IDS: string[] = []

/**
 * Recherche par numéro PACAGE et PACAGE ajoutés au brouillon, par millésime. La recherche
 * ajoute directement les parcelles trouvées, sauf celles rattachées à une autre exploitation
 * (`unavailableRpgIds`).
 */
export function usePacagesDraft(
  millesime: string,
  draft: ReturnType<typeof useParcellesDraft>,
  unavailableRpgIds: string[] = NO_RPG_IDS
) {
  const { selectedParcelleIds, addParcelles } = draft
  const [value, setValue] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [added, setAdded] = useState<Record<string, AddedPacage[]>>({})
  const [suggested, setSuggested] = useState<(AddedPacage & { rpgId: string }) | null>(null)
  // PACAGE dont l'utilisateur a masqué la proposition, par millésime
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())
  // Une réponse arrivée après un changement de millésime ou un autre clic est ignorée
  const requestId = useRef(0)
  const suggestionRequestId = useRef(0)
  const suggestionTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const cancelSuggestionRequest = useRef<(() => void) | null>(null)
  // Parcelle dont la recherche est en attente ou en cours
  const pendingSuggestionRpgId = useRef<string | null>(null)
  // PACAGE déjà reçus du serveur, par millésime et parcelle, avec toutes leurs parcelles (y
  // compris les indisponibles, filtrées à l'usage) : une parcelle voisine du même PACAGE se
  // passe alors de requête. `null` : parcelle sans PACAGE connu dans la zone.
  const knownPacages = useRef(new Map<string, AddedPacage | null>())

  const selectedIds = useMemo(() => new Set(selectedParcelleIds), [selectedParcelleIds])
  // Sélection à jour au retour d'une requête, la carte restant cliquable pendant la recherche
  const latestSelectedIds = useRef(selectedIds)
  useEffect(() => {
    latestSelectedIds.current = selectedIds
  }, [selectedIds])
  const unavailableIds = useMemo(() => new Set(unavailableRpgIds), [unavailableRpgIds])

  // L'annulation n'arrête que l'attente côté navigateur : le serveur termine sa recherche. Le
  // délai avant envoi et les PACAGE déjà connus évitent, eux, les requêtes superflues.
  const cancelPendingSuggestion = useCallback(() => {
    suggestionRequestId.current++
    clearTimeout(suggestionTimer.current)
    cancelSuggestionRequest.current?.()
    cancelSuggestionRequest.current = null
    pendingSuggestionRpgId.current = null
  }, [])

  // Pas de recherche lancée une fois le composant démonté
  useEffect(() => cancelPendingSuggestion, [cancelPendingSuggestion])

  const clear = useCallback(() => {
    requestId.current++
    cancelPendingSuggestion()
    setValue('')
    setError(null)
    setIsLoading(false)
    setSuggested(null)
  }, [cancelPendingSuggestion])

  // Chaque millésime a ses propres parcelles : une recherche en cours n'est plus valable
  useEffect(clear, [millesime])

  /** Garde le PACAGE reçu, pour reconnaître ensuite chacune de ses parcelles sans requête. */
  const learn = (group: AddedPacage) => {
    for (const { rpgId } of group.parcelles) {
      knownPacages.current.set(knownKey(millesime, rpgId), group)
    }
  }

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
      const result = await searchPacage(pacage, millesime)
      if (id !== requestId.current) return
      // Hors de la zone de l'utilisateur ou absent du millésime : même message
      if (result?.status !== 'found') {
        setError(PACAGE_NOT_FOUND_ERROR)
        return
      }
      const { parcelles } = result
      const exploitant = result.exploitation?.name ?? null
      learn({ pacage, exploitant, parcelles: parcelles.map(toSelectedParcelle) })
      const available = parcelles
        .filter((p) => !unavailableIds.has(p.rpgId))
        .map(toSelectedParcelle)
      if (available.length === 0) {
        const owner = parcelles.find((p) => p.exploitation)?.exploitation?.name
        setError(
          `Les parcelles de ce PACAGE sont déjà rattachées à ${owner ?? 'une autre exploitation'}. Une parcelle ne peut appartenir qu’à une seule exploitation par millésime.`
        )
        return
      }
      const toAdd = available.filter((p) => !latestSelectedIds.current.has(p.rpgId))
      addParcelles(toAdd)
      remember({ pacage, exploitant, parcelles: available })
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
    } catch {
      if (id !== requestId.current) return
      setError(SEARCH_FAILED_ERROR)
    } finally {
      if (id === requestId.current) setIsLoading(false)
    }
  }

  /**
   * À appeler quand une parcelle est ajoutée ou retirée sur la carte : propose d'ajouter les
   * autres parcelles de son PACAGE, ou retire la proposition liée à une parcelle désélectionnée.
   */
  const onParcelleToggled = (parcelle: SelectedParcelle, isSelected: boolean) => {
    if (!isSelected) {
      // Retirée aussitôt ajoutée (double clic) : sa recherche n'a plus lieu d'être
      if (pendingSuggestionRpgId.current === parcelle.rpgId) cancelPendingSuggestion()
      setSuggested((current) => (current?.rpgId === parcelle.rpgId ? null : current))
      return
    }
    // Seule la dernière parcelle choisie compte : la recherche précédente n'a plus d'objet
    cancelPendingSuggestion()
    const key = knownKey(millesime, parcelle.rpgId)
    if (knownPacages.current.has(key)) {
      const known = knownPacages.current.get(key)
      setSuggested(known ? { ...known, rpgId: parcelle.rpgId } : null)
      return
    }

    setSuggested(null)
    const id = suggestionRequestId.current
    pendingSuggestionRpgId.current = parcelle.rpgId
    suggestionTimer.current = setTimeout(async () => {
      try {
        const found = await findParcellePacage(parcelle, millesime, (cancel) => {
          cancelSuggestionRequest.current = cancel
        })
        // `null` : paramètres invalides, rien à retenir
        if (!found) return
        if (found.status !== 'found') {
          knownPacages.current.set(key, null)
          return
        }
        const group: AddedPacage = {
          pacage: found.pacage,
          exploitant: found.exploitation?.name ?? null,
          parcelles: found.parcelles.map(toSelectedParcelle),
        }
        learn(group)
        if (id !== suggestionRequestId.current) return
        // Parcelle retirée entre-temps : la proposition n'a plus lieu d'être
        if (!latestSelectedIds.current.has(parcelle.rpgId)) return
        setSuggested({ ...group, rpgId: parcelle.rpgId })
      } catch {
        // Proposition facultative : en cas d'échec ou d'annulation, la parcelle est ajoutée seule
      } finally {
        if (id === suggestionRequestId.current) {
          cancelSuggestionRequest.current = null
          pendingSuggestionRpgId.current = null
        }
      }
    }, SUGGESTION_DELAY_MS)
  }

  const suggestion: PacageSuggestion | null = useMemo(() => {
    if (!suggested || dismissed.has(`${millesime}:${suggested.pacage}`)) return null
    // Rattachées à une autre exploitation : ni proposées ni retenues avec le PACAGE
    const parcelles = suggested.parcelles.filter((p) => !unavailableIds.has(p.rpgId))
    const missing = parcelles.filter((p) => !selectedIds.has(p.rpgId))
    return missing.length > 0 ? { ...suggested, parcelles, missing } : null
  }, [suggested, dismissed, millesime, selectedIds, unavailableIds])

  const acceptSuggestion = () => {
    if (!suggestion) return
    addParcelles(suggestion.missing)
    remember({
      pacage: suggestion.pacage,
      exploitant: suggestion.exploitant,
      parcelles: suggestion.parcelles,
    })
    notifySuccess(
      `${pluralize(suggestion.missing.length, 'parcelle ajoutée', 'parcelles ajoutées')} depuis le PACAGE ${suggestion.pacage}`
    )
    setSuggested(null)
  }

  /** Referme la proposition sans la refuser : elle reviendra au prochain clic sur ce PACAGE. */
  const closeSuggestion = () => {
    cancelPendingSuggestion()
    setSuggested(null)
  }

  const dismissSuggestion = () => {
    if (!suggestion) return
    setDismissed((previous) => new Set(previous).add(`${millesime}:${suggestion.pacage}`))
    setSuggested(null)
  }

  /** Ajoute les parcelles d'un PACAGE déjà ajouté qui ont été retirées depuis. */
  const addMissing = (group: AddedPacage) => {
    const missing = group.parcelles.filter((p) => !selectedIds.has(p.rpgId))
    addParcelles(missing)
    notifySuccess(
      `${pluralize(missing.length, 'parcelle ajoutée', 'parcelles ajoutées')} depuis le PACAGE ${group.pacage}`
    )
  }

  const millesimeAdded = useMemo(() => added[millesime] ?? [], [added, millesime])

  // Nom de l'exploitation déclarante des parcelles ajoutées par PACAGE, quand il est connu
  const exploitantByRpgId = useMemo(() => {
    const names = new Map<string, string>()
    for (const group of millesimeAdded) {
      if (!group.exploitant) continue
      for (const parcelle of group.parcelles) names.set(parcelle.rpgId, group.exploitant)
    }
    return names
  }, [millesimeAdded])

  const reset = useCallback(() => {
    clear()
    knownPacages.current.clear()
    setAdded({})
    setDismissed(new Set())
  }, [clear])

  return {
    value,
    /** Ne garde que les chiffres, et les lettres A et B des PACAGE corses, 9 au plus. */
    setValue: (input: string) => {
      setValue(
        input
          .toUpperCase()
          .replace(/[^\dAB]/g, '')
          .slice(0, 9)
      )
      setError(null)
    },
    isValid: PACAGE_FORMAT.test(value),
    error,
    isLoading,
    search,
    added: millesimeAdded,
    getExploitant: (rpgId: string) => exploitantByRpgId.get(rpgId),
    /** Parcelles du PACAGE encore sélectionnées, indépendamment des filtres du panneau. */
    getSelectedParcelles: (group: AddedPacage) =>
      group.parcelles.filter((p) => selectedIds.has(p.rpgId)),
    addMissing,
    onParcelleToggled,
    suggestion,
    acceptSuggestion,
    closeSuggestion,
    dismissSuggestion,
    reset,
  }
}

export type PacagesDraft = ReturnType<typeof usePacagesDraft>
