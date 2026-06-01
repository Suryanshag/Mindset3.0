'use client'

import Spine from '@/components/dashboard/spine'
import VerifyEmailBanner from '@/components/auth/verify-email-banner'
import { BFooter } from '@/components/dashboard/desktop/b-atoms'
import { BShellProvider } from '@/components/dashboard/desktop/b-shell-context'
import type { SpineSession, SpineTherapist } from '@/lib/queries/reflection'
import type { EngagementState } from '@/lib/queries/dashboard'
import type { UpcomingItem } from '@/lib/queries/upcoming'

// Phase 1 — Desktop shell restructured to match Direction B:
// single wide main column (no right rail). The portaled rail content
// from `/user`, `/user/reflection/today`, and `/user/sessions/[id]`
// moves back inline into each page. `upcomingItems` stays in props so
// Phase 2's Today rebuild and any future per-page surfaces can consume
// it without re-fetching.

type Props = {
  spineSessions: SpineSession[]
  therapist: SpineTherapist | null
  engagementState: EngagementState
  upcomingItems: UpcomingItem[]
  unreadNotificationCount: number
  showVerifyBanner?: boolean
  children: React.ReactNode
}

export default function DesktopContent({
  spineSessions,
  therapist,
  engagementState,
  unreadNotificationCount,
  showVerifyBanner = false,
  children,
}: Props) {
  return (
    <div className="desktop-shell min-h-dvh">
      <Spine
        sessions={spineSessions}
        therapist={therapist}
        engagementState={engagementState}
        unreadNotificationCount={unreadNotificationCount}
      />

      <BShellProvider unreadCount={unreadNotificationCount}>
        <main className="bg-bg-app overflow-y-auto">
          {showVerifyBanner && (
            <div className="sticky top-0 z-20">
              <VerifyEmailBanner />
            </div>
          )}
          <div className="mx-auto max-w-[1056px] px-9 py-6 flex flex-col gap-[18px] min-h-dvh">
            {children}
            <div className="mt-auto">
              <BFooter />
            </div>
          </div>
        </main>
      </BShellProvider>
    </div>
  )
}
