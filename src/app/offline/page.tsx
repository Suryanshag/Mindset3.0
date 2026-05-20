import type { Metadata } from 'next'

// Static offline fallback served by the service worker when the network is
// unreachable AND the requested page isn't already cached. Plain server
// component, no data fetching — the SW caches this URL during install.

export const metadata: Metadata = {
  title: 'Offline',
  robots: { index: false, follow: false },
}

export default function OfflinePage() {
  return (
    <main
      className="min-h-screen flex items-center justify-center px-6"
      style={{ background: 'var(--bg-app)', color: 'var(--text)' }}
    >
      <div className="max-w-sm text-center">
        <h1
          className="text-3xl sm:text-4xl font-bold mb-3"
          style={{ fontFamily: 'var(--font-heading)', color: 'var(--primary)' }}
        >
          You&apos;re offline
        </h1>
        <p
          className="text-sm leading-relaxed mb-6"
          style={{ color: 'var(--text-muted)' }}
        >
          Your last reflections are still saved here. Reconnect to keep working
          — we&apos;ll pick up exactly where you left off.
        </p>
        <p
          className="text-xs"
          style={{ color: 'var(--text-faint)' }}
        >
          Tap or refresh once you&apos;re back online.
        </p>
      </div>
    </main>
  )
}
