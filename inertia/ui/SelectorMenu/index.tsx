import { fr } from '@codegouvfr/react-dsfr'
import { groupBy } from 'lodash-es'
import DropdownItem from '../InputWithSelector/dropdown-item'
import { OptionType } from '../InputWithSelector'
import React from 'react'

const MENU_MAX_HEIGHT = '190px'
const MENU_Z_INDEX = 9999
const MENU_PLACEHOLDER = 'Aucune option disponible'

export type SelectorMenuProps<T extends string | number> = {
  options?: OptionType<T>[]
  placeholder?: string
  additionnalActions?: React.ReactNode
  onOptionChange: (updatedOption: OptionType<T>) => void
}

type GroupHeaderProps = {
  groupName: string
}

function GroupHeader({ groupName }: GroupHeaderProps) {
  return (
    <div
      className="fr-px-2v fr-py-1v font-bold text-sm"
      style={{
        background: fr.colors.decisions.background.actionHigh.blueFrance.default,
        color: fr.colors.decisions.background.default.grey.default,
      }}
      role="group"
      aria-label={groupName}
    >
      {groupName}
    </div>
  )
}

type OptionGroupProps<T extends string | number> = {
  groupName: string
  options: OptionType<T>[]
  onToggle: (value: T) => void
}

function OptionGroup<T extends string | number>({
  groupName,
  options,
  onToggle,
}: OptionGroupProps<T>) {
  return (
    <div key={groupName}>
      {groupName && <GroupHeader groupName={groupName} />}
      {options.map((option, index) => (
        <DropdownItem
          key={option.value}
          item={option}
          onToggle={onToggle}
          isLast={index === options.length - 1}
        />
      ))}
    </div>
  )
}

export default function SelectorMenu<T extends string | number>({
  placeholder,
  options,
  onOptionChange,
  additionnalActions,
}: SelectorMenuProps<T>) {
  const handleToggle = (value: T) => {
    const optionToUpdate = options?.find((opt) => opt.value === value)
    if (!optionToUpdate) return

    const updatedOption = {
      ...optionToUpdate,
      isSelected: !optionToUpdate.isSelected,
    }
    onOptionChange(updatedOption)
  }

  const optionsByGroup = groupBy(options, (opt) => opt.group || '')
  const groupNames = Object.keys(optionsByGroup)
  const hasOptions = options && options.length > 0

  return (
    <div
      className="absolute shadow-lg flex flex-col gap-1 fr-p-2v"
      style={{
        top: '100%',
        left: 0,
        right: 0,
        zIndex: MENU_Z_INDEX,
        background: fr.colors.decisions.background.default.grey.default,
        maxHeight: MENU_MAX_HEIGHT,
        width: 'fit-content',
        overflowY: 'auto',
        overflowX: 'hidden',
      }}
      role="listbox"
    >
      {hasOptions ? (
        groupNames.map((groupName) => (
          <OptionGroup
            key={groupName}
            groupName={groupName}
            options={optionsByGroup[groupName]}
            onToggle={handleToggle}
          />
        ))
      ) : (
        <div
          className="w-full italic text-center"
          style={{ color: fr.colors.decisions.text.mention.grey.default }}
        >
          {placeholder || MENU_PLACEHOLDER}
        </div>
      )}

      {additionnalActions && <div className="w-full">{additionnalActions}</div>}
    </div>
  )
}
