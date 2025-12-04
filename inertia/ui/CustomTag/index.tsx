import Badge from '@codegouvfr/react-dsfr/Badge'
import { fr } from '@codegouvfr/react-dsfr'

export type CustomTagProps = {
  label?: string
  iconId?: string
  size?: 'sm' | 'xs'
}

function stringToColor(str: string) {
  const hash = Array.from(str).reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0)
  // Génère une teinte basée sur le hash
  const hue = Math.abs(hash) % 360
  // Saturation et luminosité élevées pour des couleurs claires et vibrantes
  const saturation = 80
  const lightness = 85
  return `hsl(${hue}, ${saturation}%, ${lightness}%)`
}

function getContrastColor(hslColor: string) {
  // hsl(210, 80%, 85%) → extrait la luminosité
  const match = hslColor.match(/hsl\(\d+,\s*\d+%,\s*(\d+)%\)/)
  const lightness = match ? parseInt(match[1], 10) : 50
  // Si la luminosité est élevée, texte foncé, sinon texte clair
  return lightness > 70 ? fr.colors.decisions.text.default.grey.default : fr.colors.decisions.text.inverted.grey.default
}

export default function CustomTag({ label, iconId, size = 'sm' }: CustomTagProps) {
  const backgroundColor = stringToColor(label || '')
  const textColor = getContrastColor(backgroundColor)

  return (
    <Badge
      className={`height-fit w-fit fr-p-2 flex gap-2 fr-text--${size}`}
      style={{ backgroundColor, color: textColor }}
    >
      {iconId && <span className={`${iconId} fr-icon--sm`}></span>}
      {label}
    </Badge>
  )
}
