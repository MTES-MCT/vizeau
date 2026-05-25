import { useState, useRef, useEffect, useCallback, useId } from 'react'
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
  options,
  onChange,
}: SingleSelectMenuProps<T>) {
  const [isOpen, setIsOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)
  const triggerId = `triggerId-${useId()}`

  const selectedOption = options.find((opt) => opt.isSelected)
  const closeDropdown = useCallback(() => setIsOpen(false), [])

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

  const handleSelect = (value: T) => {
    const option = options.find((opt) => opt.value === value)
    if (!option) return
    onChange({ ...option, isSelected: true })
    closeDropdown()
  }

  const optionsByGroup = groupBy(options, (opt) => opt.group ?? '')

  return (
    <div ref={containerRef} className="fr-select-group" style={{ marginBottom: 0 }}>
      {label && (
        <label className="fr-label" htmlFor={triggerId}>
          {label}
          {hint && <span className="fr-hint-text">{hint}</span>}
        </label>
      )}

      <div style={{ position: 'relative' }}>
        <button
          id={triggerId}
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          aria-haspopup="listbox"
          aria-expanded={isOpen}
          className="fr-select"
          style={{
            appearance: 'none',
            WebkitAppearance: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            width: '100%',
            textAlign: 'left',
            cursor: 'pointer',
          }}
        >
          <span
            style={{
              color: selectedOption
                ? fr.colors.decisions.text.default.grey.default
                : fr.colors.decisions.text.mention.grey.default,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {selectedOption ? selectedOption.label : placeholder}
          </span>
        </button>

        {isOpen && (
          <div
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
            {options.length > 0 ? (
              Object.keys(optionsByGroup).map((groupName) => (
                <div
                  key={groupName}
                  role="group"
                  aria-labelledby={groupName ? `single-select-group-${groupName}` : undefined}
                >
                  {groupName && <GroupHeader groupName={groupName} />}
                  {optionsByGroup[groupName].map((option, index, arr) => (
                    <SingleSelectItem
                      key={option.value}
                      item={option}
                      iconId={option.iconId}
                      isLast={index === arr.length - 1}
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
