import { Link } from '@inertiajs/react'
import { fr } from '@codegouvfr/react-dsfr'

import MetasList, { MetasListProps } from '../MetasList'
import MoreButton, { MoreButtonProps } from '../MoreButton'
import TagsList, { TagsListProps } from '../TagsList'

export type ListItemProps = {
  title: string
  iconId: string
  subtitle?: string
  href?: string
  priority?: 'primary' | 'secondary'
  tags?: TagsListProps['tags']
  metas?: MetasListProps['metas']
  actions?: MoreButtonProps['actions']
}

export default function ListItem({
  tags,
  title,
  subtitle,
  metas,
  actions,
  href,
  priority = 'primary',
}: ListItemProps) {
  const Wrapper = href ? Link : 'div'

  return (
    <Wrapper href={href || ''}>
      <div
        className="flex-1 fr-p-2w flex flex-col gap-3"
        style={{
          border: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
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

          {actions && actions.length > 0 && <MoreButton actions={actions} />}
        </div>

        {metas && metas.length > 0 && <MetasList metas={metas || []} size="sm" />}
      </div>
    </Wrapper>
  )
}
