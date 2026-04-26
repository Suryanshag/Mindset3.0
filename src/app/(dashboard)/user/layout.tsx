import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import MobileShell from '@/components/dashboard/mobile-shell'
import DesktopShell from '@/components/dashboard/desktop-shell'

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

  return (
    <>
      {/* Mobile: below lg breakpoint */}
      <div className="lg:hidden">
        <MobileShell>{children}</MobileShell>
      </div>

      {/* Desktop: lg and above */}
      <div className="hidden lg:block">
        <DesktopShell>{children}</DesktopShell>
      </div>
    </>
  )
}
