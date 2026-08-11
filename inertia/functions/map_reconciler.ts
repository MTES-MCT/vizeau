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
const PARCELLES_SOURCE_LAYER = 'parcelles'

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
  /** Parcelles highlighted by the current selection or by the parcelle form. */
  highlightedParcelleIds: string[]
  /** Parcelles transiently highlighted, typically while an exploitation marker is hovered. */
  hoveredParcelleIds: string[]
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

type ManagedSource = {
  id: string
  build: (state: MapDesiredState) => maplibre.SourceSpecification
}

type ManagedLayer = {
  spec: LayerSpecification
  /** Layers without a rule stay visible; their presentation is driven by paint properties. */
  isVisible?: (state: MapDesiredState) => boolean
}

type MapOverlay = {
  /** Omitted when the overlay draws a source already provided by the basemap style. */
  source?: ManagedSource
  layers: ManagedLayer[]
}

const toManagedLayers = (
  specs: unknown[],
  isVisible?: (state: MapDesiredState) => boolean
): ManagedLayer[] => (specs as LayerSpecification[]).map((spec) => ({ spec, isVisible }))

const parcellesLayerSpecs = getParcellesLayers()
const isBioLayer = (spec: LayerSpecification) => spec.id.startsWith('parcellesbio')

/**
 * Single declaration site for every source and layer the map needs. The order of this list,
 * and of the layers inside each overlay, is also the stacking order, from bottom to top.
 */
const MAP_OVERLAYS: MapOverlay[] = [
  {
    source: { id: 'ppr', build: ({ pmtilesUrl }) => getPprSource({ pmtilesUrl }) },
    layers: toManagedLayers(getPprLayer(), (state) => state.showPpr),
  },
  {
    source: { id: 'ppe', build: ({ pmtilesUrl }) => getPpeSource({ pmtilesUrl }) },
    layers: toManagedLayers(getPpeLayer(), (state) => state.showPpe),
  },
  {
    source: { id: 'aac', build: ({ pmtilesUrl }) => getAacSource({ pmtilesUrl }) },
    layers: toManagedLayers(getAacLayer(), (state) => state.showAac),
  },
  {
    // The communes outline is drawn from a source owned by the basemap style.
    layers: toManagedLayers(getCommunesLayer(), (state) => state.showCommunes),
  },
  {
    source: { id: 'sage', build: ({ pmtilesUrl }) => getSageSource({ pmtilesUrl }) },
    layers: toManagedLayers(getSageLayer(), (state) => state.showSage),
  },
  {
    source: {
      id: PARCELLES_SOURCE_ID,
      build: ({ pmtilesUrl, millesime }) => getParcellesSource({ pmtilesUrl, millesime }),
    },
    layers: [
      ...toManagedLayers(
        parcellesLayerSpecs.filter((spec) => !isBioLayer(spec)),
        (state) => state.showParcelles && !state.showBioOnly
      ),
      // The bio layers are never hidden: they are kept transparent so that
      // `queryRenderedFeatures` can still detect bio parcelles under the cursor.
      ...toManagedLayers(parcellesLayerSpecs.filter(isBioLayer)),
    ],
  },
]

const MANAGED_SOURCES: ManagedSource[] = MAP_OVERLAYS.flatMap((overlay) =>
  overlay.source ? [overlay.source] : []
)

/** Every managed layer, flattened in stacking order. */
const MANAGED_LAYERS: ManagedLayer[] = MAP_OVERLAYS.flatMap((overlay) => overlay.layers)

const getLayerSourceId = (spec: LayerSpecification): string | undefined =>
  'source' in spec && typeof spec.source === 'string' ? spec.source : undefined

const getLayerIdsOfSource = (sourceId: string): string[] =>
  MANAGED_LAYERS.filter(({ spec }) => getLayerSourceId(spec) === sourceId).map(
    ({ spec }) => spec.id
  )

/** Layers backed by the `parcelles` source, in stacking order. */
export const PARCELLES_LAYER_IDS = getLayerIdsOfSource(PARCELLES_SOURCE_ID)

const getAnchorLayerId = (map: maplibre.Map): string | undefined =>
  map.getLayer(BASEMAP_ANCHOR_LAYER_ID) ? BASEMAP_ANCHOR_LAYER_ID : undefined

/**
 * A source is outdated when the specification it was built from no longer matches the desired
 * state, typically after a millesime change or a pmtiles host change.
 */
const isSourceOutdated = (
  source: NonNullable<ReturnType<maplibre.Map['getSource']>>,
  spec: maplibre.SourceSpecification
): boolean => 'url' in spec && 'url' in source && source.url !== spec.url

const removeSource = (map: maplibre.Map, sourceId: string) => {
  for (const layerId of getLayerIdsOfSource(sourceId)) {
    if (map.getLayer(layerId)) {
      map.removeLayer(layerId)
    }
  }

  map.removeSource(sourceId)
}

