import type { Data } from '@generated/data'
import type { SelectedParcelle } from '~/components/map/parcelles-selection-map'
import type { SelectedParcelleFormData } from '~/components/projets/form/projet-form'

/*
 * Parcelles des exploitations rattachées à un projet, par millésime RPG.
 *
 * En parallèle de la sélection, on garde pour chaque millésime la liste ordonnée des
 * exploitations du projet dont on a ajouté les parcelles (`addedExploitationIds`).
 */

export type ExploitationParcelle = Pick<
  Data.Parcelle,
  'id' | 'year' | 'rpgId' | 'surface' | 'cultureCode' | 'centroid'
>

export type ProjetExploitation = {
  id: string
  name: string
  parcelles?: ExploitationParcelle[]
}

function isInMillesime(parcelle: { year: number }, millesime: string) {
  return String(parcelle.year) === millesime
}

/** Parcelles de l'exploitation pour le millésime. Sans identifiant RPG, une parcelle est ignorée. */
export function getExploitationParcelles(exploitation: ProjetExploitation, millesime: string) {
  return (exploitation.parcelles ?? []).filter(
    (p): p is ExploitationParcelle & { rpgId: string } =>
      p.rpgId !== null && isInMillesime(p, millesime)
  )
}

/** Parcelles de l'exploitation pour le millésime, au format de la sélection sur la carte. */
export function getExploitationSelectedParcelles(
  exploitation: ProjetExploitation,
  millesime: string
): SelectedParcelle[] {
  return getExploitationParcelles(exploitation, millesime).map((p) => ({
    rpgId: p.rpgId,
    surface: p.surface,
    cultureCode: p.cultureCode,
    centroid: p.centroid ?? undefined,
  }))
}

/** Exploitations du projet, dans l'ordre de la liste complète. */
export function getProjectExploitations<T extends ProjetExploitation>(
  exploitations: T[],
  projectExploitationIds: string[]
): T[] {
  const ids = new Set(projectExploitationIds)
  return exploitations.filter((exploitation) => ids.has(exploitation.id))
}

/** Exploitations du projet qui ont au moins une parcelle pour le millésime. */
export function getExploitationsWithParcelles<T extends ProjetExploitation>(
  projectExploitations: T[],
  millesime: string
): T[] {
  return projectExploitations.filter((e) => getExploitationParcelles(e, millesime).length > 0)
}

/**
 * Exploitations ajoutées pour le millésime, dans l'ordre d'ajout. Celles qui ne sont plus
 * dans le projet, ou qui n'ont pas de parcelle pour ce millésime, sont écartées.
 */
export function getAddedExploitations<T extends ProjetExploitation>(
  addedExploitationIds: string[],
  projectExploitations: T[],
  millesime: string
): T[] {
  const eligible = getExploitationsWithParcelles(projectExploitations, millesime)
  return addedExploitationIds.flatMap((id) => {
    const exploitation = eligible.find((e) => e.id === id)
    return exploitation ? [exploitation] : []
  })
}

/**
 * Exploitation du projet de chaque parcelle du millésime, indexée par identifiant RPG. Si une
 * parcelle figure dans plusieurs exploitations, la première de la liste l'emporte.
 */
export function getParcelleExploitations<T extends ProjetExploitation>(
  projectExploitations: T[],
  millesime: string
): Map<string, T> {
  const parcelleExploitations = new Map<string, T>()
  for (const exploitation of projectExploitations) {
    for (const parcelle of getExploitationParcelles(exploitation, millesime)) {
      if (!parcelleExploitations.has(parcelle.rpgId)) {
        parcelleExploitations.set(parcelle.rpgId, exploitation)
      }
    }
  }
  return parcelleExploitations
}

/**
 * Reconstruit, pour chaque millésime présent dans la sélection, la liste des exploitations
 * du projet dont au moins une parcelle est sélectionnée.
 */
export function deriveAddedExploitationIds(
  items: SelectedParcelleFormData[],
  projectExploitations: ProjetExploitation[]
): Record<string, string[]> {
  const millesimes = [...new Set(items.map((p) => String(p.year)))]
  return Object.fromEntries(
    millesimes.map((millesime) => {
      const parcelleExploitations = getParcelleExploitations(projectExploitations, millesime)
      const addedIds = new Set(
        items
          .filter((p) => isInMillesime(p, millesime))
          .map((p) => parcelleExploitations.get(p.rpgId)?.id)
      )
      // On garde l'ordre des exploitations du projet
      const ids = projectExploitations.filter((e) => addedIds.has(e.id)).map((e) => e.id)
      return [millesime, ids]
    })
  )
}
