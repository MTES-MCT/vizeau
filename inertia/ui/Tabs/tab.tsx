import { fr } from '@codegouvfr/react-dsfr'

export type TabProps = {
  label: string
  isActive?: boolean
  onTabChange: () => void
}

export default function Tab({ label, isActive, onTabChange }: TabProps) {
  return (
    <div
      onClick={onTabChange}
      className={`w-fit cursor-pointer fr-p-2v ${isActive ? 'border-b-2 border-blue-500 font-bold' : 'text-gray-500'}`}
      style={{
        borderBottomColor: isActive
          ? fr.colors.decisions.border.active.blueFrance.default
          : 'transparent',
        borderBottomWidth: '4px',
        color: isActive
          ? fr.colors.decisions.text.label.blueFrance.default
          : fr.colors.decisions.text.default.grey.default,
      }}
    >
      {label}
    </div>
  )
}
