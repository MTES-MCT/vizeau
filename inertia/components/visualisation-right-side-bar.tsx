import SmallSection from '~/ui/SmallSection'
import CulturesFilters from './cultures-filters'
import MapLayerFilters from './map-layer-filters'

export default function VisualisationRightSideBar({
  showParcelles = true,
  showAac = true,
  showPpe = false,
  showPpr = false,
  showCommunes = false,
  showBioOnly = false,
  setShowParcelles = (_update: boolean | ((prev: boolean) => boolean)) => {},
  setShowAac = (_update: boolean | ((prev: boolean) => boolean)) => {},
  setShowPpe = (_update: boolean | ((prev: boolean) => boolean)) => {},
  setShowPpr = (_update: boolean | ((prev: boolean) => boolean)) => {},
  setShowCommunes = (_update: boolean | ((prev: boolean) => boolean)) => {},
  setShowBioOnly = (_update: boolean | ((prev: boolean) => boolean)) => {},
  canSwitchToBioOnly = true,
  visibleCultures,
  onToggleCulture,
  onToggleAllCultures,
}: {
  showParcelles?: boolean
  showAac?: boolean
  showPpe?: boolean
  showPpr?: boolean
  showCommunes?: boolean
  showBioOnly?: boolean
  setShowParcelles?: (update: boolean | ((prev: boolean) => boolean)) => void
  setShowAac?: (update: boolean | ((prev: boolean) => boolean)) => void
  setShowPpe?: (update: boolean | ((prev: boolean) => boolean)) => void
  setShowPpr?: (update: boolean | ((prev: boolean) => boolean)) => void
  setShowCommunes?: (update: boolean | ((prev: boolean) => boolean)) => void
  setShowBioOnly?: (update: boolean | ((prev: boolean) => boolean)) => void
  canSwitchToBioOnly?: boolean
  visibleCultures?: string[]
  onToggleCulture?: (code: string) => void
  onToggleAllCultures?: () => void
}) {
  return (
    <div className="flex flex-col gap-2 fr-p-1w">
      <SmallSection
        title="Couches cartographiques"
        iconId="fr-icon-stack-line"
        hasBorder
        priority="secondary"
      >
        <MapLayerFilters
          showParcelles={showParcelles}
          setShowParcelles={setShowParcelles}
          showAac={showAac}
          setShowAac={setShowAac}
          showPpe={showPpe}
          setShowPpe={setShowPpe}
          showPpr={showPpr}
          setShowPpr={setShowPpr}
          showCommunes={showCommunes}
          setShowCommunes={setShowCommunes}
          showBioOnly={showBioOnly}
          setShowBioOnly={setShowBioOnly}
          canSwitchToBioOnly={canSwitchToBioOnly}
        />
      </SmallSection>

      <SmallSection
        title="Type de cultures"
        iconId="fr-icon-seedling-line"
        priority="secondary"
        hasBorder
      >
        {visibleCultures && onToggleCulture && onToggleAllCultures && (
          <CulturesFilters
            visibleCultures={visibleCultures}
            onToggleCulture={onToggleCulture}
            onToggleAllCultures={onToggleAllCultures}
          />
        )}
      </SmallSection>
    </div>
  )
}
