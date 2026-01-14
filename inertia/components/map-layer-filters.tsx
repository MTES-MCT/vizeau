import { Dispatch, SetStateAction } from 'react'

import { Checkbox } from '@codegouvfr/react-dsfr/Checkbox'
import { Tooltip } from '@codegouvfr/react-dsfr/Tooltip'

export default function MapLayerFilters({
  showParcelles = true,
  showAac = true,
  showPpe = false,
  showPpr = false,
  showCommunes = false,
  setShowParcelles = () => {},
  setShowAac = () => {},
  setShowPpe = () => {},
  setShowPpr = () => {},
  setShowCommunes = () => {},
}: {
  showParcelles?: boolean
  showAac?: boolean
  showPpe?: boolean
  showPpr?: boolean
  showCommunes?: boolean
  setShowParcelles?: Dispatch<SetStateAction<boolean>>
  setShowAac?: Dispatch<SetStateAction<boolean>>
  setShowPpe?: Dispatch<SetStateAction<boolean>>
  setShowPpr?: Dispatch<SetStateAction<boolean>>
  setShowCommunes?: Dispatch<SetStateAction<boolean>>
}) {
  return (
    <div className="flex flex-col gap-1">
      <Checkbox
        className="fr-mb-0"
        small
        options={[
          {
            label: (
              <span className="fr-text--sm fr-mb-0 flex items-center gap-1">
                Parcelles
                <Tooltip kind="hover" title="Terrains cadastrés" />
              </span>
            ),
            nativeInputProps: {
              name: 'parcelles',
              value: 'parcelles',
              checked: showParcelles,
              onChange: () => setShowParcelles((prev) => !prev)
            },
          },
        ]}
      />

      <Checkbox
        className="fr-mb-0"
        small
        options={[
          {
            label: (
              <span className="fr-text--sm fr-mb-0 flex items-center gap-1">
                AAC
                <Tooltip kind="hover" title="Aire d’Alimentation de Captage" />
              </span>
            ),
            nativeInputProps: {
              name: 'aac',
              value: 'aac',
              checked: showAac,
              onChange: () => setShowAac((prev) => !prev)
            },
          },
        ]}
      />
      <Checkbox
        className="fr-mb-0"
        small
        options={[
          {
            label: (
              <span className="fr-text--sm fr-mb-0 flex items-center gap-1">
                PPE <Tooltip kind="hover" title="Périmètre de Protection des Eaux" />
              </span>
            ),
            nativeInputProps: {
              name: 'ppe',
              value: 'ppe',
              checked: showPpe,
              onChange: () => setShowPpe((prev) => !prev)
            },
          },
        ]}
      />

      <Checkbox
        className="fr-mb-0"
        small
        options={[
          {
            label: (
              <span className="fr-text--sm fr-mb-0 flex items-center gap-1">
                PPR <Tooltip kind="hover" title="Plan de Prévention des Risques" />
              </span>
            ),
            nativeInputProps: {
              name: 'ppr',
              value: 'ppr',
              checked: showPpr,
              onChange: () => setShowPpr((prev) => !prev)
            },
          },
        ]}
      />

      <Checkbox
        small
        className="fr-mb-0"
        options={[
          {
            label: (
              <span className="fr-text--sm fr-mb-0 flex items-center gap-1">
                Délimitations des communes
              </span>
            ),
            nativeInputProps: {
              name: 'communes',
              value: 'communes',
              checked: showCommunes,
              onChange: () => setShowCommunes((prev) => !prev)
            },
          },
        ]}
      />
    </div>
  )
}
