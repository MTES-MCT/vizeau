import { MouseEventHandler, ReactNode } from 'react'
import { fr } from '@codegouvfr/react-dsfr'

import Button from '@codegouvfr/react-dsfr/Button'

export type SmallSectionProps = {
  title: string
  actionIcon?: string
  actionLabel?: string
  handleAction?: MouseEventHandler<HTMLButtonElement>
  children?: ReactNode
}

export default function SmallSection({
  title,
  actionIcon,
  handleAction,
  actionLabel,
  children,
}: SmallSectionProps) {
  return (
    <section>
      <div className="flex items-center justify-between">
        <h6 className="fr-text--sm bold fr-mb-0">{title}</h6>
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
        className="fr-p-1w fr-mt-1w"
        style={{
          backgroundColor: fr.colors.decisions.background.alt.blueFrance.default,
        }}
      >
        {children}
      </div>
    </section>
  )
}
