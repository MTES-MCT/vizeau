import { fr } from '@codegouvfr/react-dsfr'

export type DividerProps = {
  label?: string
}
export default function Divider({ label }: DividerProps) {
  if (label) {
    return (
      <div className="flex items-center">
        <span
          className="w-full"
          style={{ borderTop: `1px solid ${fr.colors.decisions.border.default.grey.default}` }}
        />
        <span className="w-auto whitespace-nowrap fr-mx-2v">{label}</span>
        <span
          className="w-full"
          style={{ borderTop: `1px solid ${fr.colors.decisions.border.default.grey.default}` }}
        />
      </div>
    )
  } else {
    return (
      <div
        className="w-full"
        style={{ borderTop: `1px solid ${fr.colors.decisions.border.default.grey.default}` }}
      />
    )
  }
}
