import { auth } from '@/lib/auth'
import { getSpineSessions } from '@/lib/queries/reflection'
import Spine from '@/components/dashboard/spine'
import DesktopContent from '@/components/dashboard/desktop-content'

export default async function DesktopShell({ children }: { children: React.ReactNode }) {
  const session = await auth()
  const userId = session?.user?.id

  const spineSessions = userId
    ? await getSpineSessions(userId).catch(() => [])
    : []

  return (
    <DesktopContent spineSessions={spineSessions}>
      {children}
    </DesktopContent>
  )
}
