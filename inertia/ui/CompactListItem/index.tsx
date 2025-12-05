import MetasList, { MetasListProps } from '../MetasList'
import MoreButton, { MoreButtonProps } from '../MoreButton'
import TagsList, { TagsListProps } from '../TagsList'

import { fr } from '@codegouvfr/react-dsfr'

export type CompactListItemProps = {
  label: string
  iconId?: string
  tags: TagsListProps['tags']
  metas: MetasListProps['metas']
  actions: MoreButtonProps['actions']
}

export default function CompactListItem({ label, iconId, tags, metas, actions }: CompactListItemProps) {
  return (
    <div className="flex flex-col">
      <div className="flex-1 items-center flex gap-2">
        <div className="flex flex-1 items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1">
            {iconId && <span className={`${iconId} fr-icon--md`} aria-hidden="true" style={{ color: fr.colors.decisions.text.label.blueFrance.default}}></span>}
            <div className="flex-1 font-bold">{label}</div>
          </div>
          <TagsList tags={tags} size="sm" />
        </div>

        <MoreButton actions={actions} />
      </div>

      <MetasList metas={metas} size="sm" />
    </div>
  )
}
