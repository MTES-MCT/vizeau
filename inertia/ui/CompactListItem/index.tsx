import MetasList, { MetasListProps } from '../MetasList'
import MoreButton, { MoreButtonProps } from '../MoreButton'
import TagsList, { TagsListProps } from '../TagsList'

export type CompactListItemProps = {
  label: string
  tags: TagsListProps['tags']
  metas: MetasListProps['metas']
  actions: MoreButtonProps['actions']
}

export default function CompactListItem({ label, tags, metas, actions }: CompactListItemProps) {
  return (
    <div className="flex flex-col fr-p-2w">
      <div className="flex-1 items-center flex gap-2">
        <div className="flex flex-1 items-center gap-2 flex-wrap">
          <div className="flex-1 font-bold">{label}</div>
          <TagsList tags={tags} size="sm" />
        </div>

        <MoreButton actions={actions} />
      </div>

      <MetasList metas={metas} size="sm" />
    </div>
  )
}
