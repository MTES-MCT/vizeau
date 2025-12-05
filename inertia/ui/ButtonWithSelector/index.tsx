import { useState } from 'react'

import SelectorMenu from '../SelectorMenu'
import Button from '@codegouvfr/react-dsfr/Button'
import { DropdownAction } from '../InputWithSelector/dropdown-item'

export type OptionType<T extends string | number> = {
  value: T
  label: string
  isSelected: boolean
  actions?: DropdownAction<T>[]
}

export type ButtonWithSelectorProps<T extends string | number> = {
  label: string
  priority?: 'primary' | 'secondary' | 'tertiary' | 'tertiary no outline'
  options: OptionType<T>[]
  onOptionChange: (option: OptionType<T>) => void
}

export default function ButtonWithSelector<T extends string | number>({
  label,
  priority = 'secondary',
  options,
  onOptionChange,
}: ButtonWithSelectorProps<T>) {
  const [dropdownOpen, setDropdownOpen] = useState(false)

  return (
    <div style={{ position: 'relative', width: 'fit-content' }}>
      <Button className="fr-m-0" onClick={() => setDropdownOpen(!dropdownOpen)} priority={priority}>
        {label}
      </Button>

      {options?.length > 0 && dropdownOpen && (
        <SelectorMenu options={options} onOptionChange={onOptionChange} />
      )}
    </div>
  )
}
