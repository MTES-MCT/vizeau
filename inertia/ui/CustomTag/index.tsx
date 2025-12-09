import Badge from '@codegouvfr/react-dsfr/Badge'

export type CustomTagProps = {
  label?: string
  iconId?: string
  size?: 'md' | 'sm'
  color?: string
}

function stringToColor(str: string) {
  const hash = Array.from(str).reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0)
  // Génère une teinte basée sur le hash
  const hue = Math.abs(hash) % 360
  return `hsl(${hue}, 80%, 85%)`
}

function getContrastColor(backgroundColor: string): string {
  // Convertit la couleur en RGB pour calculer la luminosité
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 1
  const ctx = canvas.getContext('2d')
  if (!ctx) return '#000000'

  ctx.fillStyle = backgroundColor
  ctx.fillRect(0, 0, 1, 1)
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data

  // Calcule la luminosité relative (formule WCAG)
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255

  return luminance > 0.5 ? '#000000' : '#ffffff'
}

export default function CustomTag({ label, iconId, size, color }: CustomTagProps) {
  const backgroundColor = color || stringToColor(label || '')
  const textColor = color ? getContrastColor(color) : '#3a3a3a'

  return (
    <Badge
      className={`height-fit w-fit flex gap-2 fr-mb-0`}
      style={{ backgroundColor, color: textColor }}
      small={size === 'sm'}
    >
      {iconId && <span className={`${iconId} fr-icon--sm`}></span>}
      {label}
    </Badge>
  )
}
