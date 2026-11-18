import { fr } from '@codegouvfr/react-dsfr'
import { useId, useState, type ReactNode } from 'react'

import CulturesRepartition from '~/components/parcelle/parcelles-workspace/cultures-repartition'
import { plural } from '~/components/parcelle/parcelles-workspace/selection'
import type { StackedProgressBarSegment } from '~/ui/StackedProgressBar'

type ParcellesDrawerProps = {
  title: string
  /** Ligne de résumé sous le titre : nombre de parcelles, surface… */
  summary: string
  /** Parcelles ajoutées dans le brouillon. */
  newCount?: number
  culturesSegments?: StackedProgressBarSegment[]
  /** `removed` : tiroir des parcelles retirées, en rouge. */
  variant?: 'default' | 'removed'
  children: ReactNode
}

/* Tiroir d'un groupe de parcelles : en-tête résumé avec la répartition des cultures, puis la liste. */
export default function ParcellesDrawer({
  title,
  summary,
  newCount = 0,
  culturesSegments = [],
  variant = 'default',
  children,
}: ParcellesDrawerProps) {
  // Fermé par défaut : la liste des exploitations reste lisible au fil des ajouts
  const [isOpen, setIsOpen] = useState(false)
  const contentId = useId()
  const mentionColor = fr.colors.decisions.text.mention.grey.default

  const borderColor = fr.colors.decisions.border.default.grey.default
  const isRemoved = variant === 'removed'
  const accentColor = isRemoved
    ? fr.colors.decisions.border.plain.error.default
    : fr.colors.decisions.border.plain.blueFrance.default

  return (
    <section style={{ border: `1px solid ${borderColor}` }}>
      <div
        style={{
          backgroundColor: isOpen ? fr.colors.decisions.background.alt.grey.default : undefined,
          borderBottom: isOpen ? `1px solid ${borderColor}` : undefined,
          boxShadow: isOpen ? `inset 4px 0 0 ${accentColor}` : undefined,
        }}
      >
        <button
          type="button"
          className="flex w-full items-start gap-1 min-w-0 text-left cursor-pointer fr-p-3v"
          aria-expanded={isOpen}
          aria-controls={contentId}
          onClick={() => setIsOpen(!isOpen)}
        >
          <span
            className={`${isOpen ? 'fr-icon-arrow-down-s-line' : 'fr-icon-arrow-right-s-line'} fr-icon--sm fr-mt-1v`}
            style={{
              color: isRemoved
                ? fr.colors.decisions.text.default.error.default
                : fr.colors.decisions.text.actionHigh.blueFrance.default,
            }}
            aria-hidden="true"
          />
          <span className="flex flex-col min-w-0">
            <span
              className="fr-text--md fr-text--bold fr-mb-0"
              style={{
                color: isRemoved ? fr.colors.decisions.text.default.error.default : undefined,
              }}
            >
              {title}
            </span>
            <span className="fr-text--xs fr-mb-0" style={{ color: mentionColor }}>
              {summary}
            </span>
            {newCount > 0 && (
              <span
                className="fr-text--xs fr-text--bold fr-mb-0 flex items-center gap-1"
                style={{ color: fr.colors.decisions.text.default.success.default }}
              >
                <span
                  className="inline-block w-2 h-2 rounded-full"
                  style={{ backgroundColor: fr.colors.decisions.text.default.success.default }}
                  aria-hidden="true"
                />
                {plural(newCount, 'ajout')}
              </span>
            )}
          </span>
        </button>
        {culturesSegments.length > 0 && (
          // Aligné sur le texte de l'en-tête, après le chevron
          <div className="fr-pr-3v fr-pb-3v" style={{ paddingLeft: 'calc(0.75rem + 1.25rem)' }}>
            <CulturesRepartition segments={culturesSegments} size="sm" />
          </div>
        )}
      </div>

      <div id={contentId} hidden={!isOpen} className="fr-p-3v">
        {children}
      </div>
    </section>
  )
}
