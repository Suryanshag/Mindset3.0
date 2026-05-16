'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Coordinates UI updates when the user verifies their email.
 *
 * Three trigger paths covered:
 *
 *   1. Same-browser cross-tab (e.g. verify in tab B from email link
 *      on desktop, banner is in tab A): localStorage `storage` event.
 *      Fires `onSignal` — consumer knows verification happened.
 *
 *   2. Cross-device (verify on phone, banner is on desktop):
 *      `visibilitychange` event when desktop tab becomes visible
 *      again — we don't KNOW the user verified, but they may have,
 *      so we call router.refresh() to re-fetch server state. If they
 *      did verify, the layout's prisma query sees emailVerified set
 *      and the banner stops rendering naturally.
 *
 *   3. Same-tab post-verify navigation (verify in /verify-email tab,
 *      then click "Go to dashboard"): mount-time recent-signal check
 *      in case the storage event fired just before this hook mounted.
 *
 * onSignal is reserved for definitive verification events (#1 and #3).
 * Path #2 just refreshes silently — no onSignal call, no false positives.
 */
export const EMAIL_VERIFIED_STORAGE_KEY = 'mindset:email_verified_at'

export function useEmailVerifiedSignal(onSignal: () => void, recentMs = 60_000) {
  const router = useRouter()

  useEffect(() => {
    if (typeof window === 'undefined') return

    // Path 3: catch a signal that fired just before this hook mounted.
    try {
      const ts = window.localStorage.getItem(EMAIL_VERIFIED_STORAGE_KEY)
      if (ts) {
        const at = Number(ts)
        if (Number.isFinite(at) && Date.now() - at < recentMs) {
          onSignal()
        }
      }
    } catch {
      // localStorage can throw in private browsing or sandboxed iframes.
    }

    // Path 1: cross-tab storage event.
    function storageHandler(e: StorageEvent) {
      if (e.key === EMAIL_VERIFIED_STORAGE_KEY && e.newValue) {
        onSignal()
      }
    }
    window.addEventListener('storage', storageHandler)

    // Path 2: cross-device — tab regains focus after user did something
    // on another device (e.g. tapped the verify link on phone). We can't
    // know that they actually verified, so just refresh server state.
    // If they did, the next render won't render us anymore.
    function visibilityHandler() {
      if (document.visibilityState === 'visible') {
        router.refresh()
      }
    }
    document.addEventListener('visibilitychange', visibilityHandler)

    return () => {
      window.removeEventListener('storage', storageHandler)
      document.removeEventListener('visibilitychange', visibilityHandler)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [router])
}

/** Broadcast that the email was verified — call from /verify-email on success. */
export function broadcastEmailVerified(): void {
  try {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(EMAIL_VERIFIED_STORAGE_KEY, String(Date.now()))
    }
  } catch {
    // ignore
  }
}
