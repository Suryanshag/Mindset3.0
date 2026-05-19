import { auth } from '@/lib/auth'
import { getSpineSessions } from '@/lib/queries/reflection'
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

  const [spineSessions, engagementState, upcomingItems, unreadNotificationCount] = await Promise.all([
    userId ? getSpineSessions(userId).catch(() => []) : Promise.resolve([]),
    userId
      ? getUserEngagementState(userId).catch(() => 'empty' as const)
      : Promise.resolve('empty' as const),
    userId ? getUpcomingItems(userId).catch(() => []) : Promise.resolve([]),
    userId ? getUnreadNotificationCount(userId).catch(() => 0) : Promise.resolve(0),
  ])

  return (
    <DesktopContent
      spineSessions={spineSessions}
      engagementState={engagementState}
      upcomingItems={upcomingItems}
      unreadNotificationCount={unreadNotificationCount}
      showVerifyBanner={showVerifyBanner}
    >
      {children}
    </DesktopContent>
  )
}
