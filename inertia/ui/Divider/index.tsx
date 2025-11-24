import { fr } from '@codegouvfr/react-dsfr'

const borderColor = fr.colors.decisions.border.default.grey.default

export type DividerProps = {
  label?: string
}
export default function Divider({ label }: DividerProps) {
  if (label) {
    return (
      <div className="flex items-center" role="separator" aria-label={label}>
        <span className="w-full" style={{ borderTop: `1px solid ${borderColor}` }} />
        <span className="w-auto whitespace-nowrap fr-mx-2v">{label}</span>
        <span className="w-full" style={{ borderTop: `1px solid ${borderColor}` }} />
      </div>
    )
  }

  return (
    <div className="w-full" style={{ borderTop: `1px solid ${borderColor}` }} role="separator" />
  )
}
