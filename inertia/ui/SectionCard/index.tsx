import { ReactNode } from 'react'
import { fr } from '@codegouvfr/react-dsfr'

import { Button } from '@codegouvfr/react-dsfr/Button'

export type SectionCardProps = {
  title: string
  children: ReactNode
  icon?: string
  size?: 'small' | 'medium'
  background?: 'primary' | 'secondary'
  actionIcon?: string
  actionLabel?: string
  handleAction?: () => void
}

export default function SectionCard({
  title,
  children,
  icon,
  size = 'medium',
  background = 'primary',
  actionIcon,
  handleAction,
  actionLabel,
}: SectionCardProps) {
  return (
    <section
      className="flex flex-col gap-2 fr-p-2w"
      style={{
        border: `1px solid ${background === 'primary' ? fr.colors.decisions.border.default.grey.default : 'transparent'}`,
        backgroundColor: background === 'primary' ? fr.colors.decisions.background.default.grey.default : fr.colors.decisions.background.alt.blueFrance.default
      }}
    >
      <div className="flex justify-between items-center">
        {size === 'small' ? (
          <h6 className="w-full fr-mb-0">
            {icon && (
              <span className={`fr-icon-${icon} fr-mr-1w fr-icon-md`} aria-hidden="true"></span>
            )}
            {title}
          </h6>
        ) : (
          <h4 className="w-full fr-mb-0">
            {icon && <span className={`fr-icon-${icon} fr-mr-1w`} aria-hidden="true"></span>}
            {title}
          </h4>
        )}

        {handleAction &&
          actionIcon &&
          (size === 'small' ? (
            <Button
              iconId={`fr-icon-${actionIcon}` as any}
              onClick={handleAction}
              priority="tertiary"
              size="small"
              title={actionLabel || 'Action'}
            />
          ) : (
            <Button
              iconId={`fr-icon-${actionIcon}` as any}
              onClick={handleAction}
              priority="primary"
            >
              {actionLabel}
            </Button>
          ))}
      </div>

      <div className="fr-mt-3w">{children}</div>
    </section>
  )
}
