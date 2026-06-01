import { auth } from '@/lib/auth'
import { getSpineSessions, getSpineTherapist } from '@/lib/queries/reflection'
import { getUserEngagementState, getUnreadNotificationCount } from '@/lib/queries/dashboard'
import { getUpcomingItems } from '@/lib/queries/upcoming'
import DesktopContent from '@/components/dashboard/desktop-content'

type Props = {
  children: React.ReactNode
  showVerifyBanner?: boolean
}

export default async function DesktopShell({ children, showVerifyBanner = false }: Props) {
  const session = await auth()
  const userId = session?.user?.id

  // upcomingItems is still fetched in case any non-/user route wants the
  // data; the right rail that consumed it on /user is gone after Phase 1,
  // but ComingUpRail content moves inline into the rebuilt Today (Phase 2)
  // and per-page contexts (Phase 3), still off the same query.
  const [spineSessions, therapist, engagementState, upcomingItems, unreadNotificationCount] =
    await Promise.all([
      userId ? getSpineSessions(userId).catch(() => []) : Promise.resolve([]),
      userId ? getSpineTherapist(userId).catch(() => null) : Promise.resolve(null),
      userId
        ? getUserEngagementState(userId).catch(() => 'empty' as const)
        : Promise.resolve('empty' as const),
      userId ? getUpcomingItems(userId).catch(() => []) : Promise.resolve([]),
      userId ? getUnreadNotificationCount(userId).catch(() => 0) : Promise.resolve(0),
    ])

  return (
    <DesktopContent
      spineSessions={spineSessions}
      therapist={therapist}
      engagementState={engagementState}
      upcomingItems={upcomingItems}
      unreadNotificationCount={unreadNotificationCount}
      showVerifyBanner={showVerifyBanner}
    >
      {children}
    </DesktopContent>
  )
}
