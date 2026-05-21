import BottomNav from '@/components/dashboard/bottom-nav'
import MobileHeader from '@/components/mobile/header'
import PostSessionInterstitial from '@/components/mobile/post-session'
import { getPendingPostSession } from '@/lib/queries/post-session'
import { headers } from 'next/headers'

// MobileShell ports two opt-outs via CSS :has() against data attributes.
// Modern Chrome/Safari (the only browsers we ship to in TWA + iOS PWA)
// support :has() natively.
//
// `data-mobile-fullbleed` — page renders edge-to-edge; shell drops its
// left/right/top padding. See globals.css §mobile-shell-fullbleed.
//
// `data-no-mobile-header` — page renders its own header (or no header
// at all). Default is shell-rendered MobileHeader for SOS visibility
// across every authenticated route. See globals.css §mobile-shell-noheader.
//
// Pages currently opting out of the shell header:
//   /user        — three engagement states render their own header
//                  with state-specific bell visibility
//   /user/sos    — back-button chrome instead of full header
//
// Phase 3 — Post-session interstitial: if the user has any ended
// session without a SessionFollowup row, the shell auto-renders the
// post-session interstitial INSTEAD of the requested page. Skipped on
// /user/sos because crisis users shouldn't be diverted by a follow-up.

type MobileShellProps = {
  children: React.ReactNode
  name: string
  unreadCount?: number
  userId: string
}

const POST_SESSION_SKIP_PREFIXES = [
  '/user/sos',
]

function shouldSkipPostSessionForPath(pathname: string): boolean {
  return POST_SESSION_SKIP_PREFIXES.some((p) => pathname.startsWith(p))
}

export default async function MobileShell({
  children,
  name,
  unreadCount = 0,
  userId,
}: MobileShellProps) {
  const h = await headers()
  // x-pathname is set by middleware/proxy in many Next setups; fall
  // back to a sentinel that never matches the skip list so the default
  // is "show interstitial when pending". Per-request safe.
  const pathname = h.get('x-pathname') ?? ''
  const skipInterstitial = shouldSkipPostSessionForPath(pathname)

  // Best-effort: a DB failure here should never block the page. We
  // catch and treat as "no pending" so the page renders normally.
  const pending = skipInterstitial
    ? null
    : await getPendingPostSession(userId).catch(() => null)

  return (
    <div className="min-h-dvh bg-bg-app">
      {/* Safe-area top spacer */}
      <div style={{ height: 'env(safe-area-inset-top)' }} />

      {pending ? (
        // Interstitial takes over the entire viewport. No header, no
        // bottom nav, no children — the user finishes the followup
        // first, then router.push routes them on.
        <PostSessionInterstitial
          sessionId={pending.id}
          doctorName={pending.doctor.user.name}
          doctorId={pending.doctorId}
          doctorPhoto={pending.doctor.photo}
          sessionDate={pending.date.toISOString()}
        />
      ) : (
        <>
          {/* Default MobileHeader. The CSS rule in globals.css hides
              this on pages that include a `data-no-mobile-header`
              element. */}
          <div className="mobile-shell-header">
            <MobileHeader name={name} unreadCount={unreadCount} />
          </div>

          <main className="mobile-shell-main px-4 pb-24 pt-4">
            {children}
          </main>

          <BottomNav />
        </>
      )}
    </div>
  )
}
