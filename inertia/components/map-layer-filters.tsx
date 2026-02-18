import { Dispatch, SetStateAction } from 'react'

import LegendItem from '~/ui/LegendItem'

export default function MapLayerFilters({
  showParcelles = true,
  showAac = true,
  showPpe = false,
  showPpr = false,
  showCommunes = false,
  showBioOnly = false,
  setShowParcelles = (_update) => {},
  setShowAac = (_update) => {},
  setShowPpe = (_update) => {},
  setShowPpr = (_update) => {},
  setShowCommunes = (_update) => {},
  setShowBioOnly = (_update) => {},
  canSwitchToBioOnly = true,
}: {
  showParcelles?: boolean
  showAac?: boolean
  showPpe?: boolean
  showPpr?: boolean
  showCommunes?: boolean
  showBioOnly?: boolean
  setShowParcelles?: Dispatch<SetStateAction<boolean>>
  setShowAac?: Dispatch<SetStateAction<boolean>>
  setShowPpe?: Dispatch<SetStateAction<boolean>>
  setShowPpr?: Dispatch<SetStateAction<boolean>>
  setShowCommunes?: Dispatch<SetStateAction<boolean>>
  setShowBioOnly?: Dispatch<SetStateAction<boolean>>
  canSwitchToBioOnly?: boolean
}) {
  return (
    <div className="flex flex-col gap-1">
      <LegendItem
        label="Parcelles"
        hint="Terrains cadastrés"
        checked={showParcelles}
        onChange={() => setShowParcelles((prev) => !prev)}
      />
      <LegendItem
        label="AAC"
        hint="Aire d'alimentation de captage"
        color="bg-[#a6f2fa]"
        checked={showAac}
        onChange={() => setShowAac((prev) => !prev)}
      />
      <LegendItem
        label="PPE"
        hint="Périmètre de protection éloignée"
        color="bg-blue-500"
        checked={showPpe}
        onChange={() => setShowPpe((prev) => !prev)}
      />
      <LegendItem
        label="PPR"
        hint="Périmètre de protection rapprochée"
        color="bg-orange-500"
        checked={showPpr}
        onChange={() => setShowPpr((prev) => !prev)}
      />
      <LegendItem
        label="Délimitations des communes"
        checked={showCommunes}
        onChange={() => setShowCommunes((prev) => !prev)}
      />
      <LegendItem
        label="Parcelles bio uniquement"
        hint="Disponible pour millésime 2024 uniquement"
        checked={showBioOnly}
        disabled={!showParcelles || !canSwitchToBioOnly}
        onChange={() => setShowBioOnly((prev) => !prev)}
      />
    </div>
  )
}
