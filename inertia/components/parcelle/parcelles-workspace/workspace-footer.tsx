import Badge from '@codegouvfr/react-dsfr/Badge'
import { Button } from '@codegouvfr/react-dsfr/Button'
import { createModal } from '@codegouvfr/react-dsfr/Modal'

import type { SelectedParcelle } from '~/components/map/parcelles-selection-map'
import {
  describeChanges,
  formatSurface,
  MillesimeChanges,
  plural,
} from '~/components/parcelle/parcelles-workspace/selection'

export const discardModal = createModal({
  id: 'parcelles-workspace-discard-modal',
  isOpenedByDefault: false,
})

export type WorkspaceFooterProps = {
  millesime: string
  parcelles: SelectedParcelle[]
  changes: MillesimeChanges[]
  submitLabel: string
  isSubmitting: boolean
  onCancel: () => void
  onSubmit: () => void
  onDiscard: () => void
}

export default function WorkspaceFooter({
  millesime,
  parcelles,
  changes,
  submitLabel,
  isSubmitting,
  onCancel,
  onSubmit,
  onDiscard,
}: WorkspaceFooterProps) {
  const millesimeChange = changes.find((change) => change.millesime === millesime)

  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex flex-col">
          <b>RPG {millesime}</b>
          <div className="flex gap-2">
            {formatSurface(parcelles)} ha ·
            <i className="font-light">{plural(parcelles.length, 'parcelle')}</i>
            {millesimeChange && millesimeChange.added > 0 && (
              <Badge severity="success" small>
                +{plural(millesimeChange.added, 'nouvelle')}
              </Badge>
            )}
            {millesimeChange && millesimeChange.removed > 0 && (
              <Badge severity="error" small>
                −{plural(millesimeChange.removed, 'retirée')}
              </Badge>
            )}
          </div>
        </div>
      </div>
      <div className="flex flex-wrap gap-2 flex-1 justify-end">
        <Button priority="secondary" onClick={onCancel}>
          Annuler
        </Button>
        <Button
          iconId="fr-icon-check-line"
          disabled={changes.length === 0 || isSubmitting}
          onClick={onSubmit}
        >
          {submitLabel}
        </Button>
      </div>
      {/* Dans le portail de l'overlay, sinon la modale passe dessous */}
      <discardModal.Component
        title="Abandonner les modifications ?"
        buttons={[
          { children: 'Continuer l’édition', priority: 'secondary' },
          { children: 'Abandonner', onClick: onDiscard },
        ]}
      >
        <p>Les changements suivants ne seront pas appliqués :</p>
        <ul>
          {changes.map((change) => (
            <li key={change.millesime}>
              RPG {change.millesime} : {describeChanges(change)}
            </li>
          ))}
        </ul>
      </discardModal.Component>
    </>
  )
}
