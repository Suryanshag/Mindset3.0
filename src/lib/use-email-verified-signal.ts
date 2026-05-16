'use client'

import { useEffect } from 'react'

/**
 * localStorage key that /verify-email writes a timestamp into on success.
 * Other tabs (banner, booking page) listen via the `storage` event so they
 * can react without the user navigating or reloading.
 *
 * Why a separate signal instead of relying on revalidatePath alone:
 * revalidatePath busts the server cache, but the original tab where the
 * banner shows or where the "verify your email" error sits never re-fetches
 * unless it's the active document. Storage events fire across tabs in the
 * same origin, so this is the cleanest way to propagate.
 */
export const EMAIL_VERIFIED_STORAGE_KEY = 'mindset:email_verified_at'

/**
 * Subscribe to "this user just verified their email" signals from any tab.
 * Callback fires on:
 *   - cross-tab signal (storage event)
 *   - in-tab signal (also fires `storage` via the helper below, useful when
 *     verify happens in the same tab and we want consumers to react before
 *     the user navigates away)
 *
 * Also checks the current localStorage value on mount and fires once if a
 * very recent signal exists (within `recentMs`), handling the case where
 * the verify tab wrote the signal and then closed before this hook mounted.
 */
export function useEmailVerifiedSignal(onSignal: () => void, recentMs = 60_000) {
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Catch a signal that fired just before this hook mounted (e.g.
    // banner just rendered after the user landed on /user from /verify-email).
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

    function handler(e: StorageEvent) {
      if (e.key === EMAIL_VERIFIED_STORAGE_KEY && e.newValue) {
        onSignal()
      }
    }
    window.addEventListener('storage', handler)
    return () => window.removeEventListener('storage', handler)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])
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
