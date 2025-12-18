import ProgressBar, { ProgressBarProps } from '../ProgressBar'

export type LabeledProgressBarProps = {
  size?: ProgressBarProps['size']
  iconId?: string
  src?: string
  label: string
  progressBarValues: {
    value: ProgressBarProps['value']
    total: ProgressBarProps['total']
    unit?: ProgressBarProps['unit']
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
    <div className="fr-grid-row items-center">
      <div className="fr-col-12 fr-col-lg-7 flex items-center gap-1 h-fit ">
        {iconId && <span className={`${iconId} fr-icon--${size === 'sm' ? 'sm' : 'md'}`}></span>}
        {src && <img src={src} alt="" className={`${size === 'sm' ? 'h-3 w-fit' : 'h-5 w-fit'}`} />}
        <span className={`fr-text--${size} fr-mb-0 font-medium`}>{label}</span>
      </div>

      <div className="fr-col-12 fr-col-lg-5">
        <ProgressBar {...progressBarValues} size={size} />
      </div>
    </div>
  )
}
