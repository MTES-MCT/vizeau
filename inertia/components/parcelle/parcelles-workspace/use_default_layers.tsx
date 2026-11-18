import { useState } from 'react'

import type { ParcellesMapLayers } from '~/components/map/parcelles-selection-map'
import VisualisationRightSideBar from '~/components/visualisation-right-side-bar'
import { useCulturesFilter } from '~/hooks/use_cultures_filter'

export type WorkspaceLayers = { map: ParcellesMapLayers; panel: React.ReactNode }

/** Couches propres à l'éditeur, quand l'écran appelant ne partage pas les siennes. */
export function useDefaultLayers(): WorkspaceLayers {
  const [showParcelles, setShowParcelles] = useState(true)
  const [showAac, setShowAac] = useState(true)
  const [showPpe, setShowPpe] = useState(false)
  const [showPpr, setShowPpr] = useState(false)
  const [showCommunes, setShowCommunes] = useState(false)
  const [showSage, setShowSage] = useState(false)
  const [zoom, setZoom] = useState<number | null>(null)
  const {
    visibleCultures,
    culturesInViewport,
    toggleCulture,
    setAllCulturesVisible,
    handleCulturesInViewportChange,
  } = useCulturesFilter()

  return {
    map: {
      showParcelles,
      showAac,
      showPpe,
      showPpr,
      showCommunes,
      showSage,
      visibleCultures,
      onCulturesInViewportChange: handleCulturesInViewportChange,
      onZoomChange: setZoom,
    },
    panel: (
      <VisualisationRightSideBar
        showParcelles={showParcelles}
        setShowParcelles={() => setShowParcelles((prev) => !prev)}
        showAac={showAac}
        setShowAac={() => setShowAac((prev) => !prev)}
        showPpe={showPpe}
        setShowPpe={() => setShowPpe((prev) => !prev)}
        showPpr={showPpr}
        setShowPpr={() => setShowPpr((prev) => !prev)}
        showCommunes={showCommunes}
        setShowCommunes={() => setShowCommunes((prev) => !prev)}
        showSage={showSage}
        setShowSage={() => setShowSage((prev) => !prev)}
        canSwitchToBioOnly={false}
        parcellesZoomDisabled={zoom !== null && zoom < 10}
        visibleCultures={visibleCultures}
        onToggleCulture={toggleCulture}
        onSetAllCulturesVisible={setAllCulturesVisible}
        culturesInViewport={culturesInViewport}
      />
    ),
  }
}
