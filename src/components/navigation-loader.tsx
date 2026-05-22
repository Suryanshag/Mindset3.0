'use client'

// Mobile-Polish-3 — Global navigation loader for client-side route
// transitions within the dashboard. Route-level loading.tsx fires for
// the cold-start case (e.g. login → /user) but NOT for in-segment
// navigations like /user → /user/practice — the segment is already
// rendered, so Next.js skips the Suspense boundary.
//
// Pattern: a Client Component subscribed to usePathname() that
// briefly shows a top-bar pulse on every path change. The 600ms
// auto-hide timer covers slow transitions (visible) and fast ones
// (clears cleanly). Coexists with src/app/(dashboard)/loading.tsx —
// both loaders serve different navigation cases.
//
// Why not router events? Next 16 App Router doesn't expose
// `router.events.routeChangeStart/Complete` (those were Pages Router).
// Intercepting Link clicks is fragile across <a>, <Link>,
// router.push(), and form submissions. usePathname() + useEffect is
// the simplest pattern that catches every actual navigation.

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'

export default function NavigationLoader() {
  const pathname = usePathname()
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    setIsLoading(true)
    const timer = setTimeout(() => setIsLoading(false), 600)
    return () => clearTimeout(timer)
  }, [pathname])

  if (!isLoading) return null

  return (
    <div
      aria-hidden="true"
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        height: 3,
        zIndex: 9999,
        pointerEvents: 'none',
        overflow: 'hidden',
        background: 'transparent',
      }}
    >
      <div
        style={{
          height: '100%',
          width: '40%',
          background: 'var(--primary)',
          animation: 'loadingBar 0.6s ease-out infinite',
          boxShadow: '0 0 8px var(--primary)',
        }}
      />
    </div>
  )
}
