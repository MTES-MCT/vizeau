import { useEffect, useRef, useState } from 'react'

type UseFetchResult<T> = {
  data: T | null
  loading: boolean
  error: string | null
}

/**
 * Generic fetch hook: fetches `url` (skipped when null), manages loading/error state,
 * cancels in-flight requests on cleanup, and calls `onSuccess` when data arrives.
 */
export function useFetch<T>(
  url: string | null,
  errorMessage: string,
  onSuccess?: (data: T) => void
): UseFetchResult<T> {
  const [data, setData] = useState<T | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Stable ref so onSuccess never causes the effect to re-run
  const onSuccessRef = useRef(onSuccess)
  useEffect(() => {
    onSuccessRef.current = onSuccess
  })

  useEffect(() => {
    if (url === null) return

    const controller = new AbortController()
    setLoading(true)
    setData(null)
    setError(null)

    fetch(url, { signal: controller.signal })
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        return res.json() as Promise<T>
      })
      .then((result) => {
        setData(result)
        onSuccessRef.current?.(result)
      })
      .catch((err) => {
        if (err.name !== 'AbortError') setError(errorMessage)
      })
      .finally(() => setLoading(false))

    return () => controller.abort()
  }, [url, errorMessage])

  return { data, loading, error }
}
