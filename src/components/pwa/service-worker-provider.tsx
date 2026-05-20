'use client'

import { useEffect } from 'react'

// Registers /sw.js on mount. Production-only — the dev server disables the
// SW to avoid clobbering HMR and serving stale builds during development.
// Renders nothing.
export default function ServiceWorkerProvider() {
  useEffect(() => {
    if (typeof window === 'undefined') return
    if (!('serviceWorker' in navigator)) return
    if (process.env.NODE_ENV !== 'production') return

    navigator.serviceWorker
      .register('/sw.js', { scope: '/', updateViaCache: 'none' })
      .catch((err) => {
        // Registration failures are non-fatal — the app works fine without a
        // SW; the user just won't get offline support.
        console.error('[SW] registration failed', err)
      })
  }, [])

  return null
}
