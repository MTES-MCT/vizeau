import { fr } from '@codegouvfr/react-dsfr'
import Button from '@codegouvfr/react-dsfr/Button'

import './empty-placeholder.css'

type IllustrationProps = {
  pictogram?: React.ElementType
  illustrativeIcon?: string
  illustrationSrc?: string
  isLarge?: boolean
}

const Illustration = ({
  isLarge,
  pictogram,
  illustrativeIcon,
  illustrationSrc,
}: IllustrationProps) => {
  const customSize = isLarge ? 320 : 110

  if (pictogram) {
    const PictogramComponent = pictogram
    return <PictogramComponent height={customSize} width={customSize} />
  }
  if (illustrativeIcon) {
    return (
      <span
        className={`${illustrativeIcon} custom-size${isLarge ? '-large' : ''}`}
        aria-hidden="true"
      ></span>
    )
  }

  if (illustrationSrc) {
    return <img src={illustrationSrc} alt="" height={customSize} width={customSize} />
  }
  return null
}

export type EmptyPlaceholderProps = {
  priority?: 'primary' | 'secondary'
  size?: 'md' | 'lg'
  label: string
  illustrativeIcon?: string
  illustrationSrc?: string
  pictogram?: React.ElementType
  hint?: string
  buttonLabel?: string
  actionAriaLabel?: string
  buttonIcon?: string
  handleClick?: () => void
}
export default function EmptyPlaceholder({
  priority = 'primary',
  size = 'md',
  label,
  pictogram,
  illustrativeIcon,
  illustrationSrc,
  hint,
  buttonLabel,
  actionAriaLabel,
  buttonIcon,
  handleClick,
}: EmptyPlaceholderProps) {
  return (
    <div
      className="flex flex-col items-center fr-p-4v"
      style={{
        backgroundColor:
          priority === 'secondary'
            ? 'transparent'
            : fr.colors.decisions.background.alt.blueFrance.default,
      }}
    >
      <div>
        <div className="flex flex-col items-center">
          <Illustration
            pictogram={pictogram}
            illustrativeIcon={illustrativeIcon}
            illustrationSrc={illustrationSrc}
            isLarge={size === 'lg'}
          />
          {label && (
            <span
              className={`fr-mt-5v fr-mb-2v fr-text--${size === 'md' ? 'md' : 'xl'} text-center`}
              style={{ fontWeight: 300 }}
            >
              {label}
            </span>
          )}
        </div>

        {hint && (
          <p className={`fr-text--${size === 'md' ? 'sm' : 'md'} text-center font-bold`}>{hint}</p>
        )}
      </div>

      {buttonLabel && (
        <Button
          size={size === 'md' ? 'medium' : 'large'}
          iconId={buttonIcon as any}
          onClick={handleClick}
          aria-label={actionAriaLabel || buttonLabel}
          className="fr-mt-2v"
        >
          {buttonLabel}
        </Button>
      )}
    </div>
  )
}
