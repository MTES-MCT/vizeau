/*
 * Choix de la vue initiale des cartes de sélection des parcelles : quelle emprise afficher à
 * l'ouverture, et quelle AAC présenter dans le sélecteur « Zoomer sur… ».
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

type Point = { x: number; y: number }

/** Ce que l'écran appelant sait du contexte, par ordre de priorité. */
export type MapFocusContext = {
  /** Vue courante de l'écran appelant, reprise telle quelle pour ne pas dépayser. */
  viewport?: Bbox
  /** AAC déjà consultée par l'utilisateur (par exemple ouverte dans la barre latérale). */
  focusedAacId?: string
  /** Territoires de l'entité éditée (projet, exploitation), cadrés ensemble. */
  territoireIds?: string[]
}

export type InitialMapView = {
  /** AAC affichée dans le sélecteur, à défaut aucune. */
  aacId?: string
  /** Emprise affichée à l'ouverture, à défaut la France entière. */
  bbox?: Bbox
  /** L'emprise est à reprendre telle quelle, sans marge ni zoom minimal. */
  isExact?: boolean
}

function containsPoint([west, south, east, north]: Bbox, { x, y }: Point) {
  return x >= west && x <= east && y >= south && y <= north
}

function getBboxCenter([west, south, east, north]: Bbox): Point {
  return { x: (west + east) / 2, y: (south + north) / 2 }
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
  const focusedAac = aacs.find((aac) => aac.id === context.focusedAacId)

  if (context.viewport) {
    const center = getBboxCenter(context.viewport)
    return {
      aacId: (focusedAac ?? aacs.find((aac) => containsPoint(aac.bbox, center)))?.id,
      bbox: context.viewport,
      isExact: true,
    }
  }

  if (focusedAac) return { aacId: focusedAac.id, bbox: focusedAac.bbox }

  const territoireAacs = aacs.filter((item) => context.territoireIds?.includes(item.id))
  return frameAacs(territoireAacs.length > 0 ? territoireAacs : aacs)
}

/** Cadre l'ensemble des AAC, et ne nomme l'AAC dans le sélecteur que si elle est seule. */
function frameAacs(aacs: AacEmprise[]): InitialMapView {
  if (aacs.length === 0) return {}
  return {
    aacId: aacs.length === 1 ? aacs[0].id : undefined,
    bbox: unionBboxes(aacs.map((item) => item.bbox)),
  }
}

/** AAC à mettre en valeur sur la carte : celle consultée, à défaut celles de l'entité éditée. */
export function getHighlightedAacCodes(aacs: AacEmprise[], context: MapFocusContext): string[] {
  const focusedAac = aacs.find((aac) => aac.id === context.focusedAacId)
  if (focusedAac) return [focusedAac.code]
  return aacs.filter((aac) => context.territoireIds?.includes(aac.id)).map((aac) => aac.code)
}
