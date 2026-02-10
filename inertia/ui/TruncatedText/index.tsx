import { Tooltip } from '@codegouvfr/react-dsfr/Tooltip'
import { ReactNode } from 'react'
import { truncateStr } from '~/functions/string'

export type TruncatedTextProps = {
  children: ReactNode
  maxLines?: number
  maxStringLength?: number
  className?: string
  tooltipTitle?: string
  hideTooltip?: boolean
}

export default function TruncatedText({
  children,
  maxLines = 1,
  maxStringLength,
  className,
  tooltipTitle,
  hideTooltip = false,
}: TruncatedTextProps) {
  // Troncature par nombre de caractères : affiche la tooltip si le texte est tronqué
  const textContent = typeof children === 'string' ? children : String(children)

  if (maxStringLength) {
    const truncatedContent = truncateStr(textContent, maxStringLength)
    const isTruncated = truncatedContent !== textContent

    if (isTruncated || (tooltipTitle && !hideTooltip)) {
      return (
        <Tooltip title={textContent}>
          <span className={className}>{truncatedContent}</span>
        </Tooltip>
      )
    }
    return <span className={className}>{truncatedContent}</span>
  }

  // Troncature par lignes : affiche la tooltip seulement si tooltipTitle est fourni
  const style: React.CSSProperties = {
    display: '-webkit-box',
    WebkitLineClamp: maxLines,
    WebkitBoxOrient: 'vertical',
  }

  if ((tooltipTitle || textContent.length > 90) && !hideTooltip) {
    return (
      <Tooltip title={tooltipTitle || textContent}>
        <div
          style={style}
          className={`overflow-hidden text-ellipsis break-words ${className || ''}`}
        >
          {textContent}
        </div>
      </Tooltip>
    )
  }

  return (
    <div style={style} className={`overflow-hidden text-ellipsis break-words ${className || ''}`}>
      {textContent}
    </div>
  )
}