/**
 * Adds the missing sources and recreates the outdated ones, dropping their layers along the way
 * so that the following steps rebuild them. Returns the ids of the sources that were (re)created,
 * since MapLibre drops the feature states attached to a source together with the source itself.
 */
const syncSources = (map: maplibre.Map, state: MapDesiredState): Set<string> => {
  const createdSourceIds = new Set<string>()

  for (const { id, build } of MANAGED_SOURCES) {
    const spec = build(state)
    const source = map.getSource(id)

    if (source && !isSourceOutdated(source, spec)) {
      continue
    }

    if (source) {
      removeSource(map, id)
    }

    map.addSource(id, spec)
    createdSourceIds.add(id)
  }

  return createdSourceIds
}

/**
 * Adds the missing layers and restores their declared order relative to the basemap.
 * Layers whose source is not available in the current style are skipped, and the layers
 * are only moved when their current order deviates from the declared one.
 */
const ensureLayers = (map: maplibre.Map) => {
  const anchorLayerId = getAnchorLayerId(map)

  const availableLayers = MANAGED_LAYERS.filter(({ spec }) => {
    const sourceId = getLayerSourceId(spec)
    return sourceId === undefined || Boolean(map.getSource(sourceId))
  })

  for (const { spec } of availableLayers) {
    if (!map.getLayer(spec.id)) {
      map.addLayer(spec as AddLayerObject, anchorLayerId)
    }
  }

  if (isLayerOrderCorrect(map, availableLayers, anchorLayerId)) {
    return
  }

  for (const { spec } of availableLayers) {
    map.moveLayer(spec.id, anchorLayerId)
  }
}

const isLayerOrderCorrect = (
  map: maplibre.Map,
  availableLayers: ManagedLayer[],
  anchorLayerId: string | undefined
) => {
  const positions = new Map(map.getLayersOrder().map((layerId, index) => [layerId, index]))
  const anchorPosition = anchorLayerId ? positions.get(anchorLayerId) : undefined

  let previousPosition = -1

  for (const { spec } of availableLayers) {
    const position = positions.get(spec.id)

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

const applyLayerVisibility = (map: maplibre.Map, state: MapDesiredState) => {
  for (const { spec, isVisible } of MANAGED_LAYERS) {
    if (!isVisible || !map.getLayer(spec.id)) {
      continue
    }

    map.setLayoutProperty(spec.id, 'visibility', isVisible(state) ? 'visible' : 'none')
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
    map.setFeatureState(
      { source: PARCELLES_SOURCE_ID, sourceLayer: PARCELLES_SOURCE_LAYER, id },
      state
    )
  }
}

const dedupe = (ids: string[]): string[] => [...new Set(ids)]

/** Selection and hover are both rendered through the `highlighted` feature state. */
const getHighlightedParcelleIds = (state: MapDesiredState): string[] =>
  dedupe([...state.highlightedParcelleIds, ...state.hoveredParcelleIds])

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

  const highlighted = getHighlightedParcelleIds(state)
  const unavailable = dedupe(state.unavailableParcelleIds)

  const staleHighlighted = previous.highlighted.filter((id) => !highlighted.includes(id))
  const staleUnavailable = previous.unavailable.filter((id) => !unavailable.includes(id))

  setFeatureStates(map, staleHighlighted, { highlighted: false })
  setFeatureStates(map, staleUnavailable, { unavailable: false })
  setFeatureStates(map, highlighted, { highlighted: true })
  setFeatureStates(map, unavailable, { unavailable: true })

  return { highlighted, unavailable }
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
  // Feature states are dropped along with the source they belong to, whether the source was
  // replaced because it went out of date or wiped by a basemap change.
  const createdSourceIds = syncSources(map, state)

  ensureLayers(map)
  applyLayerVisibility(map, state)
  applyBioPresentation(map, state)
  applyCultureFilter(map, state)

  const appliedFeatureStates = applyParcelleFeatureStates(
    map,
    state,
    createdSourceIds.has(PARCELLES_SOURCE_ID) ? EMPTY_FEATURE_STATES : previousFeatureStates
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

const serializeIds = (ids: string[]): string => dedupe(ids).sort().join(',')

/**
 * Deterministic representation of the desired state, so that callers rebuilding the arrays on
 * every render do not trigger a reconciliation when nothing actually changed.
 */
export const getDesiredStateKey = (state: MapDesiredState): string =>
  [
    state.pmtilesUrl,
    state.millesime,
    [
      state.showParcelles,
      state.showAac,
      state.showPpe,
      state.showPpr,
      state.showCommunes,
      state.showSage,
      state.showBioOnly,
    ]
      .map(Number)
      .join(''),
    serializeIds(state.visibleCultures),
    serializeIds(getHighlightedParcelleIds(state)),
    serializeIds(state.unavailableParcelleIds),
  ].join('|')
