import { fr } from '@codegouvfr/react-dsfr'

export type StackedProgressBarSegment = {
  label: string
  value: number
  color: string
}

export type StackedProgressBarProps = {
  segments: StackedProgressBarSegment[]
  /** Somme des segments par défaut ; un total supérieur laisse une part vide. */
  total?: number
  size?: 'md' | 'sm' | 'lg'
}

const formatPercent = (percent: number) =>
  percent.toLocaleString('fr-FR', { maximumFractionDigits: 1 })

export default function StackedProgressBar({
  segments,
  total,
  size = 'md',
}: StackedProgressBarProps) {
  const sum = segments.reduce((acc, segment) => acc + segment.value, 0)
  const reference = Math.max(total ?? sum, sum)
  const visibleSegments = segments
    .filter((segment) => segment.value > 0)
    .map((segment) => ({
      ...segment,
      percent: reference > 0 ? (segment.value / reference) * 100 : 0,
    }))

  return (
    <div
      role="img"
      aria-label={visibleSegments
        .map((segment) => `${segment.label} : ${formatPercent(segment.percent)} %`)
        .join(', ')}
      className="flex w-full overflow-hidden"
      style={{
        height: size === 'sm' ? 5 : size === 'lg' ? 8 : 7,
        background: fr.colors.decisions.background.default.grey.hover,
        borderRadius: 5,
      }}
    >
      {visibleSegments.map((segment) => (
        <div
          key={segment.label}
          title={`${segment.label} : ${formatPercent(segment.percent)} %`}
          className="h-full"
          style={{
            width: `${segment.percent}%`,
            background: segment.color,
            transition: 'width 0.3s',
          }}
        />
      ))}
    </div>
  )
}
