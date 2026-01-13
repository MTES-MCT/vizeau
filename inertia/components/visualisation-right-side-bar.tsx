import SmallSection from '~/ui/SmallSection'
import CulturesLegend from './cultures-legend'
import MapLayerFilters from './map-layer-filters'

export default function VisualisationRightSideBar() {
  return (
    <div className="flex flex-col gap-2 fr-p-1w">
      <SmallSection
        title="Couches cartographiques"
        iconId="fr-icon-stack-line"
        hasBorder
        priority="secondary"
      >
        <MapLayerFilters />
      </SmallSection>

      <SmallSection
        title="Type de cultures"
        iconId="fr-icon-seedling-line"
        priority="secondary"
        hasBorder
      >
        <CulturesLegend />
      </SmallSection>
    </div>
  )
}
