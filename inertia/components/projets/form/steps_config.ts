export const STEP_KEYS = {
  GENERAL_INFOS: 1,
  FIRST_ENTRY: 2,
  CONSOLIDATIONS: 3,
  PARCELLES: 4,
  EXPLOITATIONS: 5,
  CAPTAGES: 6,
} as const

export type ProjetFormStep = {
  key: keyof typeof STEP_KEYS
  title: string
  nextTitle?: string
  component?: React.ComponentType<any>
  description?: string
  iconId?: string
}

export const STEPS: Record<number, ProjetFormStep> = {
  [STEP_KEYS.GENERAL_INFOS]: {
    key: 'GENERAL_INFOS',
    title: 'Informations générales',
    nextTitle: 'Première étape de suivi',
  },
  [STEP_KEYS.FIRST_ENTRY]: {
    key: 'FIRST_ENTRY',
    title: 'Première étape de suivi',
    nextTitle: 'Rattachements',
  },
  [STEP_KEYS.CONSOLIDATIONS]: {
    key: 'CONSOLIDATIONS',
    title: 'Rattachements',
    nextTitle: 'Parcelles',
  },
  [STEP_KEYS.PARCELLES]: {
    key: 'PARCELLES',
    title: 'Parcelles',
    nextTitle: 'Exploitations',
    description: 'Associer les parcelles agricoles concernées par ce projet. Sélection via carte.',
    iconId: 'fr-icon-collage-line',
  },
  [STEP_KEYS.EXPLOITATIONS]: {
    key: 'EXPLOITATIONS',
    title: 'Exploitations',
    nextTitle: 'Points de prélèvements',
    description:
      'Liez une ou plusieurs exploitations agricoles. Utile pour les projets collectifs.',
    iconId: 'fr-icon-map-pin-user-line',
  },
  [STEP_KEYS.CAPTAGES]: {
    key: 'CAPTAGES',
    title: 'Points de prélèvements',
    description: 'Associer des points de prélèvements concernés par ce projet.',
    iconId: 'fr-icon-drop-line',
  },
}
