'use client'

import { usePathname } from 'next/navigation'
import Spine from '@/components/dashboard/spine'
import ComingUpRail from '@/components/dashboard/desktop/coming-up-rail'
import VerifyEmailBanner from '@/components/auth/verify-email-banner'
import type { SpineSession } from '@/lib/queries/reflection'
import type { EngagementState } from '@/lib/queries/dashboard'
import type { UpcomingItem } from '@/lib/queries/upcoming'

type Props = {
  spineSessions: SpineSession[]
  engagementState: EngagementState
  upcomingItems: UpcomingItem[]
  unreadNotificationCount: number
  showVerifyBanner?: boolean
  children: React.ReactNode
}

// Routes where the rail is force-hidden regardless of items (focus mode).
const HIDE_RAIL_EXACT = [
  '/user/cart',
  '/user/practice/journal/new',
]

const HIDE_RAIL_PREFIX = [
  '/user/profile', // /user/profile and /user/profile/anything
]

const HIDE_RAIL_REGEX = [
  /^\/user\/practice\/journal\/[^/]+\/edit$/,
  /^\/user\/shop\/[^/]+$/,
  /^\/user\/orders\/[^/]+$/,
]

// Routes that benefit from a wider main column at large viewports —
// list/grid pages that would otherwise drift to the left at 1920px+
// or have visible content imbalance (cart, orders, notifications all
// hide the rail too, so the freed space goes to a wider container).
const WIDE_MAIN_EXACT = ['/user/cart', '/user/orders', '/user/notifications']

export default function DesktopContent({
  spineSessions,
  engagementState,
  upcomingItems,
  unreadNotificationCount,
  showVerifyBanner = false,
  children,
}: Props) {
  const pathname = usePathname() ?? ''

  const forceHideRail =
    HIDE_RAIL_EXACT.includes(pathname) ||
    HIDE_RAIL_PREFIX.some((p) => pathname.startsWith(p)) ||
    HIDE_RAIL_REGEX.some((r) => r.test(pathname))

  // First-steps fallback only on /user home for the empty engagement state.
  const showFirstStepsFallback =
    pathname === '/user' && engagementState === 'empty'

  // Rail shows if not forced hidden AND we have either items OR the first-steps fallback.
  const showRail =
    !forceHideRail && (upcomingItems.length > 0 || showFirstStepsFallback)

  const mainMaxWidthCls = WIDE_MAIN_EXACT.includes(pathname)
    ? 'max-w-[1200px]'
    : 'max-w-[720px]'

  return (
    <div className={`desktop-shell min-h-dvh ${showRail ? 'with-rail' : 'no-rail'}`}>
      <Spine
        sessions={spineSessions}
        engagementState={engagementState}
        unreadNotificationCount={unreadNotificationCount}
      />

      <main className="bg-bg-app overflow-y-auto">
        {showVerifyBanner && (
          <div className="sticky top-0 z-20">
            <VerifyEmailBanner />
          </div>
        )}
        <div className={`mx-auto ${mainMaxWidthCls} px-8 py-8`}>{children}</div>
      </main>

      {showRail && (
        <aside
          className="desktop-rail bg-bg-rail overflow-y-auto"
          style={{ borderLeft: '1px solid var(--color-border)' }}
        >
          <div className="p-6 space-y-6">
            {/*
              Per-route rail slot. Pages can inject route-specific content
              here via <RailPortal> (e.g. SessionRail on /user/sessions/[id]).
              When nothing is injected, this is an empty 0-height div and
              ComingUpRail renders alone.
            */}
            <div id="desktop-rail-content" />
            <ComingUpRail items={upcomingItems} />
          </div>
        </aside>
      )}
    </div>
  )
}
