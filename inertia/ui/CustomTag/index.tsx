import Badge from '@codegouvfr/react-dsfr/Badge'
import tinycolor from 'tinycolor2'

export type CustomTagProps = {
  label?: string
  iconId?: string
  iconPath?: string
  size?: 'md' | 'sm'
  color?: string
}

function stringToColor(str: string) {
  const hash = Array.from(str).reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0)
  // Génère une teinte basée sur le hash
  const hue = Math.abs(hash) % 360
  return `hsl(${hue}, 80%, 85%)`
}

export default function CustomTag({ label, iconId, iconPath, size, color }: CustomTagProps) {
  const backgroundColor = color || stringToColor(label || '')
  const textColor = color ? (tinycolor(color).isLight() ? '#000000' : '#ffffff') : '#3a3a3a'

  return (
    <Badge
      className={`height-fit w-fit flex gap-1 fr-mb-0 items-center`}
      style={{ backgroundColor, color: textColor }}
      small={size === 'sm'}
    >
      {iconId && <span className={`${iconId} fr-icon--sm flex items-center`}></span>}
      {iconPath && <img src={iconPath} alt="" aria-hidden="true" height={16} width={16} style={{ padding: '2px' }} />}
      {label}
    </Badge>
  )
}
