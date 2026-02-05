import React, { useState } from 'react'
import { fr } from '@codegouvfr/react-dsfr'

import './timeline-animation.css'
import Button from '@codegouvfr/react-dsfr/Button'

export type TimelineItem = {
  content: React.ReactNode
  dotColor?: string
}

type ControlItem = {
  id: string
  isControl: true
  content: null
}

type DisplayItem = TimelineItem | ControlItem

export interface TimelineProps {
  items: TimelineItem[]
  maxVisible?: number
  // Optional callback when "Voir plus" is clicked. If not provided, the component will handle expansion internally.
  onShowMore?: () => Promise<void>
  // In external mode, indicates if there are more items to load
  hasMore?: boolean
}

export default function Timeline(props: TimelineProps) {
  const { items, maxVisible, onShowMore, hasMore } = props

  // State to track if the timeline is expanded, used only if onShowMore is not provided
  const [expanded, setExpanded] = useState(false)
  // Loading state for external mode
  const [isLoading, setIsLoading] = useState(false)
  const externalMode = typeof onShowMore === 'function'

  let visibleItems: TimelineItem[] = items

  if (!externalMode) {
    // Internal mode: only slice when needed and not expanded
    const shouldLimit = typeof maxVisible === 'number' && items.length > maxVisible
    visibleItems = shouldLimit && !expanded ? items.slice(0, maxVisible!) : items
  }

  const showMoreButtonNeeded =
    (externalMode && hasMore !== false) ||
    (typeof maxVisible === 'number' && items.length > maxVisible)

  const displayItems: DisplayItem[] = showMoreButtonNeeded
    ? [...visibleItems, { id: 'show-more', isControl: true, content: null }]
    : visibleItems

  const handleButtonClick = () => {
    if (externalMode) {
      setIsLoading(true)
      onShowMore!().finally(() => setIsLoading(false))
    } else {
      setExpanded((s) => !s)
    }
  }

  const getButtonLabel = () => {
    if (isLoading) {
      return 'Chargement...'
    }

    if (externalMode) {
      return 'Voir plus'
    }

    return expanded ? 'Voir moins' : `Voir plus (${items.length - (maxVisible ?? 0)})`
  }

  return (
    <div className="relative">
      {displayItems.map((item: any, index) => {
        const isLast = index === displayItems.length - 1
        const isControl = item?.isControl
        const isNewlyVisible =
          !externalMode && expanded && typeof maxVisible === 'number' && index >= maxVisible

        return (
          <div
            key={`timeline-item-${index}`}
            className={`relative flex fr-mb-2v ${isNewlyVisible ? 'slide-in' : ''}`}
            style={isNewlyVisible ? { animationDelay: `${(index - maxVisible) * 0.1}s` } : {}}
          >
            {/* Point et ligne verticale */}
            <div className="flex flex-col items-center fr-mr-5v fr-m-1v">
              <div
                style={{
                  backgroundColor: item?.dotColor
                    ? item?.dotColor
                    : isControl
                      ? ''
                      : fr.colors.decisions.border.plain.info.default,
                  border: isControl
                    ? `3px solid ${fr.colors.decisions.border.default.grey.default}`
                    : 'none',
                  borderRadius: '50%',
                  width: '12px',
                  height: '12px',
                  minWidth: '12px',
                  minHeight: '12px',
                  marginBottom: '4px',
                }}
              />

              {!isLast && (
                <div
                  style={{
                    backgroundColor: fr.colors.decisions.background.contrastOverlap.grey.active,
                    width: '2px',
                    height: '100%',
                    borderRadius: '2px',
                  }}
                />
              )}
            </div>

            {/* Contenu */}
            {isControl ? (
              <Button onClick={handleButtonClick} priority="tertiary">
                <span>{getButtonLabel()}</span>
              </Button>
            ) : (
              <div className="fr-mb-5v" style={{ width: '100%', minWidth: 0, maxWidth: '100%' }}>
                {item.content}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
