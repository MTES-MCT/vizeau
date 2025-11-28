import { useRef, useState, useEffect } from 'react'
import Input from '@codegouvfr/react-dsfr/Input'
import DropdownItem from './dropdown-item'

import type { DropdownAction } from './dropdown-item'

import { fr } from '@codegouvfr/react-dsfr'

export type OptionType = {
  value: string
  label: string
  isSelected: boolean
  actions?: DropdownAction[]
}

export type InputWithSelectorProps = {
  inputValue: string
  options: OptionType[]
  handleInputChange: (value: string) => void
  onOptionsChange: (options: OptionType[]) => void
  label: string
  hintText?: string
}

export default function InputWithSelector({
  inputValue,
  options,
  handleInputChange,
  onOptionsChange,
  ...props
}: InputWithSelectorProps) {
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
  const handleToggle = (value: string) => {
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
            return <DropdownItem key={opt.value} item={opt} onToggle={handleToggle} />
          })}
        </div>
      )}
    </div>
  )
}
