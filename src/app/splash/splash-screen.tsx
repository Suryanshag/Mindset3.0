'use client'

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import Image from 'next/image'

interface SplashScreenProps {
  targetUrl: string
}

// Animation duration aligns with the handoff Splash spec (2.2 s).
const PWA_ANIMATION_MS = 2200

// Detect PWA cold launch via two independent signals — either is sufficient:
//   (a) manifest's `start_url` appended `?source=pwa` (most reliable; works
//       even when display-mode hasn't propagated yet at navigation time).
//   (b) `display-mode: standalone` media query matches now.
function isPwaLaunch(searchParams: URLSearchParams): boolean {
  if (typeof window === 'undefined') return false
  if (searchParams.get('source') === 'pwa') return true
  if (window.matchMedia('(display-mode: standalone)').matches) return true
  // iOS Safari uses navigator.standalone instead.
  if ((navigator as unknown as { standalone?: boolean }).standalone) return true
  return false
}

export default function SplashScreen({ targetUrl }: SplashScreenProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [animating, setAnimating] = useState(false)

  useEffect(() => {
    const isPwa = isPwaLaunch(new URLSearchParams(searchParams?.toString() ?? ''))

    if (!isPwa) {
      // Browser visit / deep link — instant redirect, no animation. Replace()
      // so the back button doesn't drop the user back onto /splash.
      router.replace(targetUrl)
      return
    }

    setAnimating(true)
    const t = setTimeout(() => {
      router.replace(targetUrl)
    }, PWA_ANIMATION_MS)

    return () => clearTimeout(t)
  }, [router, searchParams, targetUrl])

  // Render the animated brand surface only when we know we're animating.
  // Pre-animation flash is avoided by keeping the markup empty until the
  // useEffect resolves the launch source.
  if (!animating) {
    return (
      <div
        aria-hidden="true"
        style={{ background: 'var(--primary)', minHeight: '100vh' }}
      />
    )
  }

  return (
    <main
      role="status"
      aria-label="Loading Mindset"
      className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden"
      style={{
        background: 'var(--primary)',
        color: 'var(--on-dark)',
      }}
    >
      {/* Decorative blobs — top-right + bottom-left, slow float. Cream
          and accent tints to evoke warmth without competing with the
          brand mark. Marked aria-hidden; pure visual. */}
      <span
        aria-hidden="true"
        className="absolute pointer-events-none rounded-full"
        style={{
          width: 260,
          height: 260,
          background: 'radial-gradient(circle, rgba(255,248,235,0.10), transparent 70%)',
          right: -60,
          top: -80,
          animation: 'ms-float-a 12s ease-in-out infinite',
        }}
      />
      <span
        aria-hidden="true"
        className="absolute pointer-events-none rounded-full"
        style={{
          width: 220,
          height: 220,
          background: 'radial-gradient(circle, rgba(201,120,100,0.20), transparent 70%)',
          left: -50,
          bottom: -60,
          animation: 'ms-float-b 14s ease-in-out infinite',
        }}
      />

      {/* Brand mark + wordmark + tagline. Logo stays still per
          Mobile-Polish-1; the outer scale-in is the only motion on the
          mark itself. The float blobs + progress hairline give the
          surface motion without the user-reported rotating-icon issue. */}
      <div
        style={{
          animation: 'ms-mark-in 1.1s cubic-bezier(.2,.8,.2,1) both',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Image
          src="/icons/icon-192.png"
          alt=""
          width={92}
          height={92}
          priority
          aria-hidden="true"
          style={{
            borderRadius: 28,
            filter: 'drop-shadow(0 8px 24px rgba(0,0,0,0.18))',
          }}
        />
        <div
          className="mt-5"
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 44,
            letterSpacing: '0.01em',
            animation: 'ms-fade-up .9s .35s both',
            color: 'var(--on-dark)',
          }}
        >
          Mindset
        </div>
        <div
          className="mt-1.5"
          style={{
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
            fontSize: 15,
            opacity: 0.7,
            letterSpacing: '0.04em',
            animation: 'ms-fade-up .9s .55s both',
          }}
        >
          mental health, kept close
        </div>
      </div>

      {/* Progress hairline — a thin pulsing bar near the bottom. Same
          duration as the animation, loops a couple of times before redirect. */}
      <div
        aria-hidden="true"
        className="absolute"
        style={{
          bottom: 60,
          width: 120,
          height: 2,
          borderRadius: 2,
          background: 'rgba(255,248,235,0.15)',
          overflow: 'hidden',
        }}
      >
        <span
          className="block h-full"
          style={{
            width: '40%',
            background: 'var(--accent)',
            borderRadius: 2,
            animation: 'ms-load-bar 1.8s ease-in-out infinite',
          }}
        />
      </div>
    </main>
  )
}
