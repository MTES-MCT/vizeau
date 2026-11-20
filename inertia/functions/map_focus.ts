/*
 * Vue initiale des cartes de sélection des parcelles : quelle emprise afficher à l'ouverture,
 * quelle AAC présenter dans le sélecteur « Zoomer sur… » et lesquelles mettre en valeur.
 * Sans aucun import pour rester testable hors du navigateur.
 */

export type Bbox = [number, number, number, number]

export type AacEmprise = {
  id: string
  /** Code SANDRE, qui identifie l'AAC dans les tuiles. */
  code: string
  label: string
  bbox: Bbox
}

/** Ce que l'écran appelant sait du contexte. */
export type MapFocusContext = {
  /** Territoires de l'entité éditée (projet, exploitation) : le premier est cadré. */
  territoireIds?: string[]
}

export type InitialMapView = {
  /** AAC affichée dans le sélecteur, à défaut aucune. */
  aacId?: string
  /** Emprise affichée à l'ouverture, à défaut la France entière. */
  bbox?: Bbox
}

function unionBboxes(bboxes: Bbox[]): Bbox {
  return [
    Math.min(...bboxes.map((bbox) => bbox[0])),
    Math.min(...bboxes.map((bbox) => bbox[1])),
    Math.max(...bboxes.map((bbox) => bbox[2])),
    Math.max(...bboxes.map((bbox) => bbox[3])),
  ]
}

export function pickInitialMapView(aacs: AacEmprise[], context: MapFocusContext): InitialMapView {
  // Plusieurs AAC pour l'entité éditée : on cadre la première, dans l'ordre de la liste
  const firstTerritoireAac = aacs.find((aac) => context.territoireIds?.includes(aac.id))
  if (firstTerritoireAac) return { aacId: firstTerritoireAac.id, bbox: firstTerritoireAac.bbox }

  return frameAacs(aacs)
}

/** Cadre l'ensemble des AAC, et ne nomme l'AAC dans le sélecteur que si elle est seule. */
function frameAacs(aacs: AacEmprise[]): InitialMapView {
  if (aacs.length === 0) return {}
  return {
    aacId: aacs.length === 1 ? aacs[0].id : undefined,
    bbox: unionBboxes(aacs.map((item) => item.bbox)),
  }
}

/** AAC à mettre en valeur sur la carte : celles de l'entité éditée. */
export function getHighlightedAacCodes(aacs: AacEmprise[], context: MapFocusContext): string[] {
  return aacs.filter((aac) => context.territoireIds?.includes(aac.id)).map((aac) => aac.code)
}
