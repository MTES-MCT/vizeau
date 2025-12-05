import uniqBy from 'lodash-es/uniqBy'
import CustomTag from '../CustomTag'

export type TagsListProps = {
  tags: {
    label: string
    iconId?: string
  }[]
  size?: 'md' | 'sm'
}
export default function TagsList({ tags, size = 'md' }: TagsListProps) {
  const uniqueMetas = uniqBy(tags, 'label')

  return (
    <ul className="fr-badges-group">
      {uniqueMetas.map(({ label, iconId }) => (
        <li key={label} className="fr-mb-0">
          <CustomTag label={label} iconId={iconId} size={size} />
        </li>
      ))}
    </ul>
  )
}
