import { fr } from '@codegouvfr/react-dsfr'

export type HomeSectionProps = {
  background?: 'primary' | 'secondary' | 'default'
  title?: string
  subtitle?: string
  illustration?: string
  illustrationAlt?: string
  illustrationSide?: 'left' | 'right'
  children?: React.ReactNode
}

const SectionTitle = ({
  title,
  subtitle,
  isSided,
}: {
  title?: string
  subtitle?: string
  isSided?: boolean
}) => (
  <div className={`fr-mb-8w flex flex-col ${isSided ? 'items-start' : 'items-center'}`}>
    {title && (
      <h2 className="fr-mb-1w" style={{ color: fr.colors.decisions.text.title.blueFrance.default }}>
        {title}
      </h2>
    )}
    {subtitle && (
      <span
        className="fr-text--lg fr-m-0"
        style={{ color: fr.colors.decisions.text.mention.grey.default }}
      >
        {subtitle}
      </span>
    )}
  </div>
)

export default function HomeSection({
  background,
  title,
  subtitle,
  illustration,
  illustrationAlt = '',
  illustrationSide = 'left',
  children,
}: HomeSectionProps) {
  let backgroundColor: string

  switch (background) {
    case 'primary':
      backgroundColor = fr.colors.decisions.background.alt.blueFrance.default
      break
    case 'secondary':
      backgroundColor = fr.colors.decisions.background.alt.grey.default
      break
    default:
      backgroundColor = fr.colors.decisions.background.default.grey.default
  }

  return (
    <div
      className="w-full fr-px-4w fr-py-8w flex items-center justify-center"
      style={{ backgroundColor }}
    >
      <div className="fr-container">
        {illustration ? (
          <div
            className={`flex flex-wrap items-start justify-center gap-8 ${illustrationSide === 'right' ? 'md:flex-row-reverse' : ''}`}
          >
            <div className="w-full max-w-[470px]">
              <img
                className="block w-full h-auto object-contain"
                src={illustration}
                alt={illustrationAlt}
              />
            </div>
            <div className="flex-2 min-w-[320px] flex-[1_1_360px] h-full flex flex-col justify-start items-start gap-2">
              <SectionTitle title={title} subtitle={subtitle} isSided={true} />

              {children}
            </div>
          </div>
        ) : (
          <div className="fr-container">
            <SectionTitle title={title} subtitle={subtitle} isSided={false} />

            {children}
          </div>
        )}
      </div>
    </div>
  )
}
