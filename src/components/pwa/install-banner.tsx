'use client'

import { useEffect, useState } from 'react'
import { usePathname } from 'next/navigation'
import { Download, Share, X } from 'lucide-react'

// Routes where the install banner should NOT show. Auth, splash, onboarding,
// and the offline fallback are full-screen flows that the banner would
// visually clutter. Phase 1.3 adds /splash, /welcome, /onboarding; gating now.
const HIDDEN_PREFIXES = [
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
  '/verify-email',
  '/account-locked',
  '/splash',
  '/welcome',
  '/onboarding',
  '/offline',
] as const

const DISMISS_COOKIE = 'mindset_install_dismissed'
const DISMISS_DAYS = 30

type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function readDismissedCookie(): boolean {
  if (typeof document === 'undefined') return false
  return document.cookie.split('; ').some((c) => c.startsWith(`${DISMISS_COOKIE}=1`))
}

function writeDismissedCookie(): void {
  if (typeof document === 'undefined') return
  const maxAge = DISMISS_DAYS * 24 * 60 * 60
  document.cookie = `${DISMISS_COOKIE}=1; Max-Age=${maxAge}; Path=/; SameSite=Lax`
}

function isIosSafari(): boolean {
  if (typeof navigator === 'undefined') return false
  const ua = navigator.userAgent
  const isIos = /iPad|iPhone|iPod/.test(ua) && !(window as unknown as { MSStream?: unknown }).MSStream
  const isSafari = /Safari/.test(ua) && !/CriOS|FxiOS|EdgiOS/.test(ua)
  return isIos && isSafari
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false
  if (window.matchMedia('(display-mode: standalone)').matches) return true
  // iOS Safari uses navigator.standalone instead of the standard media query.
  if ((navigator as unknown as { standalone?: boolean }).standalone) return true
  return false
}

export default function InstallBanner() {
  const pathname = usePathname()

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [showIos, setShowIos] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [hydrated, setHydrated] = useState(false)

  useEffect(() => {
    setHydrated(true)

    if (readDismissedCookie()) {
      setDismissed(true)
      return
    }
    if (isStandalone()) {
      // Already installed — no banner.
      setDismissed(true)
      return
    }

    if (isIosSafari()) {
      setShowIos(true)
      return
    }

    const onBeforeInstall = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall)

    const onInstalled = () => {
      setDeferredPrompt(null)
      setDismissed(true)
    }
    window.addEventListener('appinstalled', onInstalled)

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall)
      window.removeEventListener('appinstalled', onInstalled)
    }
  }, [])

  const hiddenByRoute = HIDDEN_PREFIXES.some((p) => pathname?.startsWith(p))
  if (!hydrated || dismissed || hiddenByRoute) return null
  if (!deferredPrompt && !showIos) return null

  const handleInstall = async () => {
    if (!deferredPrompt) return
    try {
      await deferredPrompt.prompt()
      const result = await deferredPrompt.userChoice
      if (result.outcome === 'accepted') {
        setDismissed(true)
      } else {
        // User cancelled the OS prompt — don't write the 30-day cookie yet;
        // they may try again. But hide for this session.
        setDismissed(true)
      }
    } catch (err) {
      console.error('[InstallBanner] prompt failed', err)
      setDismissed(true)
    } finally {
      setDeferredPrompt(null)
    }
  }

  const handleDismiss = () => {
    writeDismissedCookie()
    setDismissed(true)
  }

  return (
    <div
      role="region"
      aria-label="Install Mindset"
      className="lg:hidden flex items-center gap-3 px-4 py-2.5"
      style={{
        background: 'var(--primary-tint)',
        borderBottom: '1px solid var(--border)',
        color: 'var(--primary)',
      }}
    >
      {showIos ? (
        <>
          <Share className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          <p className="text-xs sm:text-sm font-medium flex-1 leading-snug">
            Install Mindset: tap{' '}
            <span aria-label="share" className="inline-block align-middle">
              <Share className="w-3.5 h-3.5 inline" />
            </span>{' '}
            then <strong>Add to Home Screen</strong>.
          </p>
        </>
      ) : (
        <>
          <Download className="w-4 h-4 flex-shrink-0" aria-hidden="true" />
          <p className="text-xs sm:text-sm font-medium flex-1">
            Install Mindset for a faster, app-like experience.
          </p>
          <button
            type="button"
            onClick={handleInstall}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg transition-opacity hover:opacity-85"
            style={{ background: 'var(--primary)', color: 'var(--on-dark)' }}
          >
            Install
          </button>
        </>
      )}
      <button
        type="button"
        onClick={handleDismiss}
        aria-label="Dismiss install banner"
        className="p-1 rounded transition-opacity hover:opacity-70"
        style={{ color: 'var(--primary)' }}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  )
}
