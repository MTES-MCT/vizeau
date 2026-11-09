import type { Data } from '@generated/data'
import type {
  ProjetParcellesFormData,
  SelectedParcelleFormData,
} from '~/components/projets/form/projet-form'

/*
 * Logique de sélection des parcelles d'un projet, par millésime RPG.
 *
 * La sélection de tous les millésimes est conservée dans une seule liste (`items`), chaque
 * parcelle portant son année : changer de millésime ne change que la sélection affichée.
 * En parallèle, `addedExploitationIds` garde, pour chaque millésime, la liste ordonnée des
 * exploitations du projet dont on a ajouté les parcelles.
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

/** Parcelle cliquée sur la carte, telle que la remonte la couche RPG. */
export type MapParcelle = Pick<
  SelectedParcelleFormData,
  'rpgId' | 'surface' | 'cultureCode' | 'centroid'
>

function isInMillesime(parcelle: { year: number }, millesime: string) {
  return String(parcelle.year) === millesime
}

export function getSelectedParcelles(parcelles: ProjetParcellesFormData) {
  return parcelles.items.filter((p) => isInMillesime(p, parcelles.millesime))
}

export function getExploitationParcelles(exploitation: ProjetExploitation, millesime: string) {
  return (exploitation.parcelles ?? []).filter((p) => isInMillesime(p, millesime))
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
 * Exploitations ajoutées pour le millésime affiché, dans l'ordre d'ajout. Celles qui ne sont
 * plus dans le projet, ou qui n'ont pas de parcelle pour ce millésime, sont écartées.
 */
export function getAddedExploitations<T extends ProjetExploitation>(
  parcelles: ProjetParcellesFormData,
  projectExploitations: T[]
): T[] {
  const eligible = getExploitationsWithParcelles(projectExploitations, parcelles.millesime)
  return (parcelles.addedExploitationIds[parcelles.millesime] ?? []).flatMap((id) => {
    const exploitation = eligible.find((e) => e.id === id)
    return exploitation ? [exploitation] : []
  })
}

/** Exploitation du projet à laquelle appartient la parcelle pour le millésime, s'il y en a une. */
export function getParcelleExploitation<T extends ProjetExploitation>(
  rpgId: string,
  millesime: string,
  projectExploitations: T[]
): T | null {
  return (
    projectExploitations.find((e) =>
      getExploitationParcelles(e, millesime).some((p) => p.rpgId === rpgId)
    ) ?? null
  )
}

/** Sélectionne ou désélectionne une parcelle cliquée sur la carte, pour le millésime affiché. */
export function toggleParcelle(
  parcelles: ProjetParcellesFormData,
  parcelle: MapParcelle,
  projectExploitations: ProjetExploitation[]
): ProjetParcellesFormData {
  const { millesime } = parcelles
  const isSelected = parcelles.items.some(
    (p) => isInMillesime(p, millesime) && p.rpgId === parcelle.rpgId
  )
  if (isSelected) {
    return {
      ...parcelles,
      items: parcelles.items.filter(
        (p) => !(isInMillesime(p, millesime) && p.rpgId === parcelle.rpgId)
      ),
    }
  }
  // Parcelle connue d'une exploitation du projet : on réutilise son identifiant
  const known = projectExploitations
    .flatMap((e) => getExploitationParcelles(e, millesime))
    .find((p) => p.rpgId === parcelle.rpgId)
  return {
    ...parcelles,
    items: [...parcelles.items, { id: known?.id, year: Number(millesime), ...parcelle }],
  }
}

/**
 * Ajoute l'exploitation pour le millésime affiché et sélectionne celles de ses parcelles qui ne
 * l'étaient pas encore. Renvoie aussi le nombre de parcelles ajoutées, pour l'annoncer.
 */
export function addExploitation(
  parcelles: ProjetParcellesFormData,
  exploitation: ProjetExploitation
): { parcelles: ProjetParcellesFormData; addedCount: number } {
  const { millesime } = parcelles
  const selectedRpgIds = new Set(getSelectedParcelles(parcelles).map((p) => p.rpgId))
  const missing = getExploitationParcelles(exploitation, millesime).filter(
    (p) => !selectedRpgIds.has(p.rpgId)
  )
  const current = parcelles.addedExploitationIds[millesime] ?? []
  return {
    addedCount: missing.length,
    parcelles: {
      ...parcelles,
      items: [
        ...parcelles.items,
        ...missing.map((p) => ({
          id: p.id,
          year: p.year,
          rpgId: p.rpgId,
          surface: p.surface,
          cultureCode: p.cultureCode,
          centroid: p.centroid ?? undefined,
        })),
      ],
      addedExploitationIds: {
        ...parcelles.addedExploitationIds,
        [millesime]: current.includes(exploitation.id) ? current : [...current, exploitation.id],
      },
    },
  }
}
