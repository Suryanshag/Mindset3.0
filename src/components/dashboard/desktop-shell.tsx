import { auth } from '@/lib/auth'
import { getSpineSessions } from '@/lib/queries/reflection'
import { getUserEngagementState } from '@/lib/queries/dashboard'
import DesktopContent from '@/components/dashboard/desktop-content'

export default async function DesktopShell({ children }: { children: React.ReactNode }) {
  const session = await auth()
  const userId = session?.user?.id

  const [spineSessions, engagementState] = await Promise.all([
    userId ? getSpineSessions(userId).catch(() => []) : Promise.resolve([]),
    userId ? getUserEngagementState(userId).catch(() => 'empty' as const) : Promise.resolve('empty' as const),
  ])

  return (
    <DesktopContent spineSessions={spineSessions} engagementState={engagementState}>
      {children}
    </DesktopContent>
  )
}
