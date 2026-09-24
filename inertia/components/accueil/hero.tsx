import { fr } from '@codegouvfr/react-dsfr'
import Button from '@codegouvfr/react-dsfr/Button'

export type HeroProps =
  { isPublic: true } | { isPublic?: false; urgentTasksCount: number; currentProjectsCount: number }

type LoggedUserHeroContentProps = {
  urgentTasksCount: number
  currentProjectsCount: number
}

function LoggedUserHeroContent({
  urgentTasksCount,
  currentProjectsCount,
}: LoggedUserHeroContentProps) {
  return (
    <div className="w-full max-w-[60%] max-[1440px]:max-w-full min-[2100px]:max-w-full">
      <h1 className="fr-mb-5w">Bonjour !</h1>
      <div className="flex flex-col">
        <p className="fr-h6">Qu’avez vous de prévu aujourd’hui ?</p>
        <div
          className="flex flex-col gap-2 fr-text--lg"
          style={{ color: fr.colors.decisions.text.actionHigh.blueFrance.default }}
        >
          <div>
            <span className="fr-icon-arrow-right-line" />{' '}
            {urgentTasksCount > 0 ? (
              <a
                href="#prochaines-taches"
                onClick={(e) => {
                  e.preventDefault()
                  document
                    .getElementById('prochaines-taches')
                    ?.scrollIntoView({ behavior: 'smooth' })
                }}
              >
                <strong>
                  {urgentTasksCount} tâche{urgentTasksCount > 1 ? 's' : ''} urgente
                  {urgentTasksCount > 1 ? 's' : ''}
                </strong>{' '}
                à traiter
              </a>
            ) : (
              <strong>Aucune tâche urgente à traiter</strong>
            )}
          </div>
          <div>
            <span className="fr-icon-arrow-right-line" />{' '}
            {currentProjectsCount > 0 ? (
              <a
                href="#projets-en-cours"
                onClick={(e) => {
                  e.preventDefault()
                  document
                    .getElementById('projets-en-cours')
                    ?.scrollIntoView({ behavior: 'smooth' })
                }}
              >
                <strong>
                  {currentProjectsCount} projet{currentProjectsCount > 1 ? 's' : ''} en cours
                </strong>
              </a>
            ) : (
              <>Aucun projet en cours</>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

function PublicHeroContent() {
  return (
    <div className="max-w-[700px] min-[1440px]:max-w-[calc(55%_-_2rem)]">
      <div className="fr-mb-6w flex flex-col">
        <h1 className="fr-mb-1w">
          Protéger la ressource d'eau en France, du diagnostic à l'action
        </h1>
        <span
          className="fr-text--lg fr-m-0"
          style={{ color: fr.colors.decisions.text.mention.grey.default }}
        >
          Des données structurées pour agir sur la protection de la ressource en eau.
        </span>
      </div>
      <p className="fr-text--lg">
        Viz'Eau réunit de <strong>multiples sources de données</strong> autour des captages (qualité
        de l'eau, activité agricole, projets locaux) pour{' '}
        <strong>aider animateurs, agriculteurs et État</strong> à agir en amont pour{' '}
        <strong>la qualité de l'eau </strong> que nous boirons demain.
      </p>
      <div className="flex flex-col gap-2">
        <div className="flex gap-4">
          <Button linkProps={{ href: 'mailto:vizeau@beta.gouv.fr' }}>Demander un accès</Button>
        </div>
        <div className="fr-text--sm fr-mt-1v">
          <span className="fr-icon-lock-unlock-line fr-icon--sm fr-mr-1w" />
          Accès réservé aux agents habilités
        </div>
      </div>
    </div>
  )
}

export default function Hero(props: HeroProps) {
  return (
    <div
      className="w-full relative overflow-hidden fr-px-4w fr-py-8w flex justify-center min-h-[60px]"
      style={{ backgroundColor: fr.colors.decisions.background.alt.blueFrance.default }}
    >
      <img
        className="pointer-events-none absolute right-0 bottom-0 h-full w-auto max-w-none object-contain object-bottom opacity-10 min-[1440px]:h-auto min-[1440px]:w-[45%] min-[1440px]:opacity-100"
        src="/Illustration-hero.webp"
        alt="Illustration hero"
      />

      <div className="fr-container relative">
        {props.isPublic ? (
          <PublicHeroContent />
        ) : (
          <LoggedUserHeroContent
            urgentTasksCount={props.urgentTasksCount}
            currentProjectsCount={props.currentProjectsCount}
          />
        )}
      </div>
    </div>
  )
}
