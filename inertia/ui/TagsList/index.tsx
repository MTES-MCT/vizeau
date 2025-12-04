import uniqBy from 'lodash-es/uniqBy'
import CustomTag from '../CustomTag'

export type TagsListProps = {
  tags: {
    label: string
    iconId?: string
  }[]
  size?: 'sm' | 'xs'
}
export default function TagsList({ tags, size = 'sm' }: TagsListProps) {
  const uniqueMetas = uniqBy(tags, 'label')

  return (
    <ul className="fr-badges-group">
      {uniqueMetas.map(({ label, iconId }) => (
        <li key={label}>
          <CustomTag label={label} iconId={iconId} size={size} />
        </li>
      ))}
    </ul>
  )
}
