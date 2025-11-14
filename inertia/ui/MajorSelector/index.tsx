import { fr } from '@codegouvfr/react-dsfr'
import './index.css'

export type MajorSelectorProps = {
  value: string
  label?: string
  icon?: string
  isSelected?: boolean
  getValue?: (value: string) => void
}

export default function MajorSelector({
  value,
  label,
  icon,
  isSelected,
  getValue,
}: MajorSelectorProps) {
  return (
    <button
      type="button"
      onClick={() => getValue?.(value)}
      className="flex-col fr-p-4v w-full hover-effect"
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '20px',
        borderRadius: '5px',
        border: `3px solid ${isSelected ? fr.colors.decisions.border.active.blueFrance.default : fr.colors.decisions.border.default.grey.default}`,
      }}
    >
      {icon && (
        <div
          className="fr-p-5v"
          style={{
            borderRadius: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: fr.colors.decisions.background.alt.blueFrance.default,
          }}
        >
          <span
            className={`fr-icon-${icon}`}
            style={{ color: fr.colors.decisions.text.actionHigh.blueFrance.default }}
            aria-hidden="true"
          ></span>
        </div>
      )}
      {label && <span className="fr-text--bold">{label}</span>}
    </button>
  )
}
