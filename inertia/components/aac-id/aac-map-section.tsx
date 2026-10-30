import { router } from '@inertiajs/react'

import SmallSection from '~/ui/SmallSection'
import EmptyPlaceholder from '~/ui/EmptyPlaceholder'
import AacLocationMap from '~/components/map/aac-location-map'

export type AacMapSectionProps = {
  aacCode: string
  bbox: [number, number, number, number] | null
  pmtilesUrl: string
  /** La carte complète n'expose que les territoires de l'utilisateur : ailleurs, pas de rebond. */
  canOpenMap: boolean
}

export default function AacMapSection({
  aacCode,
  bbox,
  pmtilesUrl,
  canOpenMap,
}: AacMapSectionProps) {
  const openMap = () => {
    router.visit(`/visualisation?aacCode=${aacCode}`)
  }

  return (
    <SmallSection
      title="Positionner l’AAC"
      iconId="fr-icon-map-pin-2-line"
      priority="secondary"
      hasBorder
      actionIcon={canOpenMap ? 'fr-icon-arrow-right-line' : undefined}
      actionLabel="Voir l’AAC sur la carte"
      handleAction={canOpenMap ? openMap : undefined}
    >
      {bbox ? (
        <AacLocationMap aacCode={aacCode} bbox={bbox} pmtilesUrl={pmtilesUrl} />
      ) : (
        <EmptyPlaceholder
          priority="secondary"
          label="Localisation indisponible pour cette AAC"
          illustrativeIcon="fr-icon-map-pin-2-line"
        />
      )}
    </SmallSection>
  )
}
