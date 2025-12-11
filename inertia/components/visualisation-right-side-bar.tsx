import SmallSection from '~/ui/SmallSection'
import CulturesLegend from './cultures-legend'

export default function VisualisationRightSideBar() {
  return (
    <div className="fr-p-1w">
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
