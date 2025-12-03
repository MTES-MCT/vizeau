import { useState, useRef, useEffect } from 'react'

import { Checkbox } from '@codegouvfr/react-dsfr/Checkbox'

import { OptionType } from './index.js'
import { fr } from '@codegouvfr/react-dsfr'

import MoreButton from '../MoreButton/index'

export type DropdownAction<T> = {
  value: T
  label: string
  iconId?: string
  isCritical?: boolean
  onClick: (value: T) => void
}

export type DropdownItemProps<T> = {
  item: OptionType<T>
  onToggle: (value: T) => void
}

export default function DropdownItem<T extends string | number>({
  item,
  onToggle,
}: DropdownItemProps<T>) {
  const buttonRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const [menuOpen, setMenuOpen] = useState(false)

  // Ferme le menu si clic en dehors
  useEffect(() => {
    if (!menuOpen) return

    const handleClickOutside = (event: PointerEvent) => {
      const btn = buttonRef.current
      const menu = menuRef.current
      if (
        btn &&
        !btn.contains(event.target as Node) &&
        menu &&
        !menu.contains(event.target as Node)
      ) {
        setMenuOpen(false)
      }
    }
    document.addEventListener('pointerdown', handleClickOutside)

    return () => {
      document.removeEventListener('pointerdown', handleClickOutside)
    }
  }, [menuOpen])

  return (
    <div
      className="flex items-center justify-between fr-py-1v fr-px-2v relative"
      style={{ borderBottom: `solid 1px ${fr.colors.decisions.border.default.grey.default}` }}
    >
      <div className="w-full">
        <Checkbox
          small
          options={[
            {
              label: item.label,
              nativeInputProps: {
                name: item.value.toString(),
                value: item.value,
                onChange: () => onToggle(item.value),
                checked: item.isSelected,
              },
            },
          ]}
        />
      </div>

      <MoreButton
        actions={
          item.actions?.map((action) => ({
            label: action.label,
            iconId: action.iconId,
            isCritical: action.isCritical,
            onClick: () => action.onClick(item.value),
          })) || []
        }
      />
    </div>
  )
}
