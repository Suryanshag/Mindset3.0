import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { redirect } from 'next/navigation'
import MobileShell from '@/components/dashboard/mobile-shell'
import DesktopShell from '@/components/dashboard/desktop-shell'
import VerifyEmailBanner from '@/components/auth/verify-email-banner'

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

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { emailVerified: true },
  })
  const showVerifyBanner = !user?.emailVerified

  return (
    <>
      {showVerifyBanner && <VerifyEmailBanner />}
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
