import { fr } from '@codegouvfr/react-dsfr'

export type ProgressBarProps = {
  value: number
  total: number
  unit?: string
  progressColor?: string
  size?: 'md' | 'sm'
}

export default function ProgressBar({
  value,
  total,
  progressColor,
  unit,
  size = 'md',
}: ProgressBarProps) {
  const percent = total > 0 ? Math.min(100, Math.round((value / total) * 100)) : 0
  const color = progressColor || fr.colors.decisions.background.actionHigh.blueFrance.default

  return (
    <div className="w-full flex gap-3 items-center">
      <div
        className="flex-1 rounded-md overflow-hidden"
        style={{
          height: size === 'md' ? 10 : 5,
          background: `${fr.colors.decisions.background.default.grey.hover}`,
          borderRadius: 5,
        }}
      >
        <div
          className="h-full"
          style={{
            width: `${percent}%`,
            height: '100%',
            background: color,
            transition: 'width 0.3s',
            borderRadius: 5,
          }}
        />
      </div>
      {unit ? (
        <p className={`flex-2 fr-m-0 fr-text--${size}`}>
          {value || 0}/{total || 0} {unit}
        </p>
      ) : (
        <p className={`flex-2 fr-m-0 fr-text--${size}`}>{percent || 0}%</p>
      )}
    </div>
  )
}
