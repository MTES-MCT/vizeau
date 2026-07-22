import { fr } from '@codegouvfr/react-dsfr'

export type HomeSectionProps = {
  background?: string
  title?: string
  subtitle?: string
  illustration?: React.ReactNode
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
  <div className={`flex flex-col ${isSided ? 'items-start' : 'items-center'}`}>
    {title && (
      <h2 className="fr-mb-0" style={{ color: fr.colors.decisions.text.title.blueFrance.default }}>
        {title}
      </h2>
    )}
    {subtitle && (
      <p className="fr-text--lead" style={{ color: fr.colors.decisions.text.mention.grey.default }}>
        {subtitle}
      </p>
    )}
  </div>
)

export default function HomeSection({
  background,
  title,
  subtitle,
  illustration,
  illustrationSide = 'right',
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
      className="fr-container fr-py-4w flex items-center justify-center"
      style={{ backgroundColor }}
    >
      {illustration ? (
        <div
          className={`flex flex-col gap-8 md:flex-row ${illustrationSide === 'right' ? 'md:flex-row-reverse' : ''}`}
        >
          <img src={illustration as string} alt="" className="w-full flex-1 min-w-[370px]" />
          <div className="flex-2 h-full flex flex-col justify-start items-start gap-2">
            <SectionTitle title={title} subtitle={subtitle} isSided={true} />

            {children}
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center">
          <SectionTitle title={title} subtitle={subtitle} isSided={false} />

          {children}
        </div>
      )}
    </div>
  )
}
