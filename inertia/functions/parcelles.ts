export type StepParcelle = {
  /** Clé unifiée : `${year}:${rpgId}`, ou `manual:${id}` pour une parcelle enregistrée sans identifiant RPG. */
  key: string
  rpgId: string | null
  surface: number | null
  cultureCode: string | null
  centroid: { x: number; y: number } | undefined
  year: number
  isBio?: boolean
  /** Numéro PACAGE sous lequel la parcelle est déclarée, s'il est connu. */
  pacage?: string | null
  /** Horodatage de l'ajout dans le formulaire, absent pour une parcelle déjà rattachée. */
  addedAt?: number
  /** Sélectionnée pour la persistance. Décocher ne supprime pas la parcelle. */
  checked: boolean
}

export type PacageGroup = {
  pacage: string
  /** Millésime RPG pour lequel ce PACAGE a été recherché. */
  year: number
  parcelles: StepParcelle[]
}

/** Parcelles d'un même millésime (un seul RPG). */
export type YearParcelles = {
  pacageGroups: PacageGroup[]
  manualParcelles: StepParcelle[]
}

export type ParcellesState = {
  /** Parcelles compartimentées par millésime RPG (clé = année). */
  byYear: Record<number, YearParcelles>
  /** Onglet actif : `pacage:${year}:${pacage}` | 'actives'. */
  activeTab: string
}

export const ACTIVES_TAB_ID = 'actives'

export function pacageTabId(pacage: string, year: number): string {
  return `pacage:${year}:${pacage}`
}

export function emptyYearParcelles(): YearParcelles {
  return { pacageGroups: [], manualParcelles: [] }
}

export function emptyParcellesState(): ParcellesState {
  return {
    byYear: {},
    activeTab: ACTIVES_TAB_ID,
  }
}

export function rpgParcelleKey(year: number, rpgId: string): string {
  return `${year}:${rpgId}`
}

export function manualParcelleKey(id: string): string {
  return `manual:${id}`
}

/** Le millésime demandé, ou un lot vide si aucune parcelle n'y est encore rattachée. */
export function getYearParcelles(state: ParcellesState, year: number): YearParcelles {
  return state.byYear[year] ?? emptyYearParcelles()
}

/** Toutes les parcelles (cochées ou non) d'un millésime, toutes sources confondues. */
export function bucketParcelles(bucket: YearParcelles): StepParcelle[] {
  return [...bucket.pacageGroups.flatMap((group) => group.parcelles), ...bucket.manualParcelles]
}

/**
 * Parcelles cochées d'un groupe PACAGE. Une parcelle désélectionnée n'est affichée nulle part
 * mais reste dans le groupe, pour y retrouver sa place si elle est resélectionnée.
 */
export function getCheckedGroupParcelles(group: PacageGroup): StepParcelle[] {
  return group.parcelles.filter((parcelle) => parcelle.checked)
}

/** Parcelles cochées d'un millésime, dans l'ordre où elles ont été ajoutées. */
export function getActiveParcelles(bucket: YearParcelles): StepParcelle[] {
  return bucketParcelles(bucket)
    .filter((parcelle) => parcelle.checked)
    .sort((a, b) => (a.addedAt ?? 0) - (b.addedAt ?? 0))
}

/**
 * Met à jour le lot de parcelles d'un millésime de façon immutable. Un lot redevenu vide
 * est retiré pour ne pas conserver d'années fantômes dans l'objet.
 */
export function updateYearParcelles(
  state: ParcellesState,
  year: number,
  updater: (bucket: YearParcelles) => YearParcelles
): ParcellesState {
  const updatedBucket = updater(getYearParcelles(state, year))
  const byYear = { ...state.byYear }
  if (updatedBucket.pacageGroups.length === 0 && updatedBucket.manualParcelles.length === 0) {
    delete byYear[year]
  } else {
    byYear[year] = updatedBucket
  }
  return { ...state, byYear }
}

/** Met à jour une parcelle, où qu'elle soit (clé unique tous millésimes confondus). */
export function updateParcelle(
  state: ParcellesState,
  key: string,
  updater: (parcelle: StepParcelle) => StepParcelle
): ParcellesState {
  const update = (parcelle: StepParcelle): StepParcelle =>
    parcelle.key === key ? updater(parcelle) : parcelle
  const byYear: Record<number, YearParcelles> = {}
  for (const [year, bucket] of Object.entries(state.byYear)) {
    byYear[Number(year)] = {
      pacageGroups: bucket.pacageGroups.map((group) => ({
        ...group,
        parcelles: group.parcelles.map(update),
      })),
      manualParcelles: bucket.manualParcelles.map(update),
    }
  }
  return { ...state, byYear }
}

/** Bascule la case d'une parcelle. */
export function toggleParcelle(state: ParcellesState, key: string): ParcellesState {
  return updateParcelle(state, key, (parcelle) => ({ ...parcelle, checked: !parcelle.checked }))
}

/** Ensemble des clés déjà présentes (tous millésimes), pour dédoublonner. */
export function getAllParcelleKeys(state: ParcellesState): Set<string> {
  const keys = new Set<string>()
  for (const bucket of Object.values(state.byYear)) {
    for (const parcelle of bucketParcelles(bucket)) keys.add(parcelle.key)
  }
  return keys
}
