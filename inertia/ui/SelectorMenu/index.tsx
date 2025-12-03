import { fr } from '@codegouvfr/react-dsfr'
import DropdownItem, { DropdownAction } from '../InputWithSelector/dropdown-item'

export type SelectorMenuProps<T extends string | number> = {
  options: {
    value: T
    label: string
    isSelected: boolean
    actions?: DropdownAction<T>[]
  }[]
  onOptionChange: (updatedOption: {
    value: T
    label: string
    isSelected: boolean
    actions?: DropdownAction<T>[]
  }) => void
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
      {options.map((opt) => {
        return <DropdownItem key={opt.value} item={opt} onToggle={handleToggle} />
      })}
    </div>
  )
}
