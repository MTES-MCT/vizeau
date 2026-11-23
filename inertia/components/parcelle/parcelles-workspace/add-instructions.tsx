import { isPacageSearchAvailable } from '~/components/parcelle/parcelles-workspace/pacage_search'
import type { Method } from '~/ui/MethodTabs'

export type MethodValue = 'carte' | 'exploitations' | 'pacage' | 'coordonnees'

const CARTE_METHOD: Method<MethodValue> = {
  value: 'carte',
  label: 'Sur la carte',
  iconId: 'fr-icon-cursor-line',
}

const EXPLOITATIONS_METHOD: Method<MethodValue> = {
  value: 'exploitations',
  label: 'Exploitations',
  iconId: 'fr-icon-building-line',
}

// Grisée hors développement tant que la recherche par PACAGE renvoie des données fictives
const PACAGE_METHOD: Method<MethodValue> = {
  value: 'pacage',
  label: 'PACAGE',
  iconId: 'fr-icon-hashtag',
  isUpcoming: !isPacageSearchAvailable,
}

const UPCOMING_METHODS: Method<MethodValue>[] = [
  {
    value: 'coordonnees',
    label: 'Coordonnées',
    iconId: 'fr-icon-map-pin-2-line',
    isUpcoming: true,
  },
]

/** La méthode « Exploitations » n'est proposée que si l'écran fournit des exploitations. */
export const getMethods = (hasExploitations: boolean): Method<MethodValue>[] => [
  CARTE_METHOD,
  ...(hasExploitations ? [EXPLOITATIONS_METHOD] : []),
  PACAGE_METHOD,
  ...UPCOMING_METHODS,
]

export default function AddInstructions({ hasUnavailable }: { hasUnavailable: boolean }) {
  return (
    <div>
      <p className="fr-text--sm fr-mb-1w">
        Cliquez sur une parcelle pour la sélectionner ou la désélectionner.
      </p>
      <ul className="fr-text--sm fr-mb-0">
        <li>Survolez une parcelle pour voir sa culture et sa surface.</li>
        <li>
          Changez de millésime RPG au-dessus de la carte : chaque millésime garde sa propre
          sélection.
        </li>
        {hasUnavailable && (
          <li>Les parcelles estompées sont rattachées à une autre exploitation.</li>
        )}
      </ul>
    </div>
  )
}
