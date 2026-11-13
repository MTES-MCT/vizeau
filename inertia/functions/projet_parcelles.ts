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

/** Parcelles de l'exploitation pour le millésime. Sans identifiant RPG, une parcelle est ignorée. */
export function getExploitationParcelles(exploitation: ProjetExploitation, millesime: string) {
  return (exploitation.parcelles ?? []).filter(
    (p): p is ExploitationParcelle & { rpgId: string } =>
      p.rpgId !== null && isInMillesime(p, millesime)
  )
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

/** Sélectionne ou désélectionne une parcelle cliquée sur la carte, pour le millésime affiché. */
export function toggleParcelle(
  parcelles: ProjetParcellesFormData,
  parcelle: MapParcelle,
  parcelleExploitations: Map<string, ProjetExploitation>
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
  const exploitation = parcelleExploitations.get(parcelle.rpgId)
  const known =
    exploitation &&
    getExploitationParcelles(exploitation, millesime).find((p) => p.rpgId === parcelle.rpgId)
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

/** Parcelles sélectionnées du millésime affiché qui appartiennent à l'exploitation. */
export function getSelectedExploitationParcelles(
  parcelles: ProjetParcellesFormData,
  exploitation: ProjetExploitation,
  parcelleExploitations: Map<string, ProjetExploitation>
) {
  return getSelectedParcelles(parcelles).filter(
    (p) => parcelleExploitations.get(p.rpgId)?.id === exploitation.id
  )
}

/**
 * Retire l'exploitation du millésime affiché, ainsi que toutes ses parcelles sélectionnées,
 * y compris celles cliquées sur la carte. Les autres millésimes ne sont pas touchés.
 */
export function removeExploitation(
  parcelles: ProjetParcellesFormData,
  exploitation: ProjetExploitation
): ProjetParcellesFormData {
  const { millesime } = parcelles
  const rpgIds = new Set(getExploitationParcelles(exploitation, millesime).map((p) => p.rpgId))
  return {
    ...parcelles,
    items: parcelles.items.filter((p) => !(isInMillesime(p, millesime) && rpgIds.has(p.rpgId))),
    addedExploitationIds: {
      ...parcelles.addedExploitationIds,
      [millesime]: (parcelles.addedExploitationIds[millesime] ?? []).filter(
        (id) => id !== exploitation.id
      ),
    },
  }
}

/** Parcelles de l'exploitation, pour le millésime affiché, qui ne sont pas sélectionnées. */
export function getRemovedParcelles(
  parcelles: ProjetParcellesFormData,
  exploitation: ProjetExploitation
) {
  const selectedRpgIds = new Set(getSelectedParcelles(parcelles).map((p) => p.rpgId))
  return getExploitationParcelles(exploitation, parcelles.millesime).filter(
    (p) => !selectedRpgIds.has(p.rpgId)
  )
}

/** Sélectionne de nouveau les parcelles retirées de l'exploitation, pour le millésime affiché. */
export function readdExploitationParcelles(
  parcelles: ProjetParcellesFormData,
  exploitation: ProjetExploitation
): ProjetParcellesFormData {
  return addExploitation(parcelles, exploitation).parcelles
}
