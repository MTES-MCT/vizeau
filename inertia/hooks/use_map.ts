import { useEffect, useRef, useState } from 'react'
import maplibre from 'maplibre-gl'

type MapOptions = Omit<maplibre.MapOptions, 'container'>

type UseMapResult = {
  /** Reactive map instance, suitable for effects that depend on map availability. */
  map: maplibre.Map | null
  /** Attach this ref to the element that hosts the map canvas. */
  mapContainerRef: React.RefObject<HTMLDivElement | null>
  /** Imperative map instance for event handlers and callbacks without triggering a render. */
  mapRef: React.RefObject<maplibre.Map | null>
}

/**
 * Creates a MapLibre map once its container is mounted and removes it on cleanup.
 *
 * Map options are read when the map is created; changing them later does not recreate the map.
 * Pass `null` to prevent map creation or remove an existing map. Use `map` for reactive
 * consumers and `mapRef` for imperative access. Initialization failures are re-thrown during
 * rendering and must be handled by a parent error boundary.
 */
export function useMap(
  /** Initial MapLibre options, excluding the container managed by the hook. */
  options: MapOptions | null,
  /** Called immediately after the map instance is created. */
  onMapCreated?: (map: maplibre.Map) => void
): UseMapResult {
  const mapContainerRef = useRef<HTMLDivElement | null>(null)
  const mapRef = useRef<maplibre.Map | null>(null)
  const optionsRef = useRef<MapOptions | null>(options)
  const onMapCreatedRef = useRef(onMapCreated)
  const [map, setMap] = useState<maplibre.Map | null>(null)
  const [initializationError, setInitializationError] = useState<Error | null>(null)
  const isEnabled = options !== null

  onMapCreatedRef.current = onMapCreated
  if (!mapRef.current && options) {
    optionsRef.current = options
  }

  if (initializationError) {
    throw initializationError
  }

  useEffect(() => {
    const container = mapContainerRef.current
    const mapOptions = optionsRef.current

    if (!options || !container || !mapOptions) {
      return
    }

    let mapInstance: maplibre.Map | null = null

    try {
      mapInstance = new maplibre.Map({
        ...mapOptions,
        container,
      })

      mapRef.current = mapInstance
      setMap(mapInstance)
      onMapCreatedRef.current?.(mapInstance)
    } catch (error) {
      mapInstance?.remove()
      if (mapRef.current === mapInstance) {
        mapRef.current = null
        setMap(null)
      }
      setInitializationError(
        error instanceof Error ? error : new Error('Unable to initialize the MapLibre map')
      )
      return
    }

    return () => {
      mapInstance.remove()
      if (mapRef.current === mapInstance) {
        mapRef.current = null
        setMap(null)
      }
    }
  }, [isEnabled])

  return { map, mapContainerRef, mapRef }
}
