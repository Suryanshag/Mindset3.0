'use client'

import { usePathname } from 'next/navigation'
import Spine from '@/components/dashboard/spine'
import ComingUpRail from '@/components/dashboard/desktop/coming-up-rail'
import type { SpineSession } from '@/lib/queries/reflection'
import type { EngagementState } from '@/lib/queries/dashboard'
import type { UpcomingItem } from '@/lib/queries/upcoming'

type Props = {
  spineSessions: SpineSession[]
  engagementState: EngagementState
  upcomingItems: UpcomingItem[]
  children: React.ReactNode
}

// Routes where the rail is force-hidden regardless of items (focus mode).
const HIDE_RAIL_ROUTES = new Set<string>([
  '/user/practice/journal/new',
])

const JOURNAL_EDIT_RE = /^\/user\/practice\/journal\/[^/]+\/edit$/

export default function DesktopContent({
  spineSessions,
  engagementState,
  upcomingItems,
  children,
}: Props) {
  const pathname = usePathname() ?? ''

  const forceHideRail =
    HIDE_RAIL_ROUTES.has(pathname) || JOURNAL_EDIT_RE.test(pathname)

  // First-steps fallback only on /user home for the empty engagement state.
  const showFirstStepsFallback =
    pathname === '/user' && engagementState === 'empty'

  // Rail shows if not forced hidden AND we have either items OR the first-steps fallback.
  const showRail =
    !forceHideRail && (upcomingItems.length > 0 || showFirstStepsFallback)

  return (
    <div className={`desktop-shell min-h-dvh ${showRail ? 'with-rail' : 'no-rail'}`}>
      <Spine sessions={spineSessions} engagementState={engagementState} />

      <main className="bg-bg-app overflow-y-auto">
        <div className="mx-auto max-w-[720px] px-8 py-8">{children}</div>
      </main>

      {showRail && (
        <aside
          className="desktop-rail bg-bg-app overflow-y-auto"
          style={{ borderLeft: '0.5px solid var(--color-border)' }}
        >
          <div className="p-6">
            <ComingUpRail
              items={upcomingItems}
              showFirstSteps={showFirstStepsFallback}
            />
          </div>
        </aside>
      )}
    </div>
  )
}
