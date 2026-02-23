import { fr } from '@codegouvfr/react-dsfr'
import React from 'react'

export type LabelInfoProps = {
  icon?: string | null
  label?: string
  info?: string | React.ReactNode
  size?: 'sm' | 'md'
}
export default function LabelInfo({ icon, label, info, size = 'md' }: LabelInfoProps) {
  const isStringInfo = typeof info === 'string'
  const labelText = info && label ? label + ' : ' : label

  return (
    <div className="flex items-start">
      {icon && (
        <span
          className={`${icon} fr-icon--${size} fr-mr-1v flex-shrink-0`}
          style={{ color: fr.colors.decisions.text.actionHigh.blueFrance.default }}
          aria-hidden="true"
        />
      )}
      <div className="flex-1 min-w-0">
        {isStringInfo && info ? (
          <p className={`fr-text--${size} fr-mb-0`}>
            <span
              style={{
                fontWeight: 800,
              }}
            >
              {labelText}
            </span>
            <span
              style={{
                color: fr.colors.decisions.text.mention.grey.default,
              }}
            >
              {info}
            </span>
          </p>
        ) : (
          <div className="flex flex-wrap gap-1 items-start">
            <span
              className={`fr-text--${size} fr-mb-0 whitespace-nowrap`}
              style={{
                fontWeight: info ? 800 : 500,
              }}
            >
              {labelText}
            </span>
            {info && (
              <div
                className="fr-mb-0 fr-ml-1v"
                style={{
                  color: fr.colors.decisions.text.mention.grey.default,
                }}
              >
                {info}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
