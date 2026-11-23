import { fr } from '@codegouvfr/react-dsfr'
import Button from '@codegouvfr/react-dsfr/Button'
import { useId } from 'react'

import { formatSurface, plural } from '~/components/parcelle/parcelles-workspace/selection'
import type { PacageSuggestion as Suggestion } from '~/components/parcelle/parcelles-workspace/use_pacages_draft'

type PacageSuggestionProps = {
  suggestion: Suggestion
  onAccept: () => void
  onDismiss: () => void
}

/*
 * Encart du panneau d'ajout qui propose d'ajouter tout le PACAGE de la parcelle qui vient
 * d'être choisie sur la carte.
 */
export default function PacageSuggestion({
  suggestion,
  onAccept,
  onDismiss,
}: PacageSuggestionProps) {
  const titleId = useId()
  const count = suggestion.missing.length
  const others = plural(count, 'autre parcelle')

  return (
    <section
      aria-labelledby={titleId}
      aria-live="polite"
      className="flex flex-col gap-2 fr-p-2w"
      style={{
        border: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
        boxShadow: `inset 4px 0 0 ${fr.colors.decisions.border.plain.blueFrance.default}`,
      }}
    >
      <h3 id={titleId} className="fr-text--md fr-text--bold fr-mb-0">
        Ajouter les autres parcelles de ce PACAGE ?
      </h3>
      <p className="fr-text--sm fr-mb-0">
        La parcelle que vous venez d’ajouter est déclarée à la PAC sous le numéro PACAGE{' '}
        <strong>{suggestion.pacage}</strong>, avec {others} ({formatSurface(suggestion.missing)} ha)
        qui {count > 1 ? 'ne sont' : 'n’est'} pas encore dans votre sélection.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button size="small" iconId="fr-icon-add-line" iconPosition="left" onClick={onAccept}>
          {count > 1 ? `Ajouter ces ${count} parcelles` : 'Ajouter cette parcelle'}
        </Button>
        <Button priority="tertiary no outline" size="small" onClick={onDismiss}>
          Non merci
        </Button>
      </div>
    </section>
  )
}
