import SmallSection from '~/ui/SmallSection'
import ExploitationParcellesList from './exploitations-parcelles-list'
import EmptyPlaceholder from '~/ui/EmptyPlaceholder'
import { ParcelleJson } from '../../../types/models'

export type ParcellesSectionProps = {
  parcelles: ParcelleJson[]
}

export default function ParcellesSection({ parcelles }: ParcellesSectionProps) {
  return (
    <SmallSection title="Parcelles" iconId="fr-icon-collage-line" priority="secondary" hasBorder>
      {parcelles?.length > 0 ? (
        <ExploitationParcellesList parcelles={parcelles} />
      ) : (
        <EmptyPlaceholder
          label="Aucune parcelle associée pour le moment"
          illustrativeIcon="fr-icon-collage-line"
        />
      )}
    </SmallSection>
  )
}
