import { auth } from '@/lib/auth'
import { getSpineSessions } from '@/lib/queries/reflection'
import { getUserEngagementState } from '@/lib/queries/dashboard'
import { getUpcomingItems } from '@/lib/queries/upcoming'
import DesktopContent from '@/components/dashboard/desktop-content'

export default async function DesktopShell({ children }: { children: React.ReactNode }) {
  const session = await auth()
  const userId = session?.user?.id

  const [spineSessions, engagementState, upcomingItems] = await Promise.all([
    userId ? getSpineSessions(userId).catch(() => []) : Promise.resolve([]),
    userId
      ? getUserEngagementState(userId).catch(() => 'empty' as const)
      : Promise.resolve('empty' as const),
    userId ? getUpcomingItems(userId).catch(() => []) : Promise.resolve([]),
  ])

  return (
    <DesktopContent
      spineSessions={spineSessions}
      engagementState={engagementState}
      upcomingItems={upcomingItems}
    >
      {children}
    </DesktopContent>
  )
}
