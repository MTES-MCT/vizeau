import { useState, useRef, useEffect } from 'react'

import { fr } from '@codegouvfr/react-dsfr'
import { Input } from '@codegouvfr/react-dsfr/Input'

interface SearchAutocompleteProps<T> {
  label: string
  className?: string
  id?: string
  placeholder?: string
  type?: string
  options: T[]
  value?: T | null
  onChange?: (value: T) => void
  onInputChange?: (value: string) => void
  required?: boolean
  getOptionLabel: (option: T) => string
  getOptionKey?: (option: T) => string | number
  renderOption?: (option: T) => React.ReactNode
}

export default function SearchAutocomplete<T>(props: SearchAutocompleteProps<T>) {
  const {
    label,
    className,
    id,
    placeholder,
    type = 'text',
    options,
    value,
    onChange,
    onInputChange,
    required,
    getOptionLabel,
    getOptionKey,
    renderOption,
  } = props
  const [inputValue, setInputValue] = useState(value ? getOptionLabel(value) : '')
  const [isOpen, setIsOpen] = useState(false)
  const [filteredOptions, setFilteredOptions] = useState<T[]>([])
  const containerRef = useRef<HTMLDivElement>(null)


  useEffect(() => {
    const filtered = options.filter((option) =>
      getOptionLabel(option).toLowerCase().includes(inputValue.toLowerCase())
    )
    setFilteredOptions(filtered)
  }, [inputValue, options, getOptionLabel])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value
    setInputValue(newValue)
    setIsOpen(true)
    onInputChange?.(newValue)
  }

  const handleOptionClick = (option: T) => {
    setInputValue(getOptionLabel(option))
    setIsOpen(false)
    onChange?.(option)
  }

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <Input
        label={label}
        className={className}
        style={{ margin: 0, padding: 0 }}
        nativeInputProps={{
          id,
          placeholder,
          type,
          value: inputValue,
          onChange: handleInputChange,
          onFocus: () => setIsOpen(true),
          required: required,
        }}
      />
      {isOpen && filteredOptions.length > 0 && (
        <ul
          className="fr-menu"
          style={{
            position: 'absolute',
            width: '100%',
            maxHeight: '300px',
            overflow: 'auto',
            backgroundColor: fr.colors.decisions.background.default.grey.default,
            boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
            margin: 0,
            padding: 0,
            listStyle: 'none',
            top: '100%',
            left: 0,
            border: '1px solid var(--border-default-grey)',
            pointerEvents: 'auto',
          }}
        >
          {filteredOptions.map((option, index) => (
            <li
              key={getOptionKey ? getOptionKey(option) : index}
              className="fr-menu__item"
              style={{
                cursor: 'pointer',
                padding: '12px 16px',
                backgroundColor: index % 2 === 0
                  ? fr.colors.decisions.background.default.grey.default
                  : fr.colors.decisions.background.alt.grey.default,
              }}
              onClick={() => handleOptionClick(option)}
              onMouseEnter={(e) =>
                (e.currentTarget.style.backgroundColor =
                  fr.colors.decisions.background.alt.blueFrance.default)
              }
              onMouseLeave={(e) =>
                (e.currentTarget.style.backgroundColor =
                  fr.colors.decisions.background.default.grey.default)
              }
            >
              {renderOption ? renderOption(option) : getOptionLabel(option)}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
