'use client'

import { useEffect } from 'react'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error('[global-error]', error)
  }, [error])

  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.5rem',
          fontFamily:
            '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
          background: 'linear-gradient(180deg, #FFF8EB 0%, #CAF0F8 100%)',
          color: '#1E445C',
        }}
      >
        <div style={{ maxWidth: '32rem', textAlign: 'center' }}>
          <div
            aria-hidden
            style={{
              margin: '0 auto 2rem',
              width: '5rem',
              height: '5rem',
              borderRadius: '50%',
              background: 'rgba(249, 101, 83, 0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '2rem',
            }}
          >
            🌿
          </div>

          <p
            style={{
              fontSize: '0.75rem',
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: '#F96553',
              marginBottom: '1rem',
              fontWeight: 600,
            }}
          >
            Take a breath
          </p>

          <h1
            style={{
              fontSize: 'clamp(2rem, 6vw, 3rem)',
              fontWeight: 700,
              lineHeight: 1.15,
              marginBottom: '1rem',
            }}
          >
            We hit an unexpected wall.
          </h1>

          <p
            style={{
              fontSize: '1rem',
              lineHeight: 1.7,
              opacity: 0.8,
              marginBottom: '2rem',
            }}
          >
            The site couldn't recover this time. Try refreshing the page —
            and if it keeps happening, reach out and we'll look into it.
          </p>

          <button
            onClick={reset}
            style={{
              padding: '0.75rem 2rem',
              borderRadius: '999px',
              background: '#F96553',
              color: '#fff',
              border: 'none',
              fontWeight: 500,
              fontSize: '1rem',
              cursor: 'pointer',
            }}
          >
            Refresh
          </button>

          {error.digest && (
            <p
              style={{
                marginTop: '2rem',
                fontSize: '0.75rem',
                opacity: 0.4,
                fontFamily: 'monospace',
              }}
            >
              Reference: {error.digest}
            </p>
          )}
        </div>
      </body>
    </html>
  )
}
