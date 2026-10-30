import { values } from 'lodash-es'
import { GROUPES_CULTURAUX } from '~/functions/cultures-group'

import Button from '@codegouvfr/react-dsfr/Button'
import LegendItem from '~/ui/LegendItem'

export default function CulturesFilters({
  visibleCultures,
  culturesInViewport,
  onToggleCulture,
  onSetAllCulturesVisible,
}: {
  visibleCultures: string[]
  /** `null` pour afficher toutes les cultures. */
  culturesInViewport: string[] | null
  onToggleCulture: (code: string) => void
  onSetAllCulturesVisible: (visible: boolean) => void
}) {
  const culturesItems = values(GROUPES_CULTURAUX).filter(
    (culture) => !culturesInViewport || culturesInViewport.includes(String(culture.group_code))
  )
  const allVisible = culturesItems.every((culture) =>
    visibleCultures.includes(String(culture.group_code))
  )

  if (culturesItems.length === 0) {
    return <p className="fr-text--sm fr-mb-0">Aucune culture dans la zone visible de la carte.</p>
  }

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-end mb-2">
        <Button
          priority="tertiary no outline"
          size="small"
          onClick={() => onSetAllCulturesVisible(!allVisible)}
          iconId={allVisible ? 'fr-icon-eye-off-line' : 'fr-icon-eye-line'}
        >
          {allVisible ? 'Tout masquer' : 'Tout afficher'}
        </Button>
      </div>

      <div className="flex flex-col gap-1">
        {culturesItems.map((culture) => {
          const isVisible = visibleCultures.includes(String(culture.group_code))
          return (
            <div key={culture.group_code} style={{ opacity: isVisible ? 1 : 0.5 }}>
              <LegendItem
                label={culture.label}
                color={culture.color}
                checked={isVisible}
                onChange={() => onToggleCulture(String(culture.group_code))}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
