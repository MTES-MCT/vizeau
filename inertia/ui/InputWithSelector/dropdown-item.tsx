import { Checkbox } from '@codegouvfr/react-dsfr/Checkbox'
import { fr } from '@codegouvfr/react-dsfr'

import { OptionType } from './index.js'
import MoreButton from '../MoreButton/index'

export type DropdownAction<T> = {
  value: T
  label: string
  iconId?: string
  isCritical?: boolean
  onClick: (value: T) => void
}

export type DropdownItemProps<T> = {
  item: OptionType<T>
  isLast?: boolean
  onToggle: (value: T) => void
}

export default function DropdownItem<T extends string | number>({
  item,
  isLast,
  onToggle,
}: DropdownItemProps<T>) {
  const hasActions = item.actions && item.actions.length > 0

  const handleChange = () => onToggle(item.value)

  const mappedActions = item.actions?.map((action) => ({
    label: action.label,
    iconId: action.iconId,
    isCritical: action.isCritical,
    onClick: () => action.onClick(item.value),
  }))

  return (
    <div
      className="flex items-center justify-between fr-py-1v fr-px-2v relative"
      style={{
        borderBottom: `${isLast ? 'none' : `solid 1px ${fr.colors.decisions.border.default.grey.default}`}`,
      }}
      role="option"
      aria-selected={item.isSelected}
    >
      <div className="flex-1">
        <Checkbox
          small
          options={[
            {
              label: item.label,
              nativeInputProps: {
                name: item.value.toString(),
                value: item.value,
                onChange: handleChange,
                checked: item.isSelected,
              },
            },
          ]}
        />
      </div>

      {hasActions && <MoreButton actions={mappedActions || []} />}
    </div>
  )
}
