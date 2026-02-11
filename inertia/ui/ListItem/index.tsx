import { Link } from '@inertiajs/react'
import { fr } from '@codegouvfr/react-dsfr'

import MetasList, { MetasListProps } from '../MetasList'
import MoreButton, { MoreButtonProps } from '../MoreButton'
import TagsList, { TagsListProps } from '../TagsList'
import TruncatedText from '../TruncatedText'
import { ReactNode } from 'react'

export type AdditionalInfosProps = {
  iconId?: string
  message?: string
  alert?: {
    text?: string
    severity?: 'infos' | 'warning' | 'error' | 'success'
  }
}

export type ListItemProps = {
  variant?: 'default' | 'compact'
  priority?: 'primary' | 'secondary'
  title?: ReactNode
  subtitle?: ReactNode
  iconId?: string
  tags?: TagsListProps['tags']
  metas?: MetasListProps['metas']
  actions?: MoreButtonProps['actions']
  additionalInfos?: AdditionalInfosProps
  href?: string
  hasBorder?: boolean
}

const AdditionnalInfos = ({
  iconId,
  message,
  alert,
}: {
  iconId?: string
  message?: string
  alert?: { text?: string; severity?: 'infos' | 'warning' | 'error' | 'success' }
}) => {
  const severitiesIcons = {
    infos: { iconId: 'fr-icon-info-fill', color: fr.colors.decisions.text.default.info.default },
    warning: {
      iconId: 'fr-icon-warning-fill',
      color: fr.colors.decisions.text.default.warning.default,
    },
    error: { iconId: 'fr-icon-error-fill', color: fr.colors.decisions.text.default.error.default },
    success: {
      iconId: 'fr-icon-checkbox-fill',
      color: fr.colors.decisions.text.default.success.default,
    },
  }

  return (
    <div className="flex flex-wrap items-center gap-4">
      {(iconId || message) && (
        <div
          className="flex items-center gap-1"
          style={{ color: fr.colors.decisions.text.label.blueFrance.default }}
        >
          {iconId && <span className={`${iconId} fr-icon--sm`} aria-hidden="true" />}
          {message && <span className="fr-text--sm fr-mb-0"> {message}</span>}
        </div>
      )}

      {alert && (
        <div className="flex items-center gap-1">
          {alert.severity && (
            <span
              className={`${severitiesIcons[alert.severity || 'infos'].iconId} fr-icon--sm`}
              aria-hidden="true"
              style={{ color: severitiesIcons[alert.severity || 'infos'].color }}
            ></span>
          )}
          {alert?.text && <span className="fr-text--sm fr-mb-0">{alert.text}</span>}
        </div>
      )}
    </div>
  )
}

export default function ListItem({
  tags,
  title,
  subtitle,
  metas,
  actions,
  href,
  priority = 'primary',
  variant = 'default',
  iconId,
  additionalInfos,
  hasBorder = false,
}: ListItemProps) {
  // Default variant
  const Wrapper = href ? Link : 'div'
  const wrapperProps = href ? { href } : {}

  if (variant === 'compact') {
    return (
      <Wrapper {...wrapperProps}>
        <div
          className={`flex flex-col gap-3 w-full ${hasBorder ? 'fr-p-1w' : ''}`}
          style={{
            border: hasBorder
              ? `1px solid ${fr.colors.decisions.border.default.grey.default}`
              : 'none',
            backgroundColor:
              priority === 'primary'
                ? fr.colors.decisions.background.default.grey.default
                : fr.colors.decisions.background.alt.blueFrance.default,
          }}
        >
          <div className="flex flex-col gap-3">
            {additionalInfos && (
              <AdditionnalInfos
                iconId={additionalInfos?.iconId}
                message={additionalInfos?.message}
                alert={additionalInfos?.alert}
              />
            )}
            <div>
              <div className="items-center flex gap-2">
                <div className="flex flex-1 items-center gap-2 flex-wrap">
                  <div className="flex items-center gap-1">
                    {iconId && (
                      <span
                        className={`${iconId} fr-icon--md`}
                        aria-hidden="true"
                        style={{ color: fr.colors.decisions.text.label.blueFrance.default }}
                      ></span>
                    )}
                    <TruncatedText maxLines={1} className="flex-1 fr-m-0 fr-text--md font-bold">
                      {title}
                    </TruncatedText>
                  </div>
                  {tags && tags.length > 0 && <TagsList tags={tags} limit={5} size="sm" />}
                </div>

                <div
                  onClick={(e) => {
                    e.stopPropagation()
                    e.preventDefault()
                  }}
                >
                  {actions && actions.length > 0 && <MoreButton actions={actions} />}
                </div>
              </div>

              {metas && metas.length > 0 && <MetasList metas={metas} size="sm" />}
            </div>
          </div>
        </div>
      </Wrapper>
    )
  }

  return (
    <Wrapper {...wrapperProps}>
      <div
        className="fr-card flex-1 fr-p-2w flex flex-col gap-3 w-full"
        style={{
          backgroundColor:
            priority === 'primary'
              ? fr.colors.decisions.background.default.grey.default
              : fr.colors.decisions.background.alt.blueFrance.default,
        }}
      >
        {additionalInfos && (
          <AdditionnalInfos
            iconId={additionalInfos?.iconId}
            message={additionalInfos?.message}
            alert={additionalInfos?.alert}
          />
        )}
        <div>
          {tags && tags.length > 0 && <TagsList tags={tags} size="sm" limit={5} />}

          <div className="flex items-start">
            <div className="flex flex-1 flex-col">
              <div className="flex items-center gap-1">
                {iconId && (
                  <span
                    className={`${iconId} fr-icon--md`}
                    aria-hidden="true"
                    style={{ color: fr.colors.decisions.text.label.blueFrance.default }}
                  ></span>
                )}
                <TruncatedText maxLines={1} className="flex-1 fr-m-0 fr-text--md font-bold">
                  {title}
                </TruncatedText>
              </div>
              {subtitle && (
                <span
                  className="fr-mb-0 fr-text--sm"
                  style={{ color: fr.colors.decisions.text.mention.grey.default }}
                >
                  {subtitle}
                </span>
              )}
            </div>

            <div
              onClick={(e) => {
                e.stopPropagation()
                e.preventDefault()
              }}
            >
              {actions && actions.length > 0 && <MoreButton actions={actions} />}
            </div>
          </div>

          {metas && metas.length > 0 && <MetasList metas={metas} size="sm" />}
        </div>
      </div>
    </Wrapper>
  )
}
