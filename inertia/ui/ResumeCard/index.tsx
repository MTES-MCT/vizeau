import { fr } from '@codegouvfr/react-dsfr'
import Tooltip from '@codegouvfr/react-dsfr/Tooltip'

export type ResumeCardProps = {
  title: string
  size?: 'sm' | 'md'
  value: string | number
  label?: string
  priority?: 'primary' | 'secondary'
  color?: string
  iconId?: string
  hint?: string | React.ReactNode
}
export default function ResumeCard({
  title,
  size = 'md',
  value,
  label,
  hint,
  priority = 'primary',
  color,
  iconId,
}: ResumeCardProps) {
  return (
    <div
      className={`${size === 'sm' ? 'fr-p-2v gap-3' : 'fr-p-4v gap-4'} w-full h-full flex flex-col`}
      style={{
        border: `1px solid ${fr.colors.decisions.border.default.grey.default}`,
        backgroundColor:
          priority === 'primary'
            ? fr.colors.decisions.background.default.grey.default
            : fr.colors.decisions.background.alt.blueFrance.default,
      }}
    >
      <div className="flex gap-1 items-center">
        {iconId && (
          <span
            className={`${iconId} ${size === 'sm' ? 'fr-icon--sm' : 'fr-icon--md'}`}
            style={{ color: color }}
          />
        )}
        <span className={`${size === 'sm' ? 'text-lg' : 'text-xl'} font-bold fr-m-0`}>{title}</span>
      </div>

      <div>
        <span
          className={`${size === 'sm' ? 'text-xl' : 'text-3xl'} font-bold`}
          style={{ color: color }}
        >
          {value}
        </span>

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
    </div>
  )
}
