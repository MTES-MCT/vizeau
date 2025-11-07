import { fr } from '@codegouvfr/react-dsfr'

export type LabelInfoProps = {
  icon?: string
  label: string
  info: string
  size?: 'sm' | 'md'
}
export default function LabelInfo({ icon, label, info, size = 'md' }: LabelInfoProps) {
  return (
    <div className="flex">
      <div className="flex items-start">
        {icon && (
          <span
            className={`fr-icon-${icon} fr-icon--${size} fr-mr-1v`}
            style={{ color: fr.colors.decisions.text.actionHigh.blueFrance.default }}
            aria-hidden="true"
          />
        )}
        <span
          className={`fr-text--${size} fr-mb-0 w-fit flex-shrink-0 whitespace-nowrap`}
          style={{
            fontWeight: 800,
          }}
        >
          {label} :
        </span>
      </div>

      <p
        className={`fr-text--${size} fr-ml-1w flex-1 break-words`}
        style={{
          color: fr.colors.decisions.text.mention.grey.default,
        }}
      >
        {info}
      </p>
    </div>
  )
}
