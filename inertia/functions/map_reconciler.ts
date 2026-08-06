import type maplibre from 'maplibre-gl'
import type { AddLayerObject, FilterSpecification, LayerSpecification } from 'maplibre-gl'
import { getParcellesLayers, getParcellesSource } from '~/components/map/styles/parcelles'
import {
  getAacLayer,
  getAacSource,
  getCommunesLayer,
  getPpeLayer,
  getPpeSource,
  getPprLayer,
  getPprSource,
  getSageLayer,
  getSageSource,
} from '~/components/map/styles/zonage'

/** Basemap layer the overlays are inserted before, when the current style provides it. */
const BASEMAP_ANCHOR_LAYER_ID = 'water-name-lakeline'

const PARCELLES_SOURCE_ID = 'parcelles'

/** Layers backed by the `parcelles` source, in stacking order. */
export const PARCELLES_LAYER_IDS = [
  'parcelles-fill',
  'parcelles-outline',
  'parcellesbio-fill',
  'parcellesbio-outline',
] as const

const BIO_FILL_OPACITY: maplibre.DataDrivenPropertyValueSpecification<number> = [
  'case',
  ['boolean', ['feature-state', 'unavailable'], false],
  0.3,
  ['boolean', ['feature-state', 'highlighted'], false],
  0.7,
  0.5,
]

/** Everything the map has to reflect, derived from the component props. */
export type MapDesiredState = {
  pmtilesUrl: string
  millesime: string
  showParcelles: boolean
  showAac: boolean
  showPpe: boolean
  showPpr: boolean
  showCommunes: boolean
  showSage: boolean
  showBioOnly: boolean
  visibleCultures: string[]
  highlightedParcelleIds: string[]
  unavailableParcelleIds: string[]
}

/** Feature states currently applied to the `parcelles` source. */
export type AppliedFeatureStates = {
  highlighted: string[]
  unavailable: string[]
}

export const EMPTY_FEATURE_STATES: AppliedFeatureStates = {
  highlighted: [],
  unavailable: [],
}

type SourceDefinition = {
  id: string
  build: (state: MapDesiredState) => maplibre.SourceSpecification
}

/** Single declaration site for every source the map needs. */
const SOURCE_DEFINITIONS: SourceDefinition[] = [
  {
    id: PARCELLES_SOURCE_ID,
    build: ({ pmtilesUrl, millesime }) => getParcellesSource({ pmtilesUrl, millesime }),
  },
  { id: 'aac', build: ({ pmtilesUrl }) => getAacSource({ pmtilesUrl }) },
  { id: 'ppe', build: ({ pmtilesUrl }) => getPpeSource({ pmtilesUrl }) },
  { id: 'ppr', build: ({ pmtilesUrl }) => getPprSource({ pmtilesUrl }) },
  { id: 'sage', build: ({ pmtilesUrl }) => getSageSource({ pmtilesUrl }) },
]

/**
 * Single declaration site for every layer the map needs. The order of this list is
 * also the stacking order of the layers, from bottom to top.
 */
const getLayerDefinitions = (): LayerSpecification[] =>
  [
    ...getPprLayer(),
    ...getPpeLayer(),
    ...getAacLayer(),
    ...getCommunesLayer(),
    ...getSageLayer(),
    ...getParcellesLayers(),
  ] as LayerSpecification[]

type VisibilityRule = {
  layers: string[]
  isVisible: (state: MapDesiredState) => boolean
}

/** Single declaration site for the visibility rules driven by the sidebar checkboxes. */
const LAYER_VISIBILITY_RULES: VisibilityRule[] = [
  { layers: ['ppr-fill', 'ppr-outline'], isVisible: (state) => state.showPpr },
  { layers: ['ppe-fill', 'ppe-outline'], isVisible: (state) => state.showPpe },
  { layers: ['aac-fill', 'aac-outline'], isVisible: (state) => state.showAac },
  { layers: ['communes-outline'], isVisible: (state) => state.showCommunes },
  { layers: ['sage-fill', 'sage-outline'], isVisible: (state) => state.showSage },
  {
    layers: ['parcelles-fill', 'parcelles-outline'],
    isVisible: (state) => state.showParcelles && !state.showBioOnly,
  },
]

const getAnchorLayerId = (map: maplibre.Map): string | undefined =>
  map.getLayer(BASEMAP_ANCHOR_LAYER_ID) ? BASEMAP_ANCHOR_LAYER_ID : undefined

