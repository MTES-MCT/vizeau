import React, { useState } from 'react'
import { fr } from '@codegouvfr/react-dsfr'

import './timeline-animation.css'
import Button from '@codegouvfr/react-dsfr/Button'

type TimelineItem = {
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
}

export default function Timeline(props: TimelineProps) {
  const { items, maxVisible } = props

  const [expanded, setExpanded] = useState(false)

  const shouldShowMore = maxVisible && items.length > maxVisible
  let visibleItems = items || []

  if (shouldShowMore && !expanded) {
    visibleItems = items.slice(0, maxVisible ?? 0)
  }

  const displayItems: DisplayItem[] = shouldShowMore
    ? [...visibleItems, { id: 'show-more', isControl: true, content: null }]
    : visibleItems

  return (
    <div className="relative">
      {displayItems.map((item: any, index) => {
        const isLast = index === displayItems.length - 1
        const isControl = item?.isControl
        const isNewlyVisible = expanded && maxVisible && index >= maxVisible

        return (
          <div
            key={`timeline-item-${index}`}
            className={`relative flex fr-mb-2v ${isNewlyVisible ? 'slide-in' : ''}`}
            style={isNewlyVisible ? { animationDelay: `${(index - maxVisible) * 0.1}s` } : {}}
          >
            {/* Point et ligne verticale */}
            <div className="flex flex-col items-center fr-mr-2v fr-m-1v">
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
            <div>
              {isControl ? (
                <Button onClick={() => setExpanded(!expanded)} priority="tertiary">
                  {expanded ? (
                    <span>Voir moins</span>
                  ) : (
                    <span>Voir plus ({items.length - maxVisible!})</span>
                  )}
                </Button>
              ) : (
                <div>{item.content}</div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
