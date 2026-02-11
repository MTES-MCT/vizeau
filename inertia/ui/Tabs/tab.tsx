import { fr } from '@codegouvfr/react-dsfr'

export type TabProps = {
  label: string
  isActive?: boolean
  isDisabled?: boolean
  onTabChange: () => void
}

export default function Tab({ label, isActive, isDisabled, onTabChange }: TabProps) {
  return (
    <button
      role="tab"
      aria-selected={isActive}
      onClick={() => {
        if (!isDisabled) {
          onTabChange()
        }
      }}
      disabled={isDisabled}
      className={`w-fit cursor-pointer ${isDisabled ? 'cursor-not-allowed' : 'cursor-pointer'} fr-p-2v`}
      style={{
        fontWeight: isActive ? 'bold' : 'normal',
        borderBottomColor: isActive
          ? fr.colors.decisions.border.active.blueFrance.default
          : 'transparent',
        borderBottomWidth: '4px',
        borderBottomStyle: 'solid',
        color: isActive
          ? fr.colors.decisions.text.label.blueFrance.default
          : isDisabled
            ? fr.colors.decisions.text.disabled.grey.default
            : fr.colors.decisions.text.default.grey.default,
      }}
    >
      {label}
    </button>
  )
}
