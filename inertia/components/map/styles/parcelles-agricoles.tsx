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
// Parcelle ouverte dans l'éditeur de sélection, et celles de son PACAGE
const focusedLineColor = '#000091'
const relatedLineColor = '#6a6af4'
const focusedZoomedOutLineWidth = 4
const focusedZoomedInLineWidth = 6
const relatedZoomedOutLineWidth = 3
const relatedZoomedInLineWidth = 4
// Parcelles d'une autre exploitation, quand le pointeur survole l'une d'elles
const groupLineColor = '#5e2238'
const groupZoomedOutLineWidth = 2
const groupZoomedInLineWidth = 3

const isFocused: ExpressionSpecification = ['boolean', ['feature-state', 'focused'], false]
const isRelated: ExpressionSpecification = ['boolean', ['feature-state', 'related'], false]
const isGroup: ExpressionSpecification = ['boolean', ['feature-state', 'group'], false]
const isHighlighted: ExpressionSpecification = ['boolean', ['feature-state', 'highlighted'], false]

/**
 * Couleurs du mode « par exploitation » : la sélection, c'est-à-dire l'exploitation éditée, les
 * autres exploitations, et les parcelles non rattachées. Le couple sarcelle / prune reste
 * distinct pour les daltoniens (écart de 13,5 en vision simulée, 26 en vision normale) et ne
 * se confond pas avec les contours bleus de la parcelle ouverte.
 */
export const EXPLOITATION_FILL_COLORS = {
  current: '#1ea28f',
  other: '#944561',
  none: '#d6d6d6',
}

/** Remplissage des parcelles selon leur culture : celui des couches par défaut. */
export const FILL_BY_CULTURE = {
  color: CULTURE_GROUP_COLOR,
  opacity: [
    'case',
    ['boolean', ['feature-state', 'unavailable'], false],
    unavailableOpacity,
    isHighlighted,
    selectedOpacity,
    defaultOpacity,
  ] as ExpressionSpecification,
}

/**
 * Remplissage selon l'exploitation Viz'Eau, lue dans l'état `couleur` de chaque parcelle. Les
 * parcelles d'une autre exploitation gardent leur couleur au lieu d'être estompées.
 */
export const FILL_BY_EXPLOITATION = {
  color: [
    'to-color',
    ['coalesce', ['feature-state', 'couleur'], EXPLOITATION_FILL_COLORS.none],
  ] as ExpressionSpecification,
  opacity: [
    'case',
    ['any', isHighlighted, isGroup],
    selectedOpacity,
    ['!=', ['feature-state', 'couleur'], null],
    0.8,
    0.5,
  ] as ExpressionSpecification,
}

export const getParcellesLayers = (): LayerSpecification[] => [
  {
    'id': PARCELLES_FILL_LAYER_ID,
    'type': 'fill',
    'source': PARCELLES_SOURCE_ID,
    'source-layer': PARCELLES_SOURCE_LAYER,
    'minzoom': PARCELLES_MIN_ZOOM,
    'paint': {
      'fill-color': FILL_BY_CULTURE.color,
      'fill-opacity': FILL_BY_CULTURE.opacity,
    },
  },
  {
    'id': PARCELLES_OUTLINE_LAYER_ID,
    'type': 'line',
    'source': PARCELLES_SOURCE_ID,
    'source-layer': PARCELLES_SOURCE_LAYER,
    'minzoom': PARCELLES_MIN_ZOOM,
    'paint': {
      'line-color': [
        'case',
        isFocused,
        focusedLineColor,
        isRelated,
        relatedLineColor,
        isGroup,
        groupLineColor,
        '#000000',
      ],
      'line-width': [
        'interpolate',
        ['linear'],
        ['zoom'],
        15,
        [
          'case',
          isFocused,
          focusedZoomedOutLineWidth,
          isRelated,
          relatedZoomedOutLineWidth,
          isGroup,
          groupZoomedOutLineWidth,
          ['boolean', ['feature-state', 'highlighted'], false],
          selectedZoomedOutLineWidth,
          defaultZoomedOutLineWidth,
        ],
        18,
        [
          'case',
          isFocused,
          focusedZoomedInLineWidth,
          isRelated,
          relatedZoomedInLineWidth,
          isGroup,
          groupZoomedInLineWidth,
          ['boolean', ['feature-state', 'highlighted'], false],
          selectedZoomedInLineWidth,
          defaultZoomedInLineWidth,
        ],
      ],
      'line-opacity': ['case', ['any', isFocused, isRelated, isGroup], 1, 0.8],
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
