import { Link } from '@inertiajs/react'
import { fr } from '@codegouvfr/react-dsfr'

import MetasList, { MetasListProps } from '../MetasList'
import MoreButton, { MoreButtonProps } from '../MoreButton'
import TagsList, { TagsListProps } from '../TagsList'
import { ReactNode } from 'react'

export type ListItemProps = {
  variant?: 'default' | 'compact'
  priority?: 'primary' | 'secondary'
  title?: ReactNode
  subtitle?: ReactNode
  iconId?: string
  tags?: TagsListProps['tags']
  metas?: MetasListProps['metas']
  actions?: MoreButtonProps['actions']
  href?: string
  hasBorder?: boolean
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
  hasBorder = false,
}: ListItemProps) {
  if (variant === 'compact') {
    return (
      <div
        className={`flex flex-col gap-1 w-full ${hasBorder ? 'fr-p-1w' : ''}`}
        style={{
          border: hasBorder ? `1px solid ${fr.colors.decisions.border.default.grey.default}` : 'none',
          backgroundColor:
            priority === 'primary'
              ? fr.colors.decisions.background.default.grey.default
              : fr.colors.decisions.background.alt.blueFrance.default,
        }}
      >
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
              <div className="flex-1 fr-m-0 fr-text--md font-bold">{title}</div>
            </div>
            {tags && tags.length > 0 && <TagsList tags={tags} size="sm" />}
          </div>

          {actions && actions.length > 0 && <MoreButton actions={actions} />}
        </div>

        {metas && metas.length > 0 && <MetasList metas={metas} size="sm" />}
      </div>
    )
  }

  // Default variant
  const Wrapper = href ? Link : 'div'
  const wrapperProps = href ? { href } : {}

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
        {tags && tags.length > 0 && <TagsList tags={tags} size="sm" />}

        <div className="flex items-start">
          <div className="flex flex-1 flex-col">
            <h6 className="flex fr-m-0 fr-text--md">{title}</h6>
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
    </Wrapper>
  )
}
