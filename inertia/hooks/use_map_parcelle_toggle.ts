import { useCallback, useEffect, useRef, useState } from 'react'
import { findPacageByRpgId } from '~/lib/parcelles'
import type { MapParcelle, ParcellesState } from '~/functions/parcelles'
import {
  getAllParcelleKeys,
  rpgParcelleKey,
  toggleMapParcelle,
  updateParcelle,
} from '~/functions/parcelles'

/**
 * Sélection de parcelles au clic sur la carte. Une parcelle inconnue est ajoutée et cochée,
 * puis son PACAGE lui est rattaché et proposé à l'ajout groupé (`pacageSuggestion`).
 */
export function useMapParcelleToggle(
  parcelles: ParcellesState,
  setParcelles: (updater: (prev: ParcellesState) => ParcellesState) => void,
  millesime: string
) {
  const [pacageSuggestion, setPacageSuggestion] = useState<string | null>(null)
  // Seule la réponse du dernier clic compte, même si une précédente arrive après.
  const pacageLookupRef = useRef(0)
  // Le callback reste stable d'un clic à l'autre : les écouteurs de la carte ne sont pas rattachés.
  const parcellesRef = useRef(parcelles)
  useEffect(() => {
    parcellesRef.current = parcelles
  }, [parcelles])

  // Une suggestion ne vaut que pour le millésime affiché.
  useEffect(() => {
    setPacageSuggestion(null)
  }, [millesime])

  const toggleParcelle = useCallback(
    (parcelle: MapParcelle) => {
      const year = Number(millesime)
      const parcelleKey = rpgParcelleKey(year, parcelle.rpgId)
      if (!getAllParcelleKeys(parcellesRef.current).has(parcelleKey)) {
        const lookupId = ++pacageLookupRef.current
        findPacageByRpgId(parcelle.rpgId, year).then((pacage) => {
          if (pacage) {
            setParcelles((prev) => updateParcelle(prev, parcelleKey, (p) => ({ ...p, pacage })))
          }
          if (lookupId === pacageLookupRef.current) setPacageSuggestion(pacage)
        })
      }

      setParcelles((prev) => toggleMapParcelle(prev, parcelle, year))
    },
    [setParcelles, millesime]
  )

  const dismissPacageSuggestion = useCallback(() => setPacageSuggestion(null), [])

  return { toggleParcelle, pacageSuggestion, dismissPacageSuggestion }
}
