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

const PACAGE_METHOD: Method<MethodValue> = {
  value: 'pacage',
  label: 'PACAGE',
  iconId: 'fr-icon-hashtag',
}

const UPCOMING_METHODS: Method<MethodValue>[] = [
  {
    value: 'coordonnees',
    label: 'Coordonnées',
    iconId: 'fr-icon-map-pin-2-line',
    isUpcoming: true,
  },
]

/**
 * La méthode « Exploitations » n'est proposée que si l'écran fournit des exploitations. La
 * méthode « PACAGE » est grisée si le serveur ne lit pas les Parquet du RPG.
 */
export const getMethods = (
  hasExploitations: boolean,
  isPacageSearchAvailable: boolean
): Method<MethodValue>[] => [
  CARTE_METHOD,
  ...(hasExploitations ? [EXPLOITATIONS_METHOD] : []),
  { ...PACAGE_METHOD, isUpcoming: !isPacageSearchAvailable },
  ...UPCOMING_METHODS,
]

export default function AddInstructions({
  hasUnavailable,
  isPacageSearchAvailable,
}: {
  hasUnavailable: boolean
  isPacageSearchAvailable: boolean
}) {
  return (
    <div>
      <p className="fr-text--sm fr-mb-1w">
        Cliquez sur une parcelle pour ouvrir sa fiche : vous pourrez l’ajouter ou la retirer
        {isPacageSearchAvailable && ', et voir les autres parcelles de son PACAGE'}.
      </p>
      <ul className="fr-text--sm fr-mb-0">
        <li>Maj+clic ajoute ou retire directement une parcelle.</li>
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
