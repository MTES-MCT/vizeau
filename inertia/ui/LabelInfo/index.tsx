import { fr } from '@codegouvfr/react-dsfr'
import React from 'react'

export type LabelInfoProps = {
  icon?: string | null
  label: string
  info?: string | React.ReactNode
  size?: 'sm' | 'md'
}
export default function LabelInfo({ icon, label, info, size = 'md' }: LabelInfoProps) {
  return (
    <div className="flex">
      <div className="flex items-start">
        {icon && (
          <span
            className={`${icon} fr-icon--${size} fr-mr-1v`}
            style={{ color: fr.colors.decisions.text.actionHigh.blueFrance.default }}
            aria-hidden="true"
          />
        )}
        <span
          className={`fr-text--${size} fr-mb-0 w-fit flex-shrink-0 whitespace-nowrap`}
          style={{
            fontWeight: info ? 800 : 500,
          }}
        >
          {info ? label + ' :' : label}
        </span>
      </div>

      {info && (
        <div
          className={`fr-text--${size} fr-ml-1w fr-mb-0 flex-1 break-words`}
          style={{
            color: fr.colors.decisions.text.mention.grey.default,
          }}
        >
          {info}
        </div>
      )}
    </div>
  )
}
