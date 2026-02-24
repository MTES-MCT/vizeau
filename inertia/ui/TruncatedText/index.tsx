import { Tooltip } from '@codegouvfr/react-dsfr/Tooltip'
import { truncateStr } from '~/functions/string'

export type TruncatedTextProps = {
  children: React.ReactNode
  maxLines?: number
  maxStringLength?: number
  className?: string
  tooltipTitle?: string
  hideTooltip?: boolean
  as?: React.ElementType
}

export default function TruncatedText({
  children,
  maxLines = 1,
  maxStringLength,
  className,
  tooltipTitle,
  hideTooltip = false,
  as,
}: TruncatedTextProps) {
  // children est ReactNode, on convertit en string pour la troncature
  const textContent =
    children == null ? '' : typeof children === 'string' || typeof children === 'number' ? String(children) : ''

  // Détermine l'élément à utiliser selon le contexte
  const Component = as || (maxStringLength ? 'span' : 'div')

  if (maxStringLength) {
    const truncatedContent = truncateStr(textContent, maxStringLength)
    const isTruncated = truncatedContent !== textContent

    if ((isTruncated || tooltipTitle) && !hideTooltip) {
      return (
        <Tooltip title={tooltipTitle || textContent}>
          <Component className={className}>{truncatedContent}</Component>
        </Tooltip>
      )
    }
    return <Component className={className}>{truncatedContent}</Component>
  }

  // Troncature par lignes : affiche la tooltip si tooltipTitle est fourni ou si le texte dépasse 90 caractères
  const style: React.CSSProperties = {
    display: '-webkit-box',
    WebkitLineClamp: maxLines,
    WebkitBoxOrient: 'vertical',
  }

  if ((tooltipTitle || textContent.length > 90) && !hideTooltip) {
    return (
      <Tooltip title={tooltipTitle || textContent}>
        <Component
          style={style}
          className={`overflow-hidden text-ellipsis break-words ${className || ''}`}
        >
          {textContent}
        </Component>
      </Tooltip>
    )
  }

  return (
    <Component
      style={style}
      className={`overflow-hidden text-ellipsis break-words ${className || ''}`}
    >
      {textContent}
    </Component>
  )
}
