import TagsList from '~/ui/TagsList'
import { omit } from 'lodash-es'
import SectionCard from '~/ui/SectionCard'
import EmptyPlaceholder from '~/ui/EmptyPlaceholder'
import type { ProjectStepTagJson } from '#types/models'

type ProjectStepTagsCardProps = {
  tags?: ProjectStepTagJson[] | null
}

export default function ProjectStepTagsCard({ tags }: ProjectStepTagsCardProps) {
  const tagsWithLabel = tags?.map((tag) => omit({ ...tag, label: tag.name }, 'name')) || []

  return (
    <SectionCard title="Étiquettes associées" size="small" icon="fr-icon-star-line">
      {tagsWithLabel.length > 0 ? (
        <TagsList tags={tagsWithLabel} size="sm" />
      ) : (
        <EmptyPlaceholder illustrativeIcon="fr-icon-star-line" label="Aucune étiquette" />
      )}
    </SectionCard>
  )
}
