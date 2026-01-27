import uniqBy from 'lodash-es/uniqBy'
import CustomTag from '../CustomTag'

export type TagsListProps = {
  tags: {
    label: string
    iconId?: string
  }[]
  size?: 'md' | 'sm'
  limit?: number
}
export default function TagsList({ tags, size = 'md', limit }: TagsListProps) {
  const uniqueMetas = uniqBy(tags, 'label')

  return (
    <ul className="fr-badges-group gap-2 flex flex-wrap fr-mb-0 items-center">
      {uniqueMetas.slice(0, limit).map(({ label, iconId }) => (
        <li key={label} className="fr-mb-0 h-fit">
          <CustomTag label={label} iconId={iconId} size={size} />
        </li>
      ))}
      {limit && tags.length > limit && (
        <li className="fr-mb-0 font-thin italic">+{tags.length - limit}</li>
      )}
    </ul>
  )
}
