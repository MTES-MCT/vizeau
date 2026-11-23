import type { SelectedParcelle } from '~/components/map/parcelles-selection-map'

export const PACAGE_FORMAT = /^\d{9}$/

/** Parcelle trouvée pour un PACAGE. */
export type PacageParcelle = SelectedParcelle & {
  /** Exploitation suivie dans Viz'Eau à laquelle la parcelle est déjà rattachée pour ce millésime. */
  rattacheeA?: string
}

export type PacageSearchResult = {
  pacage: string
  millesime: string
  parcelles: PacageParcelle[]
}

/** Échec de la recherche dont le message s'adresse à l'utilisateur. */
export class PacageSearchError extends Error {}

/*
 * DONNÉES FICTIVES, en attendant la recherche côté serveur : à remplacer par l'appel à la route
 * qui lira les parcelles du PACAGE dans le RPG du millésime.
 *
 * Les parcelles « trouvées » sont de vraies parcelles du RPG, piochées parmi celles affichées
 * sur la carte (`candidates`) : elles se surlignent et se sélectionnent comme les autres. Le
 * même numéro, au même endroit, donne les mêmes parcelles.
 *
 * Scénarios, selon le dernier chiffre saisi :
 * - 0 : aucune parcelle trouvée ;
 * - 9 : toutes les parcelles sont rattachées à une autre exploitation ;
 * - 8 : une partie l'est ;
 * - autre : toutes les parcelles sont disponibles.
 */
const FAKE_DELAY_MS = 600

function fakeParcelles(pacage: string, candidates: SelectedParcelle[]): PacageParcelle[] {
  const last = Number(pacage.at(-1))
  if (last === 0) return []
  const digits = [...pacage].map(Number)
  const sorted = [...candidates].sort((a, b) => a.rpgId.localeCompare(b.rpgId))
  const count = Math.min(3 + (digits[7] % 8), sorted.length)
  const start = Number(pacage) % sorted.length
  const step = 1 + (digits[6] % 3)
  return Array.from({ length: count }, (_, index) => {
    const parcelle = sorted[(start + index * step) % sorted.length]
    const isRattachee = last === 9 || (last === 8 && index % 3 === 0)
    return { ...parcelle, rattacheeA: isRattachee ? 'EARL des Peupliers' : undefined }
  }).filter((p, index, list) => list.findIndex((q) => q.rpgId === p.rpgId) === index)
}

/** Parcelles déclarées sous ce PACAGE pour le millésime. */
export async function searchPacage(
  pacage: string,
  millesime: string,
  /** Fictif uniquement : parcelles parmi lesquelles piocher le résultat. */
  candidates: SelectedParcelle[] = []
): Promise<PacageSearchResult> {
  await new Promise((resolve) => setTimeout(resolve, FAKE_DELAY_MS))
  if (candidates.length === 0) {
    throw new PacageSearchError(
      'Données fictives : zoomez sur la carte jusqu’à voir des parcelles, puis relancez la recherche.'
    )
  }
  return { pacage, millesime, parcelles: fakeParcelles(pacage, candidates) }
}

/*
 * Fictif : le PACAGE d'une parcelle cliquée regroupe les parcelles visibles dont le centroïde
 * tombe dans la même maille d'environ 1 km, numérotée d'après cette maille. Deux parcelles
 * voisines donnent donc le même PACAGE et les mêmes parcelles.
 */
const FAKE_CELL_DEGREES = 0.01

const fakeCell = ({ centroid }: SelectedParcelle) =>
  centroid &&
  `${Math.floor(centroid.x / FAKE_CELL_DEGREES)}:${Math.floor(centroid.y / FAKE_CELL_DEGREES)}`

const fakeCellPacage = (cell: string) => {
  let hash = 7
  for (const char of cell) hash = (hash * 31 + char.charCodeAt(0)) % 1_000_000_000
  return String(hash).padStart(9, '0')
}

/** PACAGE sous lequel la parcelle est déclarée, avec toutes ses parcelles, ou `null`. */
export async function findParcellePacage(
  parcelle: SelectedParcelle,
  millesime: string,
  /** Fictif uniquement : parcelles parmi lesquelles chercher celles du même PACAGE. */
  candidates: SelectedParcelle[] = []
): Promise<PacageSearchResult | null> {
  await new Promise((resolve) => setTimeout(resolve, FAKE_DELAY_MS / 2))
  const cell = fakeCell(parcelle)
  if (!cell) return null
  const parcelles = [parcelle, ...candidates.filter((p) => p.rpgId !== parcelle.rpgId)].filter(
    (p) => fakeCell(p) === cell
  )
  return { pacage: fakeCellPacage(cell), millesime, parcelles }
}

/** Méthode PACAGE proposée seulement en développement tant que la recherche est fictive. */
export const isPacageSearchAvailable = import.meta.env.DEV
