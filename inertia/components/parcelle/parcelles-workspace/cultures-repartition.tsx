import Button from '@codegouvfr/react-dsfr/Button'
import { useState } from 'react'

import { formatHectares } from '~/components/parcelle/parcelles-workspace/selection'
import LabeledProgressBar from '~/ui/LabeledProgressBar'
import StackedProgressBar, { type StackedProgressBarSegment } from '~/ui/StackedProgressBar'

type CulturesRepartitionProps = {
  segments: StackedProgressBarSegment[]
  size?: 'sm' | 'md'
}

/* Barre de répartition des cultures, dépliable en une barre par culture. */
export default function CulturesRepartition({ segments, size = 'md' }: CulturesRepartitionProps) {
  const [isOpen, setIsOpen] = useState(false)
  const total = segments.reduce((sum, culture) => sum + culture.value, 0)

  return (
    <div className="flex flex-col">
      <div className="flex items-center gap-2">
        <div className="flex-1">
          <StackedProgressBar segments={segments} size={size} />
        </div>
        <Button
          type="button"
          priority="tertiary no outline"
          iconId={isOpen ? 'fr-icon-arrow-down-s-line' : 'fr-icon-arrow-right-s-line'}
          size="small"
          iconPosition="right"
          aria-expanded={isOpen}
          onClick={() => setIsOpen(!isOpen)}
          title={
            isOpen ? 'Masquer la répartition des cultures' : 'Afficher la répartition des cultures'
          }
        >
          Détails
        </Button>
      </div>

      {isOpen && (
        <div className="fr-py-2v flex flex-col gap-2">
          {segments.map((culture) => (
            <LabeledProgressBar
              key={culture.label}
              label={culture.label}
              size="sm"
              progressBarValues={{
                value: culture.value,
                total,
                valueLabel: `${formatHectares(culture.value)} ha`,
                progressColor: culture.color,
              }}
            />
          ))}
        </div>
      )}
    </div>
  )
}
