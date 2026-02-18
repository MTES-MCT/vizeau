import React, { useRef, useState, useEffect, useCallback } from 'react'
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
  hint?: string
  emptyMenuPlaceholder?: string
  additionnalActions?: React.ReactNode
  icon?: string | any
}

export default function InputWithSelector<T extends string | number>({
  inputValue,
  options,
  hint,
  icon,
  handleInputChange,
  onOptionChange,
  emptyMenuPlaceholder,
  additionnalActions,
  ...props
}: InputWithSelectorProps<T>) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const closeDropdown = useCallback(() => {
    setDropdownOpen(false)
  }, [])

  const openDropdown = useCallback(() => {
    setDropdownOpen(true)
  }, [])

  // Close dropdown when clicking outside
  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      const target = event.target as HTMLElement

      // Ignore clicks on dropdown action menu
      if (target.closest('.dropdown-action-menu')) {
        return
      }

      // Close if click is outside the container
      if (containerRef.current && !containerRef.current.contains(target)) {
        closeDropdown()
      }
    }

    if (dropdownOpen) {
      document.addEventListener('pointerdown', handlePointerDown)
      return () => document.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [dropdownOpen, closeDropdown])

  const handleInputValueChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    handleInputChange(event.currentTarget.value)
  }

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <Input
        className="fr-m-0"
        hintText={hint}
        iconId={icon}
        nativeInputProps={{
          'value': inputValue,
          'onChange': handleInputValueChange,
          'onFocus': openDropdown,
          'onClick': openDropdown,
          'aria-expanded': dropdownOpen,
          'aria-haspopup': 'listbox',
        }}
        {...props}
      />

      {dropdownOpen && (
        <SelectorMenu
          options={options}
          onOptionChange={onOptionChange}
          placeholder={emptyMenuPlaceholder}
          additionnalActions={additionnalActions}
        />
      )}
    </div>
  )
}
