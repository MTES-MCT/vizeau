import { fr } from '@codegouvfr/react-dsfr'
import Button from '@codegouvfr/react-dsfr/Button'
import { SegmentedControl } from '@codegouvfr/react-dsfr/SegmentedControl'

import { EXPLOITATION_FILL_COLORS } from '~/components/map/styles/parcelles-agricoles'
import { plural } from '~/components/parcelle/parcelles-workspace/selection'
import type { ColorMode } from '~/components/parcelle/parcelles-workspace/use_zone_exploitations'

type ColorModePanelProps = {
  mode: ColorMode
  onModeChange: (mode: ColorMode) => void
  /** Nom de l'exploitation éditée ; sans elle, la légende parle de la sélection. */
  currentName?: string
  /** Parcelles de chaque catégorie, dans le millésime affiché. */
  counts: { current: number; other: number }
  /** Chargement des noms des autres exploitations, montrés au survol. */
  namesStatus: 'loading' | 'error' | 'ready'
  onNamesRetry: () => void
}

const mentionColor = fr.colors.decisions.text.mention.grey.default

/*
 * Choix de la couleur des parcelles dans l'onglet « Couches » de l'éditeur : par culture
 * principale, ou par exploitation, avec sa légende.
 */
export default function ColorModePanel({
  mode,
  onModeChange,
  currentName,
  counts,
  namesStatus,
  onNamesRetry,
}: ColorModePanelProps) {
  return (
    <div className="flex flex-col gap-3">
      <SegmentedControl
        small
        legend="Colorer les parcelles par"
        segments={[
          {
            label: 'Culture principale',
            nativeInputProps: {
              checked: mode === 'culture',
              onChange: () => onModeChange('culture'),
            },
          },
          {
            label: 'Exploitation',
            nativeInputProps: {
              checked: mode === 'exploitation',
              onChange: () => onModeChange('exploitation'),
            },
          },
        ]}
      />
      {mode === 'exploitation' && (
        <div className="flex flex-col gap-2">
          <ul className="flex flex-col gap-1 fr-mb-0" style={{ listStyle: 'none', padding: 0 }}>
            <LegendItem
              color={EXPLOITATION_FILL_COLORS.current}
              label={currentName || 'Sélection'}
              count={counts.current}
            />
            <LegendItem
              color={EXPLOITATION_FILL_COLORS.other}
              label="Autres exploitations"
              count={counts.other}
            />
            <LegendItem color={EXPLOITATION_FILL_COLORS.none} label="Non rattachées" />
          </ul>
          {namesStatus === 'loading' && (
            <p className="fr-text--xs fr-mb-0" style={{ color: mentionColor }} role="status">
              Chargement des noms des exploitations…
            </p>
          )}
          {namesStatus === 'error' && (
            <div className="flex flex-col gap-2 items-start">
              <p className="fr-text--xs fr-mb-0">
                Le chargement des noms des exploitations a échoué.
              </p>
              <Button
                size="small"
                priority="secondary"
                iconId="fr-icon-refresh-line"
                iconPosition="left"
                onClick={onNamesRetry}
              >
                Réessayer
              </Button>
            </div>
          )}
          {namesStatus === 'ready' && (
            <p className="fr-text--xs fr-mb-0" style={{ color: mentionColor }}>
              Survolez une parcelle d’une autre exploitation pour voir son nom et toutes ses
              parcelles, dans vos AAC et 10 km autour.
            </p>
          )}
        </div>
      )}
    </div>
  )
}

function LegendItem({ color, label, count }: { color: string; label: string; count?: number }) {
  return (
    <li className="flex items-center gap-2 fr-text--sm fr-mb-0">
      <span
        className="inline-block w-3 h-3 rounded-sm shrink-0"
        style={{ backgroundColor: color }}
        aria-hidden="true"
      />
      <span className="flex-1 min-w-0 truncate">{label}</span>
      {count !== undefined && (
        <span className="shrink-0" style={{ color: mentionColor }}>
          {plural(count, 'parcelle')}
        </span>
      )}
    </li>
  )
}
