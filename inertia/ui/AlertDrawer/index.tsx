import React, { useState } from 'react'
import { fr } from '@codegouvfr/react-dsfr'
import { Button } from '@codegouvfr/react-dsfr/Button'
import './custom.css'

type Severity = 'info' | 'warning' | 'error' | 'success'

export type AlertDrawerProps = {
  severity?: Severity
  title: string
  customIconId?: string
  children: React.ReactNode
}

const SEVERITY_CONFIG: Record<
  Severity,
  {
    icon: string
    backgroundColor: string
    textColor: string
  }
> = {
  info: {
    icon: 'fr-icon-info-line',
    backgroundColor: fr.colors.decisions.background.contrast.info.default,
    textColor: fr.colors.decisions.text.title.blueFrance.default,
  },
  warning: {
    icon: 'fr-icon-warning-line',
    backgroundColor: fr.colors.decisions.background.contrast.warning.default,
    textColor: fr.colors.decisions.text.default.warning.default,
  },
  error: {
    icon: 'fr-icon-error-line',
    backgroundColor: fr.colors.decisions.background.contrast.error.default,
    textColor: fr.colors.decisions.text.default.error.default,
  },
  success: {
    icon: 'fr-icon-success-line',
    backgroundColor: fr.colors.decisions.background.contrast.success.default,
    textColor: fr.colors.decisions.text.default.success.default,
  },
}

export default function AlertDrawer({
  severity = 'info',
  title,
  customIconId,
  children,
}: AlertDrawerProps) {
  const [isOpen, setIsOpen] = useState(false)
  const config = SEVERITY_CONFIG[severity]

  return (
    <div
      style={{
        border: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
        backgroundColor: config.backgroundColor,
      }}
    >
      <Button
        priority="tertiary no outline"
        onClick={() => setIsOpen(!isOpen)}
        style={{ width: '100%' }}
        size="large"
        className="custom-button"
      >
        <div
          className="flex gap-2 items-center justify-between"
          style={{ width: '100%', color: config.textColor }}
        >
          <div className="w-full flex items-center gap-2">
            <span className={customIconId || config.icon} />
            <p className="fr-mb-0 fr-text--lg font-bold">{title}</p>
          </div>

          <span className={isOpen ? 'fr-icon-arrow-up-s-line' : 'fr-icon-arrow-down-s-line'} />
        </div>
      </Button>
      <div className={`fr-px-3w drawer-content-wrapper ${isOpen ? 'open' : ''}`}>
        <div className="drawer-content-inner">
          <div className={`fr-py-1w ${isOpen ? 'slide-bottom' : 'slide-top'}`}>{children}</div>
        </div>
      </div>
    </div>
  )
}
