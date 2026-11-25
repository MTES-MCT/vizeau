import type {
  ExpressionSpecification,
  LayerSpecification,
  MapGeoJSONFeature,
  VectorSourceSpecification,
} from 'maplibre-gl'
import cultures from '~/data/cultures.json'
import { GROUPES_CULTURAUX } from '~/functions/cultures_group'

/*
 * Schéma des tuiles des parcelles agricoles, produites par le projet rpg à partir du RPG de
 * l'ASP : un fichier par millésime, {rpgPmtilesUrl}/{millésime}/rpg.pmtiles, avec une couche
 * `parcelles-agricoles`.
 *
 * - L'identifiant des entités est l'identifiant stable de la parcelle, celui qu'enregistre
 *   `parcelles.rpg_id`.
 * - Propriétés lues : `code_culture`, `surface_geometrie` (en hectares) et `bio` (0 ou 1).
 * - Les tuiles ne portent pas le groupe de cultures : il se déduit du code culture, d'après
 *   `cultures.json`.
 *
 * Ce module est le seul à connaître ce schéma : les cartes passent par ses constantes et par
 * `readParcelleAgricole`.
 */

export const PARCELLES_SOURCE_ID = 'parcelles-agricoles'
export const PARCELLES_SOURCE_LAYER = 'parcelles-agricoles'
export const PARCELLES_FILL_LAYER_ID = 'parcelles-agricoles-fill'
export const PARCELLES_OUTLINE_LAYER_ID = 'parcelles-agricoles-outline'
export const PARCELLES_BIO_FILL_LAYER_ID = 'parcelles-agricoles-bio-fill'
export const PARCELLES_BIO_OUTLINE_LAYER_ID = 'parcelles-agricoles-bio-outline'
/** Halo pulsant puis contour de la parcelle mise en avant, filtrés sur son identifiant. */
export const PARCELLES_FOCUS_GLOW_LAYER_ID = 'parcelles-agricoles-focus-glow'
export const PARCELLES_FOCUS_OUTLINE_LAYER_ID = 'parcelles-agricoles-focus-outline'
/** Couche transparente et jamais filtrée, pour lister les cultures présentes dans la zone visible. */
export const PARCELLES_PROBE_LAYER_ID = 'parcelles-agricoles-probe'

export const PARCELLES_MIN_ZOOM = 10

/** Groupe des codes culture sans groupe dans `cultures.json`, ou absents du référentiel. */
const DEFAULT_GROUP_CODE = '28'

const groupCodeByCulture = new Map(
  cultures.map((culture) => [culture.code, culture.groupCode ?? DEFAULT_GROUP_CODE])
)

/** Groupe de cultures (clé de `GROUPES_CULTURAUX`) d'un code culture. */
export const getCultureGroupCode = (cultureCode: string | null | undefined): string =>
  (cultureCode && groupCodeByCulture.get(cultureCode)) || DEFAULT_GROUP_CODE

/** Expression qui donne le groupe de cultures d'une entité, d'après son code culture. */
const CULTURE_GROUP: ExpressionSpecification = (() => {
  const codesByGroup = new Map<string, string[]>()
  for (const [code, group] of groupCodeByCulture) {
    if (group !== DEFAULT_GROUP_CODE) {
      codesByGroup.set(group, [...(codesByGroup.get(group) ?? []), code])
    }
  }
  return [
    'match',
    ['get', 'code_culture'],
    ...[...codesByGroup].flatMap(([group, codes]) => [codes, group]),
    DEFAULT_GROUP_CODE,
  ] as unknown as ExpressionSpecification
})()

const CULTURE_GROUP_COLOR = [
  'match',
  CULTURE_GROUP,
  ...Object.entries(GROUPES_CULTURAUX).flatMap(([code, group]) => [code, group.color]),
  GROUPES_CULTURAUX[DEFAULT_GROUP_CODE].color,
] as unknown as ExpressionSpecification

/** Parcelles dont le groupe de cultures fait partie de `groupCodes`. */
export const getCultureGroupsFilter = (groupCodes: string[]): ExpressionSpecification => [
  'in',
  CULTURE_GROUP,
  ['literal', groupCodes],
]

/** Parcelles en agriculture biologique, dessinées par les couches bio. */
export const BIO_FILTER: ExpressionSpecification = ['==', ['get', 'bio'], 1]

export const isBioLayerId = (layerId: string) =>
  layerId === PARCELLES_BIO_FILL_LAYER_ID || layerId === PARCELLES_BIO_OUTLINE_LAYER_ID

export const isFocusLayerId = (layerId: string) =>
  layerId === PARCELLES_FOCUS_GLOW_LAYER_ID || layerId === PARCELLES_FOCUS_OUTLINE_LAYER_ID

/** Filtre des couches de mise en avant : aucune parcelle sans identifiant mis en avant. */
export const getFocusedParcelleFilter = (
  focusedParcelleId: string | null
): ExpressionSpecification =>
  focusedParcelleId === null
    ? // Une entité sans identifiant donnerait `''` ci-dessous : rien ne doit passer
      ['==', 1, 0]
    : // Les identifiants des tuiles sont numériques, ceux de l'application des chaînes
      ['==', ['to-string', ['id']], focusedParcelleId]

/** Halo lumineux, lisible sur toutes les couleurs de culture et sur les deux fonds de carte. */
const focusColor = '#ffffff'

/**
 * Halo de la parcelle mise en avant à un instant de sa pulsation, `phase` allant de 0 (halo
 * resserré et opaque) à 1 (halo étalé et estompé).
 */
