import { auth } from '@/lib/auth'
import { getSpineSessions } from '@/lib/queries/reflection'
import { getUserEngagementState } from '@/lib/queries/dashboard'
import { getUpcomingItems } from '@/lib/queries/upcoming'
import DesktopContent from '@/components/dashboard/desktop-content'

type Props = {
  children: React.ReactNode
  showVerifyBanner?: boolean
}

export default async function DesktopShell({ children, showVerifyBanner = false }: Props) {
  // PERF-INVESTIGATION (temporary)
  const __t0 = Date.now()
  const session = await auth()
  const userId = session?.user?.id

  const __tQ = Date.now()
  const [spineSessions, engagementState, upcomingItems] = await Promise.all([
    userId ? getSpineSessions(userId).catch(() => []) : Promise.resolve([]),
    userId
      ? getUserEngagementState(userId).catch(() => 'empty' as const)
      : Promise.resolve('empty' as const),
    userId ? getUpcomingItems(userId).catch(() => []) : Promise.resolve([]),
  ])
  console.log(`[PERF] DesktopShell Promise.all (3 helpers) ${Date.now() - __tQ}ms`)
  console.log(`[PERF] DesktopShell TOTAL ${Date.now() - __t0}ms`)

  return (
    <DesktopContent
      spineSessions={spineSessions}
      engagementState={engagementState}
      upcomingItems={upcomingItems}
      showVerifyBanner={showVerifyBanner}
    >
      {children}
    </DesktopContent>
  )
}
