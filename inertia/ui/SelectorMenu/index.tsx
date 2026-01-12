import { fr } from '@codegouvfr/react-dsfr'
import { groupBy } from 'lodash-es'
import DropdownItem from '../InputWithSelector/dropdown-item'
import { OptionType } from '../InputWithSelector'

export type SelectorMenuProps<T extends string | number> = {
  options: OptionType<T>[]
  onOptionChange: (updatedOption: OptionType<T>) => void
}

export default function SelectorMenu<T extends string | number>({
  options,
  onOptionChange,
}: SelectorMenuProps<T>) {
  const handleToggle = (value: T) => {
    const updatedOption = options.find((opt) => opt.value === value)

    if (!updatedOption) return

    const updated = { ...updatedOption, isSelected: !updatedOption.isSelected }
    onOptionChange(updated)
  }

  // Grouper les options
  const optionsByGroup = groupBy(options, (opt) => opt.group || '')
  const groupNames = Object.keys(optionsByGroup)

  return (
    <div
      className="absolute shadow-lg z-[9999]"
      style={{
        top: '100%',
        left: 0,
        right: 0,
        background: fr.colors.decisions.background.default.grey.default,
        overflowY: 'auto',
        width: '100%',
      }}
    >
      {groupNames &&
        groupNames.map((groupName) => (
          <div key={groupName}>
            {groupName && (
              <div
                className="fr-px-2v fr-py-1v font-bold text-sm"
                style={{
                  background: fr.colors.decisions.background.actionHigh.blueFrance.default,
                  color: fr.colors.decisions.background.default.grey.default,
                }}
                role="group"
                aria-labelledby={groupName}
              >
                {groupName}
              </div>
            )}

            {optionsByGroup[groupName].map((opt) => (
              <DropdownItem key={opt.value} item={opt} onToggle={handleToggle} />
            ))}
          </div>
        ))}
    </div>
  )
}
