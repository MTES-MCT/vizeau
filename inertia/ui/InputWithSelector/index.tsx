import { useRef, useState, useEffect } from 'react'
import Input from '@codegouvfr/react-dsfr/Input'
import DropdownItem from './dropdown-item'

import type { DropdownAction } from './dropdown-item'

import { fr } from '@codegouvfr/react-dsfr'

export type OptionType<T> = {
  value: T
  label: string
  isSelected: boolean
  actions?: DropdownAction<T>[]
}

export type InputWithSelectorProps<T> = {
  inputValue: string
  options: OptionType<T>[]
  handleInputChange: (value: string) => void
  onOptionsChange: (options: OptionType<T>[]) => void
  label: string
  hintText?: string
}

export default function InputWithSelector<T extends string | number>({
  inputValue,
  options,
  handleInputChange,
  onOptionsChange,
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

  // Gestion sélection/désélection
  const handleToggle = (value: T) => {
    const updatedOptions = options.map((opt) =>
      opt.value === value ? { ...opt, isSelected: !opt.isSelected } : opt
    )
    onOptionsChange(updatedOptions)
  }

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <Input
        nativeInputProps={{
          value: inputValue,
          onChange: (e) => handleInputChange(e.currentTarget.value),
          onFocus: () => setDropdownOpen(true),
          onClick: () => setDropdownOpen(true),
        }}
        {...props}
      />

      {options?.length > 0 && dropdownOpen && (
        <div
          className="absolute shadow-lg z-10"
          style={{
            top: '100%',
            left: 0,
            right: 0,
            background: fr.colors.decisions.background.default.grey.default,
            overflowY: 'auto',
          }}
        >
          {options.map((opt) => {
            return <DropdownItem<T> key={opt.value} item={opt} onToggle={handleToggle} />
          })}
        </div>
      )}
    </div>
  )
}
