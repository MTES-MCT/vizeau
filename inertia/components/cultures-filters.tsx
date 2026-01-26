import { values } from 'lodash-es'
import { GROUPES_CULTURAUX, getContrastedPicto } from '~/functions/cultures-group'
import Checkbox from '@codegouvfr/react-dsfr/Checkbox'
import Button from '@codegouvfr/react-dsfr/Button'

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
            <div
              key={culture.code_group}
              style={{ opacity: isVisible ? 1 : 0.5 }}
            >
              <Checkbox
                className="fr-m-0"
                small
                options={[
                  {
                    label: (
                      <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-1 rounded">
                        <div
                          className="w-3 h-3 rounded-full flex-shrink-0"
                          style={{ backgroundColor: culture.color }}
                        />
                        <img
                          src={getContrastedPicto(culture)}
                          alt={culture.label}
                          className="w-4 h-4 flex-shrink-0"
                        />
                        <span className="text-sm">{culture.label}</span>
                      </div>
                    ),
                    nativeInputProps: {
                      checked: isVisible,
                      onChange: () => onToggleCulture(String(culture.code_group)),
                    },
                  },
                ]}
              />
            </div>
          )
        })}
      </div>
    </div>
  )
}
