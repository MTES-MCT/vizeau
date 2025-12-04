import { Checkbox } from '@codegouvfr/react-dsfr/Checkbox'

import { OptionType } from './index.js'
import { fr } from '@codegouvfr/react-dsfr'

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
  onToggle: (value: T) => void
}

export default function DropdownItem<T extends string | number>({
  item,
  onToggle,
}: DropdownItemProps<T>) {
  return (
    <div
      className="flex items-center justify-between fr-py-1v fr-px-2v relative"
      style={{ borderBottom: `solid 1px ${fr.colors.decisions.border.default.grey.default}` }}
    >
      <div className="flex-1 gap-2 flex items-center">
        <Checkbox
          small
          options={[
            {
              label: item.label,
              nativeInputProps: {
                name: item.value.toString(),
                value: item.value,
                onChange: () => onToggle(item.value),
                checked: item.isSelected,
              },
            },
          ]}
        />
      </div>

      <MoreButton
        actions={
          item.actions?.map((action) => ({
            label: action.label,
            iconId: action.iconId,
            isCritical: action.isCritical,
            onClick: () => action.onClick(item.value),
          })) || []
        }
      />
    </div>
  )
}
