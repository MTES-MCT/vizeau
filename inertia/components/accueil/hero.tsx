import { fr } from '@codegouvfr/react-dsfr'
import Button from '@codegouvfr/react-dsfr/Button'
export type HeroProps = {
  createExploitationUrl: string
}

export default function Hero({ createExploitationUrl }: HeroProps) {
  return (
    <div
      className="w-full relative overflow-hidden fr-px-4w fr-py-8w flex justify-center min-h-[60px]"
      style={{ backgroundColor: fr.colors.decisions.background.alt.blueFrance.default }}
    >
      {/* Image toujours ancrée en bas à droite, taille responsive.
          En format tablette et moins : opacité réduite, taille fixée à la hauteur du parent. */}
      <img
        className="pointer-events-none absolute bottom-0 right-0 h-full max-h-full object-contain object-bottom max-[1670px]:max-w-none max-[1670px]:opacity-15 min-[2100px]:h-[40vw] min-[2100px]:max-h-none min-[2100px]:max-w-none min-[2100px]:opacity-20"
        src="/illustration-hero.webp"
        alt="Illustration hero"
      />

      <div className="fr-container relative">
        <div className="w-full max-w-[60%] max-[1440px]:max-w-full min-[2100px]:max-w-full">
          <div className="fr-mb-8w flex flex-col">
            <h1 className="fr-mb-1w">Pilotage de la protection des captages</h1>
            <span
              className="fr-text--lg fr-m-0"
              style={{ color: fr.colors.decisions.text.mention.grey.default }}
            >
              Des données structurées pour agir sur la protection de la ressource en eau.
            </span>
          </div>
          <p>
            L'application facilite l'accès, le traitement et le partage des données liées à la
            qualité de l'eau aux captages. Elle produit un état des lieux clair et directement
            exploitable pour la réalisation de l'étude des dangers. Un outil simple pour appuyer les
            collectivités et services de l'État dans la protection de la ressource en eau.
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
      </div>
    </div>
  )
}
