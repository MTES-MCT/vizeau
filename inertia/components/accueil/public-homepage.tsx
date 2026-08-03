import HomeSection from '~/ui/HomeSection'
import Reveal from '~/ui/Reveal'
import { fr } from '@codegouvfr/react-dsfr'
import Hero from './hero'
import PresentationTilesList from './presentation-card/presentation-tiles-list'

export default function PublicHomepage() {
  return (
    <div>
      <Reveal direction="none" duration={900}>
        <Hero isPublic />
      </Reveal>

      <Reveal>
        <HomeSection
          title="Tout ce dont vous avez besoin pour protéger la ressource en eau"
          subtitle="Des données mises à jour automatiquement, un journal de bord et des partages intuitifs"
        >
          <PresentationTilesList />
        </HomeSection>
      </Reveal>

      <Reveal>
        <HomeSection
          background="secondary"
          title="Visualisez la qualité de l'eau en un coup d'œil"
          subtitle="Mise en avant des dépassements pour identifier rapidement les problématiques liées à la qualité de l'eau"
          illustration="/Illustration-qualite-eau.webp"
        >
          <Reveal direction="up" delay={150}>
            <p className="fr-text--lg fr-m-0">
              Viz'eau agrège les résultats des analyses du <strong>contrôle sanitaire</strong> et
              les synthétise : nombre d'analyses, dépassements, paramètres concernés sous{' '}
              <strong>forme de graphiques ou tableaux</strong>.
            </p>
          </Reveal>
        </HomeSection>
      </Reveal>

      <Reveal>
        <HomeSection
          title="Suivre l'évolution de l'assolement au sein de l'AAC"
          illustration="/Illustration-qualite-assolement.webp"
          illustrationSide="right"
        >
          <div className="flex flex-col gap-6">
            <Reveal direction="up" delay={150}>
              <p className="fr-text--lg fr-m-0">
                Viz'eau agrège <strong>les données RPG</strong> (Registre Parcellaire Graphique)
                pour montrer la répartition des cultures, l'
                <strong>évolution annuelle de l'assolement</strong>, et permettre aux acteurs
                (animateurs de captage, agences de l'eau, collectivités) d'identifier{' '}
                <strong>les cultures à risque</strong> et de mesurer l'impact des{' '}
                <strong>démarches agro-environnementales</strong>.
              </p>
            </Reveal>

            <Reveal direction="up" delay={300}>
              <div
                className="fr-px-3w fr-py-2w flex gap-2 items-start"
                style={{
                  borderLeft: `4px solid ${fr.colors.decisions.border.active.blueFrance.default}`,
                  color: fr.colors.decisions.text.actionHigh.blueFrance.default,
                  backgroundColor: fr.colors.decisions.background.alt.blueFrance.default,
                  paddingLeft: '1rem',
                }}
              >
                <span className="fr-icon-information-line" aria-hidden="true"></span>
                <p className=" fr-m-0">
                  Le contrôle sanitaire, réalisé par les Agences régionales de santé (ARS), vérifie
                  régulièrement que l'eau distribuée respecte les normes de potabilité en mesurant
                  des paramètres réglementés.
                </p>
              </div>
            </Reveal>
          </div>
        </HomeSection>
      </Reveal>
    </div>
  )
}
