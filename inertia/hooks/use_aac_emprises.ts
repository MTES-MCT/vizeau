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
