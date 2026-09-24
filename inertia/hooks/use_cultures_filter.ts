import { useCallback, useRef, useState } from 'react'
import type { LngLatBounds } from 'maplibre-gl'
import { GROUPES_CULTURAUX } from '~/functions/cultures-group'

type HiddenCulture = {
  /** Zone visible au moment où la culture a été masquée. */
  zone: LngLatBounds | null
  /** La culture a été absente d'une vue ne recoupant pas la zone où elle a été masquée. */
  hasLeftZone: boolean
}

const ALL_CULTURE_CODES = Object.keys(GROUPES_CULTURAUX)

/**
 * Filtre des types de cultures affichés sur la carte. Une culture masquée est réaffichée
 * lorsqu'elle revient dans la vue après avoir été absente d'une vue ne recoupant pas la zone
 * où elle a été masquée : un léger déplacement qui la fait sortir du cadre ne suffit pas.
 */
export function useCulturesFilter() {
  const [visibleCultures, setVisibleCultures] = useState<string[]>(ALL_CULTURE_CODES)
  // `null` tant que les parcelles ne sont pas affichées au niveau de zoom courant.
  const [culturesInViewport, setCulturesInViewport] = useState<string[] | null>(null)
  const viewportBoundsRef = useRef<LngLatBounds | null>(null)
  const hiddenCulturesRef = useRef(new Map<string, HiddenCulture>())

  const markAsHidden = (code: string) => {
    hiddenCulturesRef.current.set(code, { zone: viewportBoundsRef.current, hasLeftZone: false })
  }

  const toggleCulture = useCallback(
    (code: string) => {
      if (visibleCultures.includes(code)) {
        markAsHidden(code)
        setVisibleCultures(visibleCultures.filter((c) => c !== code))
      } else {
        hiddenCulturesRef.current.delete(code)
        setVisibleCultures([...visibleCultures, code])
      }
    },
    [visibleCultures]
  )

  const setAllCulturesVisible = useCallback(
    (visible: boolean) => {
      if (visible) {
        hiddenCulturesRef.current.clear()
        setVisibleCultures(ALL_CULTURE_CODES)
      } else {
        visibleCultures.forEach(markAsHidden)
        setVisibleCultures([])
      }
    },
    [visibleCultures]
  )

  const handleCulturesInViewportChange = useCallback(
    (cultureCodes: string[] | null, bounds: LngLatBounds) => {
      viewportBoundsRef.current = bounds
      setCulturesInViewport(cultureCodes)

      if (!cultureCodes) {
        return
      }

      const reappearedCultureCodes: string[] = []

      for (const [code, hiddenCulture] of hiddenCulturesRef.current) {
        if (!cultureCodes.includes(code)) {
          if (!hiddenCulture.zone?.intersects(bounds)) {
            hiddenCulture.hasLeftZone = true
          }
        } else if (hiddenCulture.hasLeftZone) {
          reappearedCultureCodes.push(code)
        }
      }

      if (reappearedCultureCodes.length === 0) {
        return
      }

      for (const code of reappearedCultureCodes) {
        hiddenCulturesRef.current.delete(code)
      }

      setVisibleCultures((prev) => [...new Set([...prev, ...reappearedCultureCodes])])
    },
    []
  )

  return {
    visibleCultures,
    culturesInViewport,
    toggleCulture,
    setAllCulturesVisible,
    handleCulturesInViewportChange,
  }
}
