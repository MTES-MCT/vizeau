import { Checkbox } from '@codegouvfr/react-dsfr/Checkbox'
import { Tooltip } from '@codegouvfr/react-dsfr/Tooltip'

export default function MapLayerFilters() {
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
            },
          },
        ]}
      />
    </div>
  )
}
