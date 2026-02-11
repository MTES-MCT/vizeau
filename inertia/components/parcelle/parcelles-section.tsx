import SmallSection from '~/ui/SmallSection'
import ExploitationParcellesList from './exploitations-parcelles-list'
import EmptyPlaceholder from '~/ui/EmptyPlaceholder'
import { ParcelleJson } from '../../../types/models'

export type ParcellesSectionProps = {
  parcelles: ParcelleJson[]
  exploitationId: string
}

export default function ParcellesSection({ parcelles, exploitationId }: ParcellesSectionProps) {
  return (
    <SmallSection
      title="Parcelles associées"
      iconId="fr-icon-collage-line"
      priority="secondary"
      hasBorder
    >
      {parcelles?.length > 0 ? (
        <ExploitationParcellesList
          parcelles={parcelles}
          exploitationId={exploitationId}
          reloadProp="filteredExploitations"
        />
      ) : (
        <EmptyPlaceholder
          label="Aucune parcelle associée pour le moment"
          illustrativeIcon="fr-icon-collage-line"
        />
      )}
    </SmallSection>
  )
}
