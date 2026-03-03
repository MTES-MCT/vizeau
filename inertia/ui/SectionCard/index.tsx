import { ReactNode } from 'react'
import { fr } from '@codegouvfr/react-dsfr'

import { Button } from '@codegouvfr/react-dsfr/Button'
import TruncatedText from '../TruncatedText'

export type SectionCardProps = {
  title?: string
  children: ReactNode
  icon?: string
  size?: 'small' | 'medium'
  background?: 'primary' | 'secondary'
  hideLongTitleTooltip?: boolean
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
  hideLongTitleTooltip = false,
}: SectionCardProps) {
  const hasHeader = !!(title || icon || (handleAction && actionIcon))
  return (
    <section
      className={`flex flex-col fr-p-2w${hasHeader ? ' gap-2' : ''}`}
      style={{
        border: `1px solid ${background === 'primary' ? fr.colors.decisions.border.default.grey.default : 'transparent'}`,
        backgroundColor:
          background === 'primary'
            ? fr.colors.decisions.background.default.grey.default
            : fr.colors.decisions.background.alt.blueFrance.default,
      }}
    >
      {hasHeader && (
        <div className="flex items-center">
          <div className="flex-1 min-w-0">
            {size === 'small' ? (
              <div className="flex gap-1">
                {icon && <span className={`${icon} fr-icon-md fr-mb-2w`} aria-hidden="true"></span>}
                {title && (
                  <TruncatedText
                    maxLines={1}
                    className="fr-mb-0"
                    hideTooltip={hideLongTitleTooltip}
                    as="h6"
                  >
                    {title}
                  </TruncatedText>
                )}
              </div>
            ) : (
              <div className="flex gap-1">
                {icon && <span className={`${icon} fr-mb-2w`} aria-hidden="true"></span>}
                {title && (
                  <TruncatedText
                    maxLines={2}
                    className="fr-mb-0 fr-mb-2w"
                    hideTooltip={hideLongTitleTooltip}
                    as="h4"
                  >
                    {title}
                  </TruncatedText>
                )}
              </div>
            )}
          </div>
          {handleAction &&
            actionIcon &&
            (size === 'small' ? (
              <Button
                iconId={actionIcon as any}
                onClick={handleAction}
                priority="tertiary"
                size="small"
                title={actionLabel || 'Action'}
                className="whitespace-nowrap"
              />
            ) : (
              <Button
                iconId={actionIcon as any}
                onClick={handleAction}
                priority="secondary"
                className="whitespace-nowrap"
              >
                {actionLabel}
              </Button>
            ))}
        </div>
      )}
      <div>{children}</div>
    </section>
  )
}
