import { useCallback, useEffect, useMemo, useRef } from 'react'
import type maplibre from 'maplibre-gl'
import {
  EMPTY_FEATURE_STATES,
  reapplyParcellesSourceState,
  reconcileMap,
  type AppliedFeatureStates,
  type MapDesiredState,
} from '~/functions/map_reconciler'

/**
 * Keeps the MapLibre map in line with the desired state through a single reconciliation
 * pass. The pass runs every time a style becomes ready (initial style and full style
 * reloads) and whenever the desired state changes, so no source, layer, visibility rule,
 * filter or feature state can be left stale.
 *
 * Returns the reconciliation callback: `map.setStyle()` applies a synchronous diff that
 * silently drops the layers and sources added on top of the basemap without emitting any
 * event, so its caller has to trigger the pass itself.
 */
export function useMapReconciler(
  mapRef: React.RefObject<maplibre.Map | null>,
  map: maplibre.Map | null,
  desiredState: MapDesiredState
) {
  const desiredStateRef = useRef(desiredState)
  const featureStatesRef = useRef<AppliedFeatureStates>(EMPTY_FEATURE_STATES)
  const pendingSourceListenerRef = useRef<((event: maplibre.MapSourceDataEvent) => void) | null>(
    null
  )
  // `map.isStyleLoaded()` stays false until every source of the style is loaded, which is
  // too late: the style can be configured as soon as its specification has been parsed.
  const isStyleReadyRef = useRef(false)

  desiredStateRef.current = desiredState

  const clearPendingSourceListener = useCallback(() => {
    const currentMap = mapRef.current
    const listener = pendingSourceListenerRef.current

    if (currentMap && listener) {
      currentMap.off('sourcedata', listener)
    }

    pendingSourceListenerRef.current = null
  }, [mapRef])

  const reconcile = useCallback(() => {
    const currentMap = mapRef.current

    if (!currentMap || !isStyleReadyRef.current) {
      return
    }

    clearPendingSourceListener()

    const { parcellesSourcePending, appliedFeatureStates } = reconcileMap(
      currentMap,
      desiredStateRef.current,
      featureStatesRef.current
    )

    featureStatesRef.current = appliedFeatureStates

    if (!parcellesSourcePending) {
      return
    }

    // The parcelles tiles are not available yet: replay the parcelles part of the pass
    // once they are, so no filter or feature state is left unapplied.
    const onSourceData = (event: maplibre.MapSourceDataEvent) => {
      if (event.sourceId !== 'parcelles' || !event.isSourceLoaded) {
        return
      }

      clearPendingSourceListener()
      featureStatesRef.current = reapplyParcellesSourceState(
        currentMap,
        desiredStateRef.current,
        featureStatesRef.current
      )
    }

    pendingSourceListenerRef.current = onSourceData
    currentMap.on('sourcedata', onSourceData)
  }, [clearPendingSourceListener, mapRef])

  useEffect(() => {
    if (!map) {
      return
    }

    const onStyleDataLoading = () => {
      // A new style is being loaded: it cannot be configured until it has been parsed.
      isStyleReadyRef.current = false
      clearPendingSourceListener()
    }

    const onStyleReady = () => {
      isStyleReadyRef.current = true
      reconcile()
    }

    map.on('styledataloading', onStyleDataLoading)
    map.on('style.load', onStyleReady)
    map.on('load', onStyleReady)

    // Catch up when the style was already parsed before this effect ran.
    if (map.getLayersOrder().length > 0) {
      onStyleReady()
    }

    return () => {
      map.off('styledataloading', onStyleDataLoading)
      map.off('style.load', onStyleReady)
      map.off('load', onStyleReady)
      clearPendingSourceListener()
    }
  }, [map, reconcile, clearPendingSourceListener])

  // The desired state is compared by value: callers may rebuild the arrays on every render.
  const desiredStateKey = useMemo(() => JSON.stringify(desiredState), [desiredState])

  useEffect(() => {
    reconcile()
  }, [reconcile, desiredStateKey])

  return reconcile
}
