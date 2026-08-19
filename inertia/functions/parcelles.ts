export type StepParcelle = {
  /** Clé unifiée : `${year}:${rpgId}` (RPG) ou `manual:${numero}` (cadastre / ajout manuel). */
  key: string
  rpgId: string | null
  section: string | null
  numero: string | null
  surface: number | null
  cultureCode: string | null
  centroid: { x: number; y: number } | undefined
  year: number
  isBio?: boolean
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
  /** Onglet actif : `pacage:${year}:${pacage}` | 'manual' | 'actives'. */
  activeTab: string
}

export const ACTIVES_TAB_ID = 'actives'
export const MANUAL_TAB_ID = 'manual'

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

export function manualParcelleKey(numero: string): string {
  return `manual:${numero}`
}

/** Le millésime demandé, ou un lot vide si aucune parcelle n'y est encore rattachée. */
export function getYearParcelles(state: ParcellesState, year: number): YearParcelles {
  return state.byYear[year] ?? emptyYearParcelles()
}

/** Toutes les parcelles (cochées ou non) d'un millésime, toutes sources confondues. */
export function bucketParcelles(bucket: YearParcelles): StepParcelle[] {
  return [...bucket.pacageGroups.flatMap((group) => group.parcelles), ...bucket.manualParcelles]
}

/** Parcelles cochées d'un millésime. */
export function getActiveParcelles(bucket: YearParcelles): StepParcelle[] {
  return bucketParcelles(bucket).filter((parcelle) => parcelle.checked)
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

/** Bascule la case d'une parcelle, où qu'elle soit (clé unique tous millésimes confondus). */
export function toggleParcelle(state: ParcellesState, key: string): ParcellesState {
  const toggle = (parcelle: StepParcelle): StepParcelle =>
    parcelle.key === key ? { ...parcelle, checked: !parcelle.checked } : parcelle
  const byYear: Record<number, YearParcelles> = {}
  for (const [year, bucket] of Object.entries(state.byYear)) {
    byYear[Number(year)] = {
      pacageGroups: bucket.pacageGroups.map((group) => ({
        ...group,
        parcelles: group.parcelles.map(toggle),
      })),
      manualParcelles: bucket.manualParcelles.map(toggle),
    }
  }
  return { ...state, byYear }
}

/** Ensemble des clés déjà présentes (tous millésimes), pour dédoublonner. */
export function getAllParcelleKeys(state: ParcellesState): Set<string> {
  const keys = new Set<string>()
  for (const bucket of Object.values(state.byYear)) {
    for (const parcelle of bucketParcelles(bucket)) keys.add(parcelle.key)
  }
  return keys
}
