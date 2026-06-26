import { useEffect } from 'react'

export function MatomoTrackerInjector() {
  useEffect(() => {
    const matomoUrl = import.meta.env.VITE_MATOMO_URL
    if (!matomoUrl) {
      console.warn('Matomo endpoint configuration is missing')
      return
    }

    const mtm = (window._mtm = window._mtm ?? [])
    mtm.push({ 'mtm.startTime': new Date().getTime(), 'event': 'mtm.Start' })

    const g = document.createElement('script')
    const s = document.getElementsByTagName('script')[0]
    g.async = true
    g.src = matomoUrl
    s.parentNode!.insertBefore(g, s)
  }, [])

  return null
}