/**
 * Drops the `parcelles` source and its layers when the millesime it was built for no
 * longer matches the desired one, so that the following steps recreate them.
 * Returns `true` when the source was dropped.
 */
const syncParcellesSource = (map: maplibre.Map, state: MapDesiredState): boolean => {
  const source = map.getSource(PARCELLES_SOURCE_ID)

  if (!source) {
    return false
  }

  const expectedUrl = getParcellesSource({
    pmtilesUrl: state.pmtilesUrl,
    millesime: state.millesime,
  }).url

  if ('url' in source && source.url === expectedUrl) {
    return false
  }

  for (const layerId of PARCELLES_LAYER_IDS) {
    if (map.getLayer(layerId)) {
      map.removeLayer(layerId)
    }
  }

  map.removeSource(PARCELLES_SOURCE_ID)

  return true
}

/**
 * Adds the missing sources. Returns `true` when the `parcelles` source had to be
 * (re)created, meaning MapLibre dropped the feature states that were attached to it.
 */
const ensureSources = (map: maplibre.Map, state: MapDesiredState): boolean => {
  let parcellesSourceCreated = false

  for (const { id, build } of SOURCE_DEFINITIONS) {
    if (map.getSource(id)) {
      continue
    }

    map.addSource(id, build(state))
    parcellesSourceCreated ||= id === PARCELLES_SOURCE_ID
  }

  return parcellesSourceCreated
}

/**
 * Adds the missing layers and restores their declared order relative to the basemap.
 * Layers whose source is not available in the current style are skipped, and the layers
 * are only moved when their current order deviates from the declared one.
 */
const ensureLayers = (map: maplibre.Map) => {
  const anchorLayerId = getAnchorLayerId(map)

  const managedLayers = getLayerDefinitions().filter((layer) => {
    const sourceId = 'source' in layer ? layer.source : undefined
    return typeof sourceId !== 'string' || Boolean(map.getSource(sourceId))
  })

  for (const layer of managedLayers) {
    if (!map.getLayer(layer.id)) {
      map.addLayer(layer as AddLayerObject, anchorLayerId)
    }
  }

  if (isLayerOrderCorrect(map, managedLayers, anchorLayerId)) {
    return
  }

  for (const layer of managedLayers) {
    map.moveLayer(layer.id, anchorLayerId)
  }
}

const isLayerOrderCorrect = (
  map: maplibre.Map,
  managedLayers: LayerSpecification[],
  anchorLayerId: string | undefined
) => {
  const positions = new Map(map.getLayersOrder().map((layerId, index) => [layerId, index]))
  const anchorPosition = anchorLayerId ? positions.get(anchorLayerId) : undefined

  let previousPosition = -1

  for (const layer of managedLayers) {
    const position = positions.get(layer.id)

    if (position === undefined || position < previousPosition) {
      return false
    }

    if (anchorPosition !== undefined && position > anchorPosition) {
      return false
    }

    previousPosition = position
  }

  return true
}

const setVisibility = (map: maplibre.Map, layerIds: string[], visible: boolean) => {
  for (const layerId of layerIds) {
    if (map.getLayer(layerId)) {
      map.setLayoutProperty(layerId, 'visibility', visible ? 'visible' : 'none')
    }
  }
}

const applyLayerVisibility = (map: maplibre.Map, state: MapDesiredState) => {
  for (const { layers, isVisible } of LAYER_VISIBILITY_RULES) {
    setVisibility(map, layers, isVisible(state))
  }
}

/**
 * The bio layers stay in the style even when hidden: they are kept transparent so that
 * `queryRenderedFeatures` can still detect bio parcelles under the cursor.
 */
const applyBioPresentation = (map: maplibre.Map, state: MapDesiredState) => {
  if (map.getLayer('parcellesbio-fill')) {
    map.setPaintProperty(
      'parcellesbio-fill',
      'fill-opacity',
      state.showBioOnly ? BIO_FILL_OPACITY : 0
    )
  }

  if (map.getLayer('parcellesbio-outline')) {
    map.setPaintProperty('parcellesbio-outline', 'line-opacity', state.showBioOnly ? 1 : 0)
  }
}

