import { useEffect, useMemo, useState } from 'react'
import { debounce } from 'lodash-es'
import { urlFor } from '~/client'
import { useFetch } from '~/hooks/use_fetch'
import type { GlobalSearchGroupJson } from '#types/recherche'

const DEBOUNCE_MS = 200

// Au moins 2 caractères, sauf pour un code (SANDRE…) : un seul chiffre suffit
function isSearchable(query: string) {
  return query.length >= 2 || /^\d+$/.test(query)
}

/**
 * Recherche générale au fil de la frappe : attend une courte pause dans la saisie
 * avant d'interroger l'API, et garde les derniers résultats affichés pendant le chargement.
 */
export function useGlobalSearch(query: string) {
  const trimmedQuery = query.trim()
  const hasQuery = isSearchable(trimmedQuery)

  const [debouncedQuery, setDebouncedQuery] = useState(trimmedQuery)
  const updateDebouncedQuery = useMemo(() => debounce(setDebouncedQuery, DEBOUNCE_MS), [])

  useEffect(() => {
    updateDebouncedQuery(trimmedQuery)
  }, [trimmedQuery, updateDebouncedQuery])

  useEffect(() => () => updateDebouncedQuery.cancel(), [updateDebouncedQuery])

  const url =
    hasQuery && isSearchable(debouncedQuery)
      ? `${urlFor('recherche.index')}?${new URLSearchParams({ q: debouncedQuery })}`
      : null

  const [groups, setGroups] = useState<GlobalSearchGroupJson[]>([])
  const { loading, error } = useFetch<GlobalSearchGroupJson[]>(
    url,
    'La recherche n’a pas pu aboutir. Réessayez dans un instant.',
    setGroups
  )

  useEffect(() => {
    if (!hasQuery) setGroups([])
  }, [hasQuery])

  return {
    trimmedQuery,
    hasQuery,
    groups: hasQuery ? groups : [],
    // La saisie a changé mais la requête correspondante n'est pas encore partie
    loading: hasQuery && (loading || debouncedQuery !== trimmedQuery),
    error: hasQuery ? error : null,
  }
}
