import { useEffect, useId, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

import { fr } from '@codegouvfr/react-dsfr'
import { SegmentedControl } from '@codegouvfr/react-dsfr/SegmentedControl'

type WorkspacePanel = {
  title: string
  subtitle?: string
  /** Remplace le titre visible du header ; le titre reste lu par les lecteurs d'écran. */
  headerContent?: React.ReactNode
  /** Toujours visible au-dessus du contenu, qui défile seul. */
  toolbar?: React.ReactNode
  content: React.ReactNode
  tabLabel?: string
}

function PanelBody({ toolbar, content }: Pick<WorkspacePanel, 'toolbar' | 'content'>) {
  return (
    <>
      {toolbar && <div className="shrink-0 fr-px-2w fr-pt-2w">{toolbar}</div>}
      <div className="flex-1 min-h-0 overflow-auto fr-p-2w">{content}</div>
    </>
  )
}

export type WorkspaceLayoutProps = {
  variant: 'overlay' | 'inline'
  /** Ignoré en inline. */
  isOpen: boolean
  title: string
  subtitle?: string
  onClose: () => void
  left: WorkspacePanel
  center: { tabLabel: string; content: React.ReactNode }
  right: WorkspacePanel & { badge?: number }
  footer: React.ReactNode
}

type Pane = 'left' | 'center' | 'right'

// Au-dessus du header DSFR, sous ses modales (1750)
const OVERLAY_Z_INDEX = 1600

const panelHeaderStyle = {
  background: fr.colors.decisions.background.alt.blueFrance.default,
}
const borderColor = fr.colors.decisions.border.default.grey.default

function PanelHeader({
  id,
  title,
  subtitle,
  headerContent,
}: { id: string } & Pick<WorkspacePanel, 'title' | 'subtitle' | 'headerContent'>) {
  return (
    <div
      className="flex flex-col items-start justify-center min-h-17 fr-px-2w shrink-0"
      style={panelHeaderStyle}
    >
      <h2 id={id} className={`fr-text--lg font-medium fr-m-0 ${headerContent ? 'fr-sr-only' : ''}`}>
        {title}
      </h2>
      {headerContent}
      {subtitle && <p className="fr-text--xs fr-text-mention--grey fr-m-0">{subtitle}</p>}
    </div>
  )
}

export default function WorkspaceLayout({
  variant,
  isOpen,
  title,
  subtitle,
  onClose,
  left,
  center,
  right,
  footer,
}: WorkspaceLayoutProps) {
  const isOverlay = variant === 'overlay'
  const isVisible = !isOverlay || isOpen
  const [activePane, setActivePane] = useState<Pane>('center')
  const titleRef = useRef<HTMLHeadingElement>(null)
  const onCloseRef = useRef(onClose)
  const ids = { title: useId(), left: useId(), right: useId() }

  useEffect(() => {
    onCloseRef.current = onClose
  }, [onClose])

  useEffect(() => {
    if (!isOverlay || !isOpen) return

    const opener = document.activeElement as HTMLElement | null
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    titleRef.current?.focus()

    const handleKeyDown = (event: KeyboardEvent) => {
      // Une modale DSFR ouverte par-dessus gère elle-même sa touche Échap
      if (event.key !== 'Escape' || document.querySelector('.fr-modal--opened')) return
      onCloseRef.current()
    }
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
      document.body.style.overflow = previousOverflow
      opener?.focus()
    }
  }, [isOverlay, isOpen])

  if (!isVisible) return null

  const paneClassName = (pane: Pane) => (activePane === pane ? '' : 'max-[62em]:hidden')
  const rightTabLabel = right.tabLabel ?? right.title
  const paneSegment = (pane: Pane, label: string) => ({
    label,
    nativeInputProps: { checked: activePane === pane, onChange: () => setActivePane(pane) },
  })

  const layout = (
    <div
      className={`flex flex-col bg-white ${isOverlay ? 'fixed inset-0' : 'h-full'}`}
      style={isOverlay ? { zIndex: OVERLAY_Z_INDEX } : undefined}
      {...(isOverlay && { 'role': 'dialog', 'aria-modal': true, 'aria-labelledby': ids.title })}
    >
      {isOverlay && (
        <div
          className="flex items-center gap-4 fr-py-3v fr-px-3w shrink-0 shadow-sm"
          style={{ borderBottom: `1px solid ${borderColor}` }}
        >
          <div className="flex-1 min-w-0">
            <h1 id={ids.title} ref={titleRef} tabIndex={-1} className="fr-h5 fr-m-0">
              {title}
            </h1>
            {subtitle && <p className="fr-text--xs fr-text-mention--grey fr-m-0">{subtitle}</p>}
          </div>
          <button
            type="button"
            className={fr.cx('fr-btn--close', 'fr-btn')}
            title="Fermer"
            onClick={onClose}
          >
            Fermer
          </button>
        </div>
      )}

      <div
        className="min-[62em]:hidden fr-px-2w fr-py-1w shrink-0"
        style={{ borderBottom: `1px solid ${borderColor}` }}
      >
        <SegmentedControl
          hideLegend
          legend="Panneau affiché"
          segments={[
            paneSegment('left', left.tabLabel ?? left.title),
            paneSegment('center', center.tabLabel),
            paneSegment(
              'right',
              right.badge === undefined ? rightTabLabel : `${rightTabLabel} (${right.badge})`
            ),
          ]}
        />
      </div>

      <div className="flex flex-1 min-h-0">
        <aside
          aria-labelledby={ids.left}
          className={`flex flex-col min-h-0 min-[62em]:w-88 shrink-0 max-[62em]:flex-1 ${paneClassName('left')}`}
          style={{ borderRight: `1px solid ${borderColor}` }}
        >
          <PanelHeader
            id={ids.left}
            title={left.title}
            subtitle={left.subtitle}
            headerContent={left.headerContent}
          />
          <PanelBody toolbar={left.toolbar} content={left.content} />
        </aside>

        <section
          aria-label={center.tabLabel}
          className={`relative flex flex-col flex-1 min-w-0 min-h-0 ${paneClassName('center')}`}
        >
          {center.content}
        </section>

        <aside
          aria-labelledby={ids.right}
          className={`flex flex-col min-h-0 min-[62em]:w-120 shrink-0 max-[62em]:flex-1 ${paneClassName('right')}`}
          style={{ borderLeft: `1px solid ${borderColor}` }}
        >
          <PanelHeader
            id={ids.right}
            title={right.title}
            subtitle={right.subtitle}
            headerContent={right.headerContent}
          />
          <PanelBody toolbar={right.toolbar} content={right.content} />
        </aside>
      </div>

      <footer
        className="flex flex-wrap items-center justify-between gap-2 fr-py-2w fr-px-3w shrink-0"
        style={{ borderTop: `1px solid ${borderColor}` }}
      >
        {footer}
      </footer>
    </div>
  )

  return isOverlay && typeof document !== 'undefined' ? createPortal(layout, document.body) : layout
}
