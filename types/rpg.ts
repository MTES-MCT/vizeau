/*
 * Données du RPG servies à l'éditeur de parcelles, par les props optionnelles `rpg*` des pages
 * qui l'ouvrent (voir doc/front-end/parcelles-rpg.md). Communes au serveur et au front.
 */

/** Emprise [ouest, sud, est, nord], en degrés (WGS84). */
export type Bbox = [number, number, number, number]

/** Exploitation Viz'Eau. Son nom n'est pas unique : comparer les exploitations par `id`. */
export type RpgExploitation = { id: string; name: string }

/** Parcelle du RPG, dans la zone de l'utilisateur. */
export type RpgParcelle = {
  /** Identifiant stable de la parcelle dans le millésime, celui des tuiles et de `parcelles.rpg_id`. */
  rpgId: string
  cultureCode: string | null
  /** Surface géométrique, en hectares, au centième comme dans les tuiles. */
  surface: number | null
  bio: boolean
  centroid: { x: number; y: number }
  /** Exploitation Viz'Eau à laquelle la parcelle est rattachée pour ce millésime, sinon `null`. */
  exploitation: RpgExploitation | null
}

/** Parcelles d'un PACAGE dans la zone de l'utilisateur. */
export type RpgPacageFound = {
  status: 'found'
  pacage: string
  millesime: string
  /** Exploitation Viz'Eau qui a le plus de parcelles de ce PACAGE, sinon `null`. */
  exploitation: RpgExploitation | null
  /** Parcelles du PACAGE dans la zone, au moins une. */
  parcelles: RpgParcelle[]
  /** Emprise de ces parcelles, pour y centrer la carte. */
  bbox: Bbox
  /** Parcelles du même PACAGE hors de la zone : comptées, jamais détaillées. */
  parcellesHorsZone: number
}

/**
 * Résultat d'une recherche de PACAGE :
 * - `found` : le PACAGE a au moins une parcelle dans la zone ;
 * - `outsideZone` : aucune parcelle dans la zone (PACAGE recherché), ou parcelle cliquée hors de
 *   la zone, dont le PACAGE n'est alors pas cherché ;
 * - `notFound` : PACAGE absent du millésime, ou aucune parcelle de ce numéro à cet endroit.
 */
export type RpgPacageResult = RpgPacageFound | { status: 'outsideZone' } | { status: 'notFound' }

/** PACAGE des parcelles d'une emprise. */
export type RpgEmprisePacages = {
  /** Un groupe par PACAGE, avec ses parcelles de l'emprise. */
  pacages: { pacage: string; rpgIds: string[] }[]
}

/** PACAGE des parcelles enregistrées d'une exploitation Viz'Eau, pour un millésime. */
export type RpgExploitationPacages = {
  /** Chaque PACAGE avec toutes ses parcelles de la zone, rattachées ou non à l'exploitation. */
  pacages: RpgPacageFound[]
  /** Parcelles enregistrées hors de la zone : leur PACAGE n'est pas cherché. */
  horsZone: string[]
  /** Parcelles enregistrées introuvables dans le RPG du millésime à leur emplacement. */
  introuvables: string[]
}

/** Exploitation Viz'Eau qui a des parcelles dans la zone, avec ces parcelles. */
export type RpgZoneExploitation = RpgExploitation & { rpgIds: string[] }
