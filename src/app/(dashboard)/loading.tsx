// Mobile-Polish-1 T10. Dashboard-wide route transition loader.
// Renders during any /user, /doctor, /admin navigation segment that
// hasn't finished server-rendering — Next surfaces this via Suspense
// boundaries. A 3px primary-color top bar pulses across the viewport,
// modeled on YouTube/GitHub-style indeterminate progress.
//
// Deliberately NOT a full-page spinner: in-app navigation should feel
// instant; the bar communicates "I heard you, still working" without
// blanking the previous screen.

export default function DashboardLoading() {
  return (
    <div
      role="progressbar"
      aria-label="Loading"
      aria-busy="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        background: 'color-mix(in srgb, var(--primary) 18%, transparent)',
        overflow: 'hidden',
        zIndex: 9999,
        pointerEvents: 'none',
      }}
    >
      <span
        aria-hidden="true"
        style={{
          display: 'block',
          width: '40%',
          height: '100%',
          background: 'var(--primary)',
          animation: 'ms-route-loader 1.5s ease-in-out infinite',
        }}
      />
    </div>
  )
}
