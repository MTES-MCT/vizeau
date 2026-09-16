import { fr } from '@codegouvfr/react-dsfr'
import Button from '@codegouvfr/react-dsfr/Button'

export type HeroProps =
  | { isPublic: true; createExploitationUrl?: string }
  | { isPublic?: false; createExploitationUrl: string }

function LoggedUserHeroContent({ createExploitationUrl }: { createExploitationUrl: string }) {
  return (
    <div className="w-full max-w-full min-[1440px]:max-w-[calc(55%_-_2rem)]">
      <div className="fr-mb-6w flex flex-col">
        <h1 className="fr-mb-1w">Pilotage de la protection des captages</h1>
        <span
          className="fr-text--lg fr-m-0"
          style={{ color: fr.colors.decisions.text.mention.grey.default }}
        >
          Des données structurées pour agir sur la protection de la ressource en eau.
        </span>
      </div>
      <p>
        L'application facilite l'accès, le traitement et le partage des données liées à{' '}
        <strong>la qualité de l'eau aux captages</strong>. Elle produit un état des lieux clair et
        directement exploitable pour la réalisation de <strong>l'étude des dangers</strong>. Un
        outil simple pour appuyer les collectivités et services de l'État dans{' '}
        <strong>la protection de la ressource en eau</strong>.
      </p>
      <div>
        <Button
          iconId="fr-icon-map-pin-user-line"
          className="fr-m-1w"
          linkProps={{ href: createExploitationUrl }}
        >
          Ajouter une exploitation agricole
        </Button>
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

export default function Hero({ isPublic = false, createExploitationUrl }: HeroProps) {
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
        {isPublic ? (
          <PublicHeroContent />
        ) : (
          <LoggedUserHeroContent createExploitationUrl={createExploitationUrl ?? ''} />
        )}
      </div>
    </div>
  )
}
