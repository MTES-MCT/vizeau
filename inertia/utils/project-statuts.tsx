import { fr } from '@codegouvfr/react-dsfr'

export const PROJECT_STATUTS = {
  to_be_started: {
    label: 'À démarrer',
    iconId: 'fr-icon-flag-line',
    color: fr.colors.decisions.background.flat.info.default,
  },
  current: {
    label: 'En cours',
    iconId: 'fr-icon-play-line',
    color: fr.colors.decisions.artwork.major.blueFrance.default,
  },
  completed: {
    label: 'Terminé',
    iconId: 'fr-icon-check-line',
    color: fr.colors.decisions.text.default.success.default,
  },
  abandoned: {
    label: 'Abandonné',
    iconId: 'fr-icon-error-line',
    color: fr.colors.decisions.background.actionHigh.grey.hover,
  },
}
