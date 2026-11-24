import { useCallback, useEffect, useMemo, useRef, useState } from 'react'

import type { SelectedParcelle } from '~/components/map/parcelles-selection-map'
import { findParcellePacage } from '~/components/parcelle/parcelles-workspace/pacage_search'
import type { RpgPacageResult } from '#types/rpg'

/** PACAGE de la parcelle ouverte : en cours de recherche, en échec, ou la réponse du serveur. */
export type FichePacage = { status: 'loading' } | { status: 'error' } | RpgPacageResult

const NO_IDS: string[] = []

/**
 * Parcelle ouverte d'un clic sur la carte ou dans une liste, et recherche de son PACAGE. Les
 * réponses sont gardées jusqu'à la fermeture de l'éditeur : les parcelles d'un même PACAGE
 * partagent la leur, et s'ouvrent sans attendre.
 */
export function useParcelleFiche(millesime: string, isPacageSearchAvailable: boolean) {
  const [parcelle, setParcelle] = useState<SelectedParcelle | null>(null)
  const [pacage, setPacage] = useState<FichePacage | null>(null)
  const results = useRef(new Map<string, RpgPacageResult>())
  // Une réponse arrivée après l'ouverture d'une autre parcelle est ignorée
  const requestId = useRef(0)

  const lookup = useCallback(
    async (target: SelectedParcelle) => {
      const id = ++requestId.current
      const key = `${millesime}:${target.rpgId}`
      const known = results.current.get(key)
      if (known) {
        setPacage(known)
        return
      }
      setPacage({ status: 'loading' })
      try {
        // Sans centroïde, la parcelle ne peut pas être cherchée
        const result = (await findParcellePacage(target, millesime)) ?? {
          status: 'notFound' as const,
        }
        results.current.set(key, result)
        if (result.status === 'found') {
          for (const { rpgId } of result.parcelles) {
            results.current.set(`${millesime}:${rpgId}`, result)
          }
        }
        if (id === requestId.current) setPacage(result)
      } catch {
        if (id === requestId.current) setPacage({ status: 'error' })
      }
    },
    [millesime]
  )

  const open = useCallback(
    (target: SelectedParcelle) => {
      setParcelle(target)
      if (isPacageSearchAvailable) {
        lookup(target)
      } else {
        requestId.current++
        setPacage(null)
      }
    },
    [isPacageSearchAvailable, lookup]
  )

  const close = useCallback(() => {
    requestId.current++
    setParcelle(null)
    setPacage(null)
  }, [])

  // Chaque millésime a ses propres parcelles
  useEffect(close, [millesime])

  // Parcelles du PACAGE, mises en valeur sur la carte avec la parcelle ouverte
  const pacageParcelleIds = useMemo(
    () => (pacage?.status === 'found' ? pacage.parcelles.map(({ rpgId }) => rpgId) : NO_IDS),
    [pacage]
  )

  return {
    parcelle,
    pacage,
    pacageParcelleIds,
    open,
    close,
    retry: () => parcelle && lookup(parcelle),
    reset: () => {
      close()
      results.current.clear()
    },
  }
}

export type ParcelleFiche = ReturnType<typeof useParcelleFiche>
