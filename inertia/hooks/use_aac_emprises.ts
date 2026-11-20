import { useMemo } from 'react'

import type { AacEmprise, Bbox } from '~/functions/map_focus'
import type { Data } from '@generated/data'

/**
 * AAC proposées sur les cartes de sélection des parcelles : celles de l'entité éditée (projet,
 * exploitation), toutes à défaut. Seules les AAC dont l'emprise est connue permettent de
 * centrer la carte. `aacs` est absente tant que la prop optionnelle n'est pas chargée.
 */
export function useCheckedAacEmprises(
  aacs: Data.Territoire.Variants['forEmprise'][] | undefined,
  territoireIds: string[]
): AacEmprise[] {
  const allAacEmprises = useMemo(
    () =>
      (aacs ?? []).flatMap((aac) =>
        aac.bbox && aac.code
          ? [{ id: aac.id, code: aac.code, label: aac.name ?? aac.code, bbox: aac.bbox as Bbox }]
          : []
      ),
    [aacs]
  )
  return useMemo(() => {
    const checkedAacs = allAacEmprises.filter((aac) => territoireIds.includes(aac.id))
    return checkedAacs.length > 0 ? checkedAacs : allAacEmprises
  }, [allAacEmprises, territoireIds])
}