export const getFocusGlowPaint = (phase: number) => ({
  'line-width': 6 + 12 * phase,
  'line-blur': 4 + 8 * phase,
  'line-opacity': 1 - 0.5 * phase,
})

export type ParcelleAgricole = {
  rpgId: string
  cultureCode: string | null
  /** Surface géométrique, en hectares */
  surface: number | null
  bio: boolean
}

/** Lit une entité de la couche des parcelles agricoles, issue d'un événement ou d'une requête. */
export const readParcelleAgricole = (
  feature: Pick<MapGeoJSONFeature, 'id' | 'properties'>
): ParcelleAgricole | null => {
  if (feature.id === undefined || feature.id === null) return null
  const properties = feature.properties ?? {}
  return {
    rpgId: String(feature.id),
    cultureCode: properties.code_culture ?? null,
    surface: typeof properties.surface_geometrie === 'number' ? properties.surface_geometrie : null,
    bio: properties.bio === 1,
  }
}

const defaultOpacity = 0.5
const selectedOpacity = 1
const unavailableOpacity = 0.2

const defaultZoomedOutLineWidth = 0.1
const defaultZoomedInLineWidth = 1
const selectedZoomedOutLineWidth = 2
const selectedZoomedInLineWidth = 4

export const getParcellesLayers = (): LayerSpecification[] => [
  {
    'id': PARCELLES_FILL_LAYER_ID,
    'type': 'fill',
    'source': PARCELLES_SOURCE_ID,
    'source-layer': PARCELLES_SOURCE_LAYER,
    'minzoom': PARCELLES_MIN_ZOOM,
    'paint': {
      'fill-color': CULTURE_GROUP_COLOR,
      'fill-opacity': [
        'case',
        ['boolean', ['feature-state', 'unavailable'], false],
        unavailableOpacity,
        ['boolean', ['feature-state', 'highlighted'], false],
        selectedOpacity,
        defaultOpacity,
      ],
    },
  },
  {
    'id': PARCELLES_OUTLINE_LAYER_ID,
    'type': 'line',
    'source': PARCELLES_SOURCE_ID,
    'source-layer': PARCELLES_SOURCE_LAYER,
    'minzoom': PARCELLES_MIN_ZOOM,
    'paint': {
      'line-color': '#000000',
      'line-width': [
        'interpolate',
        ['linear'],
        ['zoom'],
        15,
        [
          'case',
          ['boolean', ['feature-state', 'highlighted'], false],
          selectedZoomedOutLineWidth,
          defaultZoomedOutLineWidth,
        ],
        18,
        [
          'case',
          ['boolean', ['feature-state', 'highlighted'], false],
          selectedZoomedInLineWidth,
          defaultZoomedInLineWidth,
        ],
      ],
      'line-opacity': 0.8,
    },
  },
  {
    // Au-dessus des contours des parcelles voisines, qu'il déborde
    'id': PARCELLES_FOCUS_GLOW_LAYER_ID,
    'type': 'line',
    'source': PARCELLES_SOURCE_ID,
    'source-layer': PARCELLES_SOURCE_LAYER,
    'minzoom': PARCELLES_MIN_ZOOM,
    'filter': getFocusedParcelleFilter(null),
    'paint': { 'line-color': focusColor, ...getFocusGlowPaint(0) },
  },
  {
    'id': PARCELLES_FOCUS_OUTLINE_LAYER_ID,
    'type': 'line',
    'source': PARCELLES_SOURCE_ID,
    'source-layer': PARCELLES_SOURCE_LAYER,
    'minzoom': PARCELLES_MIN_ZOOM,
    'filter': getFocusedParcelleFilter(null),
    'paint': {
      'line-color': focusColor,
      'line-width': ['interpolate', ['linear'], ['zoom'], 12, 1.5, 15, 2, 18, 3],
    },
  },
  {
    'id': PARCELLES_BIO_FILL_LAYER_ID,
    'type': 'fill',
    'source': PARCELLES_SOURCE_ID,
    'source-layer': PARCELLES_SOURCE_LAYER,
    'minzoom': PARCELLES_MIN_ZOOM,
    'filter': BIO_FILTER,
    'paint': {
      'fill-color': CULTURE_GROUP_COLOR,
      'fill-opacity': 0, // Transparent par défaut pour la détection uniquement
    },
  },
  {
    'id': PARCELLES_BIO_OUTLINE_LAYER_ID,
    'type': 'line',
    'source': PARCELLES_SOURCE_ID,
    'source-layer': PARCELLES_SOURCE_LAYER,
    'minzoom': PARCELLES_MIN_ZOOM,
    'filter': BIO_FILTER,
    'paint': {
      'line-color': '#000000',
      'line-width': ['interpolate', ['linear'], ['zoom'], 15, 1, 18, 3],
      'line-opacity': 0, // Transparent par défaut
    },
  },
  {
    'id': PARCELLES_PROBE_LAYER_ID,
    'type': 'fill',
    'source': PARCELLES_SOURCE_ID,
    'source-layer': PARCELLES_SOURCE_LAYER,
    'minzoom': PARCELLES_MIN_ZOOM,
    'paint': {
      'fill-opacity': 0,
    },
  },
]

export const getParcellesSource = ({
  rpgPmtilesUrl,
  millesime,
}: {
  rpgPmtilesUrl: string
  millesime: string
}): VectorSourceSpecification => ({
  type: 'vector',
  url: `pmtiles://${rpgPmtilesUrl}/${millesime}/rpg.pmtiles`,
})
