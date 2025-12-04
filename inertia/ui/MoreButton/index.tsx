import { useEffect, useRef, useState } from 'react'
import { fr } from '@codegouvfr/react-dsfr'
import { createPortal } from 'react-dom'

import { Button } from '@codegouvfr/react-dsfr/Button'

export type MoreButtonProps = {
  actions: {
    label: string
    iconId?: string
    isCritical?: boolean
    onClick: () => void
  }[]
}
export default function MoreButton({ actions }: MoreButtonProps) {
  const buttonRef = useRef<HTMLDivElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  const [menuOpen, setMenuOpen] = useState(false)
  const [menuPosition, setMenuPosition] = useState<{ top: number; left: number } | null>(null)

  // Gère le focus sur le menu quand il s'ouvre et la touche Échap
  useEffect(() => {
    if (!menuOpen) return

    // Focus sur le premier élément du menu après le rendu
    const timer = setTimeout(() => {
      if (menuRef.current) {
        const firstItem = menuRef.current.querySelector('[role="menuitem"]') as HTMLElement
        if (firstItem) {
          firstItem.focus()
        }
      }
    }, 0)

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

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setMenuOpen(false)
        // Remet le focus sur le bouton
        buttonRef.current?.querySelector('button')?.focus()
      }
    }

    document.addEventListener('pointerdown', handleClickOutside)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('pointerdown', handleClickOutside)
      document.removeEventListener('keydown', handleKeyDown)
      clearTimeout(timer)
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
    actions.length > 0 && (
      <div className="fr-ml-2v">
        <div className="relative w-fit" ref={buttonRef}>
          <Button
            type="button"
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
              <ul className="fr-px-2v w-fit flex flex-col gap-2" role="menu">
                {actions.map((action) => (
                  <li
                    key={action.label}
                    className="list-none w-fit flex items-center gap-2 cursor-pointer"
                    style={{
                      color: `${action.isCritical ? fr.colors.decisions.text.default.error.default : ''}`,
                    }}
                    onClick={(event) => {
                      event.stopPropagation()
                      action.onClick()
                      setMenuOpen(false)
                    }}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        action.onClick()
                        setMenuOpen(false)
                      }
                    }}
                    role="menuitem"
                    tabIndex={0}
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
    )
  )
}