const applyCultureFilter = (map: maplibre.Map, state: MapDesiredState) => {
  const filter: FilterSpecification =
    state.visibleCultures.length === 0
      ? ['==', ['get', 'id_parcel'], '']
      : [
          'in',
          ['to-number', ['get', 'code_group']],
          ['literal', state.visibleCultures.map((code) => Number.parseInt(code, 10))],
        ]

  for (const layerId of PARCELLES_LAYER_IDS) {
    if (map.getLayer(layerId)) {
      map.setFilter(layerId, filter)
    }
  }
}

const areParcellesLayersReady = (map: maplibre.Map) =>
  Boolean(
    map.getSource(PARCELLES_SOURCE_ID) &&
    map.getLayer('parcelles-fill') &&
    map.getLayer('parcelles-outline')
  )

const setFeatureStates = (
  map: maplibre.Map,
  parcelleIds: string[],
  state: { highlighted?: boolean; unavailable?: boolean }
) => {
  for (const id of parcelleIds) {
    map.setFeatureState({ source: PARCELLES_SOURCE_ID, sourceLayer: 'parcelles', id }, state)
  }
}

/**
 * Applies the desired feature states and clears the ones that were applied previously
 * but are no longer desired. `previous` must be empty when the source has just been
 * recreated, since MapLibre drops the feature states along with the source.
 */
const applyParcelleFeatureStates = (
  map: maplibre.Map,
  state: MapDesiredState,
  previous: AppliedFeatureStates
): AppliedFeatureStates => {
  if (!areParcellesLayersReady(map)) {
    return previous
  }

  const staleHighlighted = previous.highlighted.filter(
    (id) => !state.highlightedParcelleIds.includes(id)
  )
  const staleUnavailable = previous.unavailable.filter(
    (id) => !state.unavailableParcelleIds.includes(id)
  )

  setFeatureStates(map, staleHighlighted, { highlighted: false })
  setFeatureStates(map, staleUnavailable, { unavailable: false })
  setFeatureStates(map, state.highlightedParcelleIds, { highlighted: true })
  setFeatureStates(map, state.unavailableParcelleIds, { unavailable: true })

  return {
    highlighted: [...state.highlightedParcelleIds],
    unavailable: [...state.unavailableParcelleIds],
  }
}

const isParcellesSourceLoaded = (map: maplibre.Map) => {
  if (!map.getSource(PARCELLES_SOURCE_ID)) {
    return false
  }

  try {
    return map.isSourceLoaded(PARCELLES_SOURCE_ID)
  } catch {
    return false
  }
}

export type ReconcileResult = {
  /** `true` when the `parcelles` tiles are not available yet, so the pass must be replayed. */
  parcellesSourcePending: boolean
  /** Feature states now applied to the map, to be passed back on the next reconciliation. */
  appliedFeatureStates: AppliedFeatureStates
}

/**
 * Brings the map in line with the desired state: sources, layers, layer order, layer
 * visibility, culture filter, bio presentation and parcelle feature states.
 *
 * The function is idempotent and is the only place where the map is configured. It must
 * be called after the map has loaded, after every `style.load` and whenever the desired
 * state changes.
 */
export const reconcileMap = (
  map: maplibre.Map,
  state: MapDesiredState,
  previousFeatureStates: AppliedFeatureStates = EMPTY_FEATURE_STATES
): ReconcileResult => {
  // Feature states are dropped along with the source they belong to, whether the source
  // was replaced because of a millesime change or wiped by a basemap change.
  syncParcellesSource(map, state)

  const parcellesSourceCreated = ensureSources(map, state)

  ensureLayers(map)
  applyLayerVisibility(map, state)
  applyBioPresentation(map, state)
  applyCultureFilter(map, state)

  const appliedFeatureStates = applyParcelleFeatureStates(
    map,
    state,
    parcellesSourceCreated ? EMPTY_FEATURE_STATES : previousFeatureStates
  )

  return { parcellesSourcePending: !isParcellesSourceLoaded(map), appliedFeatureStates }
}

/** Re-applies the parcelles state once the source tiles are available. */
export const reapplyParcellesSourceState = (
  map: maplibre.Map,
  state: MapDesiredState,
  previousFeatureStates: AppliedFeatureStates = EMPTY_FEATURE_STATES
): AppliedFeatureStates => {
  applyCultureFilter(map, state)
  applyBioPresentation(map, state)

  return applyParcelleFeatureStates(map, state, previousFeatureStates)
}
