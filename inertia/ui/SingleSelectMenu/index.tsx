import { useState, useMemo, useRef, useEffect, useCallback, useId } from 'react'
import { fr } from '@codegouvfr/react-dsfr'
import { groupBy } from 'lodash-es'

import SingleSelectItem from './single-select-item'

export type OptionType<T> = {
  value: T
  label: string
  iconId?: string
  isSelected: boolean
  group?: string
}

export type SingleSelectMenuProps<T extends string | number> = {
  label?: string
  hint?: string
  placeholder?: string
  initialSelectedOption?: OptionType<T> | null
  options: OptionType<T>[]
  onChange: (option: OptionType<T>) => void
}

type GroupHeaderProps = {
  groupName: string
}

function GroupHeader({ groupName }: GroupHeaderProps) {
  return (
    <div
      className="font-bold fr-p-2v"
      style={{
        background: fr.colors.decisions.background.actionHigh.blueFrance.default,
        color: fr.colors.decisions.background.default.grey.default,
      }}
      id={`single-select-group-${groupName}`}
      role="heading"
      aria-level={2}
    >
      {groupName}
    </div>
  )
}

export default function SingleSelectMenu<T extends string | number>({
  label,
  hint,
  placeholder = 'Sélectionner une option',
  initialSelectedOption,
  options,
  onChange,
}: SingleSelectMenuProps<T>) {
  const containerRef = useRef<HTMLDivElement>(null)
  const baseId = useId()
  const triggerId = `triggerId-${baseId}`
  const listboxId = `listbox-${baseId}`

  const [isOpen, setIsOpen] = useState(false)
  const [searchTerm, setSearchTerm] = useState('')
  const [activeIndex, setActiveIndex] = useState(-1)

  const selectedOption =
    initialSelectedOption !== undefined
      ? initialSelectedOption
      : (options.find((opt) => opt.isSelected) ?? null)

  const filteredOptions = useMemo(() => {
    if (!searchTerm) return options
    return options.filter((opt) => opt.label.toLowerCase().includes(searchTerm.toLowerCase()))
  }, [searchTerm, options])

  const filteredOptionsByGroup = useMemo(
    () => groupBy(filteredOptions, (opt) => opt.group ?? ''),
    [filteredOptions]
  )

  // Ordre d'affichage (groupes compris), utilisé pour la navigation au clavier
  const orderedOptions = useMemo(
    () => Object.values(filteredOptionsByGroup).flat(),
    [filteredOptionsByGroup]
  )

  const getOptionId = useCallback((value: T) => `${baseId}-option-${value}`, [baseId])
  const activeOption = orderedOptions[activeIndex]
  const activeOptionId = activeOption ? getOptionId(activeOption.value) : undefined

  const openDropdown = () => {
    setIsOpen(true)
    // La recherche est vide à l'ouverture : orderedOptions contient toutes les options
    setActiveIndex(orderedOptions.findIndex((opt) => opt.value === selectedOption?.value))
  }

  const closeDropdown = useCallback(() => {
    setIsOpen(false)
    setSearchTerm('')
    setActiveIndex(-1)
  }, [])

  useEffect(() => {
    function handlePointerDown(event: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as HTMLElement)) {
        closeDropdown()
      }
    }
    if (isOpen) {
      document.addEventListener('pointerdown', handlePointerDown)
      return () => document.removeEventListener('pointerdown', handlePointerDown)
    }
  }, [isOpen, closeDropdown])

  useEffect(() => {
    if (activeOptionId) {
      document.getElementById(activeOptionId)?.scrollIntoView({ block: 'nearest' })
    }
  }, [activeOptionId])

  const handleSelect = (value: T) => {
    const option = options.find((opt) => opt.value === value)
    if (!option) return
    onChange({ ...option, isSelected: true })
    closeDropdown()
  }

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (!isOpen) {
      if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
        event.preventDefault()
        openDropdown()
      }
      return
    }

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault()
        setActiveIndex((index) => Math.min(index + 1, orderedOptions.length - 1))
        break
      case 'ArrowUp':
        event.preventDefault()
        setActiveIndex((index) => Math.max(index - 1, 0))
        break
      case 'Enter':
        event.preventDefault()
        if (activeOption) handleSelect(activeOption.value)
        break
      case 'Escape':
        event.preventDefault()
        closeDropdown()
        break
      case 'Tab':
        closeDropdown()
        break
    }
  }

  return (
    <div ref={containerRef} className="fr-select-group" style={{ marginBottom: 0 }}>
      {label && (
        <label className="fr-label" htmlFor={triggerId}>
          {label}
          {hint && <span className="fr-hint-text">{hint}</span>}
        </label>
      )}

      <div style={{ position: 'relative' }}>
        {/* Fermé, le champ affiche la sélection ; ouvert, il sert de recherche
            et la sélection passe en placeholder pour pouvoir taper directement */}
        <input
          id={triggerId}
          type="text"
          className="fr-select"
          value={isOpen ? searchTerm : (selectedOption?.label ?? '')}
          placeholder={isOpen && selectedOption ? selectedOption.label : placeholder}
          onChange={(e) => {
            if (!isOpen) setIsOpen(true)
            setSearchTerm(e.target.value)
            setActiveIndex(0)
          }}
          onClick={() => {
            if (!isOpen) openDropdown()
          }}
          onKeyDown={handleKeyDown}
          role="combobox"
          aria-autocomplete="list"
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          aria-controls={listboxId}
          aria-activedescendant={isOpen ? activeOptionId : undefined}
          style={{
            width: '100%',
            textAlign: 'left',
            cursor: 'text',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        />

        {isOpen && (
          <div
            id={listboxId}
            className="absolute shadow-lg flex flex-col gap-1"
            style={{
              top: '100%',
              left: 0,
              right: 0,
              zIndex: 9999,
              background: fr.colors.decisions.background.default.grey.default,
              maxHeight: 200,
              width: '100%',
              overflowY: 'auto',
              overflowX: 'hidden',
            }}
            role="listbox"
            aria-label={label}
          >
            {filteredOptions.length > 0 ? (
              Object.keys(filteredOptionsByGroup).map((groupName) => (
                <div
                  key={groupName}
                  role="group"
                  aria-labelledby={groupName ? `single-select-group-${groupName}` : undefined}
                >
                  {groupName && <GroupHeader groupName={groupName} />}
                  {filteredOptionsByGroup[groupName].map((option, index, arr) => (
                    <SingleSelectItem
                      key={option.value}
                      id={getOptionId(option.value)}
                      item={option}
                      iconId={option.iconId}
                      isLast={index === arr.length - 1}
                      isActive={option === activeOption}
                      onSelect={handleSelect}
                    />
                  ))}
                </div>
              ))
            ) : (
              <div className="w-full italic text-center fr-p-2v" role="option" aria-disabled="true">
                Aucune option disponible
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
