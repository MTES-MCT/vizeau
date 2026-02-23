import { values } from 'lodash-es'
import { GROUPES_CULTURAUX } from '~/functions/cultures-group'

import Button from '@codegouvfr/react-dsfr/Button'
import LegendItem from '~/ui/LegendItem'

export default function CulturesFilters({
  visibleCultures,
  onToggleCulture,
  onToggleAllCultures,
}: {
  visibleCultures: string[]
  onToggleCulture: (code: string) => void
  onToggleAllCultures: () => void
}) {
  const culturesItems = values(GROUPES_CULTURAUX)
  const allCodes = Object.keys(GROUPES_CULTURAUX)
  const allVisible = visibleCultures.length === allCodes.length

  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-end mb-2">
        <Button
          priority="tertiary no outline"
          size="small"
          onClick={onToggleAllCultures}
          iconId={allVisible ? 'fr-icon-eye-off-line' : 'fr-icon-eye-line'}
        >
          {allVisible ? 'Tout masquer' : 'Tout afficher'}
        </Button>
      </div>

      <div className="flex flex-col gap-1">
        {culturesItems.map((culture) => {
          const isVisible = visibleCultures.includes(String(culture.code_group))
          return (
            <div key={culture.code_group} style={{ opacity: isVisible ? 1 : 0.5 }}>
              <LegendItem
                label={culture.label}
                color={culture.color}
                checked={isVisible}
                onChange={() => onToggleCulture(String(culture.code_group))}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
