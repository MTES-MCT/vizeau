import { useEffect, useState } from 'react'
import { getCommuneNameFromCoords } from '~/lib/communes'

type Point = { x: number; y: number }

// Cache partagé entre les rendus : une parcelle n'est résolue qu'une fois par session.
// Un échec (null) n'y reste pas, pour qu'une coupure réseau passagère ne soit pas définitive.
const cache = new Map<string, Promise<string | null>>()

// L'API Géo limite le débit par IP : un gros PACAGE ne doit pas l'interroger d'un seul coup.
const MAX_CONCURRENT_REQUESTS = 5
let activeRequests = 0
const waitingRequests: Array<() => void> = []

async function withConcurrencyLimit<T>(task: () => Promise<T>): Promise<T> {
  if (activeRequests >= MAX_CONCURRENT_REQUESTS) {
    await new Promise<void>((resolve) => waitingRequests.push(resolve))
  }
  activeRequests += 1
  try {
    return await task()
  } finally {
    activeRequests -= 1
    waitingRequests.shift()?.()
  }
}

export function communePointKey({ x, y }: Point): string {
  return `${x},${y}`
}

/** Nom de la commune du point, mis en cache pour la session. */
export function resolveCommune(point: Point): Promise<string | null> {
  const key = communePointKey(point)
  let pending = cache.get(key)
  if (!pending) {
    pending = withConcurrencyLimit(() =>
      getCommuneNameFromCoords({ lat: point.y, lon: point.x })
    ).then((name) => {
      if (name === null) cache.delete(key)
      return name
    })
    cache.set(key, pending)
  }
  return pending
}

/**
 * Noms des communes des points fournis, indexés par `x,y`.
 * Une entrée absente signifie que la résolution est en cours, `null` qu'elle a échoué.
 */
export function useCommuneNames(points: Point[]): Record<string, string | null> {
  const [names, setNames] = useState<Record<string, string | null>>({})
  const keys = points.map(communePointKey).join('|')

  useEffect(() => {
    let cancelled = false
    for (const point of points) {
      resolveCommune(point).then((name) => {
        if (!cancelled) setNames((prev) => ({ ...prev, [communePointKey(point)]: name }))
      })
    }
    return () => {
      cancelled = true
    }
    // `keys` résume `points` : on ne relance pas pour un nouveau tableau aux mêmes valeurs.
  }, [keys])

  return names
}
