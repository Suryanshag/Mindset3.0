import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import MobileShell from '@/components/dashboard/mobile-shell'
import DesktopShell from '@/components/dashboard/desktop-shell'
import VerifyEmailBanner from '@/components/auth/verify-email-banner'
import { getCurrentUserBasics } from '@/lib/queries/current-user'
import { getUnreadNotificationCount } from '@/lib/queries/dashboard'

const ROLE_HOME: Record<string, string> = {
  ADMIN: '/admin',
  DOCTOR: '/doctor',
  USER: '/user',
}

export default async function UserDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const role = session.user.role as string
  if (role !== 'USER' && role !== 'ADMIN') {
    redirect(ROLE_HOME[role] ?? '/')
  }

  const [user, unreadCount] = await Promise.all([
    getCurrentUserBasics(session.user.id),
    getUnreadNotificationCount(session.user.id).catch(() => 0),
  ])
  const showVerifyBanner = !user?.emailVerified
  const displayName = user?.name ?? session.user.name ?? 'there'

  return (
    <>
      {/* Mobile: below lg breakpoint — banner above shell */}
      <div className="lg:hidden">
        {showVerifyBanner && <VerifyEmailBanner />}
        <MobileShell
          name={displayName}
          unreadCount={unreadCount}
          userId={session.user.id}
        >
          {children}
        </MobileShell>
      </div>

      {/* Desktop: lg and above — banner sits inside main column (handled by DesktopShell) */}
      <div className="hidden lg:block">
        <DesktopShell showVerifyBanner={showVerifyBanner}>{children}</DesktopShell>
      </div>
    </>
  )
}
