import './custom-tile.css'
import { fr } from '@codegouvfr/react-dsfr'

import { Tile } from '@codegouvfr/react-dsfr/Tile'
import Reveal from '~/ui/Reveal'

const PRESENTATION_ELEMENTS = [
  {
    title: 'Suivi de la qualité de l’eau',
    description:
      "Les données sont mises à jour automatiquement à partir des données du contrôle sanitaire de l'eau brute.",
    imageUrl: '/presentation-tile-icons/chart-line.png',
    backgroundColor: fr.colors.decisions.artwork.minor.orangeTerreBattue.default,
  },
  {
    title: 'Suivi des exploitations',
    description:
      'Recensez les exploitations agricoles et leurs parcelles sur votre territoire pour un suivi précis et actualisé.',
    imageUrl: '/presentation-tile-icons/map-pin-user-line.png',
    backgroundColor: fr.colors.decisions.artwork.minor.greenArchipel.default,
  },
  {
    title: 'Visualisation cartographique',
    description:
      'Explorez une carte interactive de votre AAC avec les parcelles RPG des exploitations agricoles que vous suivez, filtres par culture et par périmètre de protection',
    imageUrl: '/presentation-tile-icons/france-line.png',
    backgroundColor: fr.colors.decisions.artwork.minor.yellowMoutarde.default,
  },
  {
    title: 'Référentiel des AAC',
    description:
      "Accédez à toutes les aires d'alimentation de captage nationales, avec leurs périmètres et les communes associées, en un clic.",
    imageUrl: '/presentation-tile-icons/list-unordered-line.png',
    backgroundColor: fr.colors.decisions.artwork.minor.purpleGlycine.default,
  },
  {
    title: 'Suivi de projets',
    description:
      'Assurez le bon déroulé de vos projets : PSE, MAEC, accompagnement technique, conversion bio ou autre.',
    imageUrl: '/presentation-tile-icons/draft-line.png',
    backgroundColor: fr.colors.decisions.artwork.minor.blueFrance.default,
  },
  {
    title: 'Exports intuitifs',
    description:
      'Simplifiez la collaboration en exportant vos données et partagez-les facilement avec les acteurs de la protection de l’eau.',
    imageUrl: '/presentation-tile-icons/share-line.png',
    backgroundColor: fr.colors.decisions.artwork.minor.greenBourgeon.default,
  },
]

export default function PresentationTilesList({}: {}) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
      {PRESENTATION_ELEMENTS.map((element, index) => (
        <Reveal key={element.title} direction="up" delay={90 + index * 100}>
          <div className="h-full">
            <Tile
              title={element.title}
              desc={element.description}
              orientation="horizontal"
              imageUrl={element.imageUrl}
              className="custom-tile"
            />
          </div>
        </Reveal>
      ))}
    </div>
  )
}
