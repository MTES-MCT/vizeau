import { useRef, useState, useEffect } from 'react'
import Input from '@codegouvfr/react-dsfr/Input'
import DropdownItem from './dropdown-item'

export type OptionType = {
  value: string
  label: string
  isSelected: boolean
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
  label,
  hintText,
  ...props
}: InputWithSelectorProps) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  // Fermer le dropdown au clic en dehors
  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
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

  // Gestion suppression
  const handleDelete = (value: string) => {
    const updatedOptions = options.filter((opt) => opt.value !== value)
    onOptionsChange(updatedOptions)
  }

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <Input
        label={label}
        hintText={hintText}
        nativeInputProps={{
          value: inputValue,
          onChange: (e) => handleInputChange(e.currentTarget.value),
          onFocus: () => setDropdownOpen(true),
          onClick: () => setDropdownOpen(true),
        }}
        {...props}
      />
      {dropdownOpen && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            right: 0,
            background: 'white',
            border: '1px solid #ccc',
            zIndex: 10,
            maxHeight: 200,
            overflowY: 'auto',
          }}
        >
          {options.length > 0 ? (
            options.map((opt) => (
              <DropdownItem
                key={opt.value}
                item={opt}
                onToggle={handleToggle}
                onDelete={handleDelete}
              />
            ))
          ) : (
            <div style={{ padding: '8px', color: '#888' }}>Aucune option</div>
          )}
        </div>
      )}
    </div>
  )
}
