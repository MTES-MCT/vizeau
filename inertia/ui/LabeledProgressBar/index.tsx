import ProgressBar, { ProgressBarProps } from '../ProgressBar'

export type LabeledProgressBarProps = {
  size?: ProgressBarProps['size']
  iconId?: string
  src?: string
  label: string
  progressBarValues: {
    value: ProgressBarProps['value']
    total: ProgressBarProps['total']
    unit: ProgressBarProps['unit']
    progressColor?: ProgressBarProps['progressColor']
  }
}

export default function LabeledProgressBar({
  size,
  iconId,
  src,
  label,
  progressBarValues,
}: LabeledProgressBarProps) {
  return (
    <div className={`flex ${size === 'lg' ? 'flex-col' : ''} gap-1 flex-wrap`}>
      <div className="flex flex-1 items-center gap-1 h-fit">
        {iconId && <span className={`${iconId} fr-icon--${size}`}></span>}
        {src && <img src={src} alt="" className={`${size === 'sm' ? 'h-3 w-3' : 'h-4 w-4'}`} />}
        <span className={`fr-text--${size} fr-mb-0 font-bold`}>{label}</span>
      </div>

      <ProgressBar {...progressBarValues} size={size} />
    </div>
  )
}
