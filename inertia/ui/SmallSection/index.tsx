import { MouseEventHandler, ReactNode } from 'react'
import { fr } from '@codegouvfr/react-dsfr'

import Button from '@codegouvfr/react-dsfr/Button'

export type SmallSectionProps = {
  title: string
  iconId?: string
  priority?: 'primary' | 'secondary'
  hasBorder?: boolean
  actionIcon?: string
  actionLabel?: string
  handleAction?: MouseEventHandler<HTMLButtonElement>
  children?: ReactNode
}

export default function SmallSection({
  title,
  iconId,
  priority = 'primary',
  hasBorder,
  actionIcon,
  handleAction,
  actionLabel,
  children,
}: SmallSectionProps) {
  return (
    <section
      style={{
        backgroundColor: fr.colors.decisions.background.default.grey.default,
        padding: hasBorder ? 10 : undefined,
        border: hasBorder
          ? `1px solid ${fr.colors.decisions.border.default.grey.default}`
          : undefined,
      }}
    >
      <div className="flex items-center justify-between fr-mb-3w">
        <h6 className="fr-text--md bold fr-mb-0 flex items-end gap-1">
          {iconId && <i className={`${iconId} fr-icon--md`} aria-hidden="true" />} {title}
        </h6>

        {handleAction && actionIcon && (
          <Button
            iconId={actionIcon as any}
            onClick={handleAction}
            priority="tertiary no outline"
            size="small"
            title={actionLabel || 'Action'}
          />
        )}
      </div>

      <div
        className={`fr-p-${priority === 'secondary' ? 0 : 1}w fr-mt-1w`}
        style={{
          backgroundColor:
            priority === 'primary'
              ? fr.colors.decisions.background.alt.blueFrance.default
              : fr.colors.decisions.background.default.grey.default,
        }}
      >
        {children}
      </div>
    </section>
  )
}
