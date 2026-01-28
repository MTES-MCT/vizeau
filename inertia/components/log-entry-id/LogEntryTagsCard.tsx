import TagsList from '~/ui/TagsList'
import { omit } from 'lodash-es'
import SectionCard from '~/ui/SectionCard'
import EmptyPlaceholder from '~/ui/EmptyPlaceholder'

export type LogEntryTagsCardProps = {
  tags?:
    | {
        name: string
      }[]
    | null
}
export default function LogEntryTagsCard({ tags }: LogEntryTagsCardProps) {
  const tagsWithLabel = tags?.map((tag) => omit({ ...tag, label: tag.name }, 'name')) || [] // Rename 'name' to 'label' for TagsList

  return (
    <SectionCard title="Étiquettes associées" size={'small'} icon="fr-icon-star-line">
      {tagsWithLabel.length > 0 ? (
        <TagsList tags={tagsWithLabel} size="sm" />
      ) : (
        <EmptyPlaceholder illustrativeIcon="fr-icon-star-line" label="Aucune étiquette" />
      )}
    </SectionCard>
  )
}
