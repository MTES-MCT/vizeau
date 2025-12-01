import Badge from '@codegouvfr/react-dsfr/Badge'
import uniqBy from 'lodash-es/uniqBy'

export type TagsListProps = {
  tags: {
    label: string
    severity?: 'info' | 'success' | 'warning' | 'error' | 'new'
    hasIcon?: boolean
  }[]
  size?: 'sm' | 'md'
}
export default function TagsList({ tags, size = 'md' }: TagsListProps) {
  const uniqueMetas = uniqBy(tags, 'label')

  return (
    <ul className="fr-badges-group">
      {uniqueMetas.map(({ label, severity, hasIcon = true }) => (
        <li key={label}>
          <Badge
            className="fr-mb-0"
            noIcon={!hasIcon}
            small={size === 'sm' ? true : false}
            severity={severity}
          >
            {label}
          </Badge>
        </li>
      ))}
    </ul>
  )
}
