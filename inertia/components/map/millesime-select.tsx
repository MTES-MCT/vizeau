import { Select } from '@codegouvfr/react-dsfr/Select'
import { usePage } from '@inertiajs/react'

type MillesimeSelectProps = {
  value: string
  onChange: (millesime: string) => void
  className?: string
}

export default function MillesimeSelect({ value, onChange, className }: MillesimeSelectProps) {
  const { rpgMillesimes } = usePage().props

  return (
    <Select
      label=""
      className={`fr-mb-0 w-40 ${className ?? ''}`}
      nativeSelectProps={{
        'value': value,
        'aria-label': 'Millésime RPG',
        'onChange': (e) => onChange(e.target.value),
      }}
    >
      {rpgMillesimes.map((millesime) => (
        <option key={millesime} value={millesime}>
          RPG {millesime}
        </option>
      ))}
    </Select>
  )
}
