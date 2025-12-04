import Badge from '@codegouvfr/react-dsfr/Badge'

export type CustomTagProps = {
  label?: string
  iconId?: string
  size?: 'sm' | 'xs'
}

function stringToColor(str: string) {
  const hash = Array.from(str).reduce((acc, char) => char.charCodeAt(0) + ((acc << 5) - acc), 0)
  // Génère une teinte basée sur le hash
  const hue = Math.abs(hash) % 360
  return `hsl(${hue}, 80%, 85%)`
}

export default function CustomTag({ label, iconId, size = 'sm' }: CustomTagProps) {
  const backgroundColor = stringToColor(label || '')

  return (
    <Badge
      className={`height-fit w-fit fr-p-2 flex gap-2 fr-text--${size}`}
      style={{ backgroundColor, color: "#3a3a3a" }}
    >
      {iconId && <span className={`${iconId} fr-icon--sm`}></span>}
      {label}
    </Badge>
  )
}
