import { fr } from '@codegouvfr/react-dsfr'
import Tooltip from '@codegouvfr/react-dsfr/Tooltip'
import Loader from '~/ui/Loader'

import './resume-card.css'

export type ResumeCardProps = {
  title: string
  size?: 'sm' | 'md'
  value: string | number | null
  label?: string
  priority?: 'primary' | 'secondary'
  color?: string
  iconId?: string
  hint?: string | React.ReactNode
  loading?: boolean
  onClick?: () => void
}
export default function ResumeCard({
  title,
  size = 'md',
  value,
  label,
  hint,
  priority = 'primary',
  color = fr.colors.decisions.text.title.blueFrance.default,
  iconId,
  loading = false,
  onClick,
}: ResumeCardProps) {
  const Wrapper = onClick ? 'button' : 'div'

  return (
    <Wrapper
      className={`${size === 'sm' ? 'fr-p-2v gap-3' : 'fr-p-4v gap-4'} w-full h-full flex flex-col ${onClick ? 'button-card' : ''}`}
      style={{
        border: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
        backgroundColor:
          priority === 'primary'
            ? fr.colors.decisions.background.default.grey.default
            : fr.colors.decisions.background.alt.blueFrance.default,
      }}
      onClick={onClick}
      type={onClick ? 'button' : undefined}
    >
      <div className="flex gap-1 items-start">
        {iconId && (
          <span
            aria-hidden="true"
            className={`${iconId} ${size === 'sm' ? 'fr-icon--sm' : 'fr-icon--md'}`}
            style={{ color: color }}
          />
        )}
        <span className={`${size === 'sm' ? 'text-lg' : 'text-xl'} font-bold fr-m-0`}>{title}</span>
      </div>

      <div>
        {loading ? (
          <div className="fr-py-1v">
            <Loader type="dots" size="sm" />
          </div>
        ) : (
          <span
            className={`${size === 'sm' ? 'text-xl' : 'text-3xl'} font-bold`}
            style={{ color: color }}
          >
            {value}
          </span>
        )}

        {label && (
          <div className="flex gap-1 items-center">
            <span
              className={`${size === 'sm' ? 'text-md' : 'text-lg'}`}
              style={{ color: fr.colors.decisions.text.disabled.grey.default }}
            >
              {label}
            </span>
            {hint && <Tooltip title={hint} />}
          </div>
        )}
      </div>
    </Wrapper>
  )
}
