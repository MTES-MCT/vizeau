import { useState, useRef, useEffect } from 'react'
import { createPortal } from 'react-dom'

import { Checkbox } from '@codegouvfr/react-dsfr/Checkbox'
import { Button } from '@codegouvfr/react-dsfr/Button'

import { OptionType } from './index.js'
import { fr } from '@codegouvfr/react-dsfr'

export type DropdownAction = {
  value: string
  label: string
  iconId?: string
  isCritical?: boolean
  onClick: (value: string) => void
}

export type DropdownItemProps = {
  item: OptionType
  onToggle: (value: string) => void
}

export default function DropdownItem({ item, onToggle }: DropdownItemProps) {
  const buttonRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const [menuOpen, setMenuOpen] = useState(false)
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null)

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

  // Fonction pour calculer la position du menu (collé au bord droit du bouton)
  const updateMenuPosition = () => {
    if (menuOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect()
      setMenuPosition({
        top: rect.bottom + window.scrollY,
        left: rect.right + window.scrollX,
      })
    }
  }

  useEffect(() => {
    updateMenuPosition()
    if (!menuOpen) return
    window.addEventListener('resize', updateMenuPosition)
    window.addEventListener('scroll', updateMenuPosition, true)
    // Recalcule la position après le premier render du menu
    const timer = setTimeout(updateMenuPosition, 0)
    return () => {
      window.removeEventListener('resize', updateMenuPosition)
      window.removeEventListener('scroll', updateMenuPosition, true)
      clearTimeout(timer)
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
                name: item.value,
                value: item.value,
                onChange: () => onToggle(item.value),
                checked: item.isSelected,
              },
            },
          ]}
        />
      </div>

      {item.actions && item.actions.length > 0 && (
        <div>
          <div className="relative" ref={buttonRef}>
            <Button
              onClick={() => setMenuOpen(!menuOpen)}
              title="Ouvrir le menu des options"
              iconId="fr-icon-more-fill"
              size="small"
              priority="tertiary no outline"
            />
          </div>

          {menuOpen &&
            menuPosition &&
            createPortal(
              <div
                ref={menuRef}
                className="dropdown-action-menu shadow-lg absolute h-fit w-fit"
                style={{
                  top: menuPosition.top,
                  left: menuPosition.left,
                  transform: 'translateX(-100%)',
                  background: fr.colors.decisions.background.default.grey.default,
                  zIndex: 9999,
                }}
              >
                <ul className="fr-px-2v w-fit flex flex-col gap-2">
                  {item.actions.map((action) => (
                    <li
                      key={action.value}
                      className="list-none w-fit flex items-center gap-2 cursor-pointer"
                      style={{
                        color: `${action.isCritical ? fr.colors.decisions.text.default.error.default : ''}`,
                      }}
                      onClick={(event) => {
                        event.stopPropagation()
                        action.onClick(item.value)
                        setMenuOpen(false)
                      }}
                    >
                      {action.iconId && <span className={`${action.iconId} fr-icon--sm`} />}
                      {action.label}
                    </li>
                  ))}
                </ul>
              </div>,
              document.body
            )}
        </div>
      )}
    </div>
  )
}
