import { useMemo } from 'react'

import type { AacEmprise, Bbox } from '~/functions/map_focus'
import type { Data } from '@generated/data'

/** Seules les AAC dont l'emprise est connue permettent de centrer la carte. */
export function useAacEmprises(aacs: Data.Territoire.Variants['forEmprise'][]): AacEmprise[] {
  return useMemo(
    () =>
      aacs.flatMap((aac) =>
        aac.bbox && aac.code
          ? [{ id: aac.id, code: aac.code, label: aac.name ?? aac.code, bbox: aac.bbox as Bbox }]
          : []
      ),
    [aacs]
  )
}

/** Restreint les AAC proposées sur la carte à celles cochées dans le formulaire, toutes à défaut. */
export function useCheckedAacEmprises(
  aacs: Data.Territoire.Variants['forEmprise'][],
  territoireIds: string[]
): AacEmprise[] {
  const allAacEmprises = useAacEmprises(aacs)
  return useMemo(() => {
    const checkedAacs = allAacEmprises.filter((aac) => territoireIds.includes(aac.id))
    return checkedAacs.length > 0 ? checkedAacs : allAacEmprises
  }, [allAacEmprises, territoireIds])
}
