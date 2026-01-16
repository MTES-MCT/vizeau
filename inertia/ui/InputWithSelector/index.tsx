import { useRef, useState, useEffect } from 'react'
import Input from '@codegouvfr/react-dsfr/Input'

import type { DropdownAction } from './dropdown-item'

import SelectorMenu from '../SelectorMenu'

export type OptionType<T> = {
  value: T
  label: string
  isSelected: boolean
  group?: string
  actions?: DropdownAction<T>[]
}

export type InputWithSelectorProps<T> = {
  inputValue: string
  options: OptionType<T>[]
  handleInputChange: (value: string) => void
  onOptionChange: (updatedOption: OptionType<T>) => void
  label: string
  hintText?: string
}

export default function InputWithSelector<T extends string | number>({
  inputValue,
  options,
  handleInputChange,
  onOptionChange,
  ...props
}: InputWithSelectorProps<T>) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Fermer le dropdown au clic en dehors
  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      // Ignore clicks on dropdown action menu
      const target = event.target as HTMLElement
      if (target.closest('.dropdown-action-menu')) return
      if (containerRef.current && !containerRef.current.contains(target)) {
        setDropdownOpen(false)
      }
    }
    if (dropdownOpen) {
      document.addEventListener('pointerdown', handlePointerDown)
    }
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [dropdownOpen])

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <Input
        className="fr-m-0"
        nativeInputProps={{
          value: inputValue,
          onChange: (e) => handleInputChange(e.currentTarget.value),
          onFocus: () => setDropdownOpen(true),
          onClick: () => setDropdownOpen(true),
        }}
        {...props}
      />

      {options?.length > 0 && dropdownOpen && (
        <SelectorMenu options={options} onOptionChange={onOptionChange} />
      )}
    </div>
  )
}
