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
      {/* Mobile: below lg breakpoint — banner above shell */}
      <div className="lg:hidden">
        {showVerifyBanner && <VerifyEmailBanner />}
        <MobileShell>{children}</MobileShell>
      </div>

      {/* Desktop: lg and above — banner sits inside main column (handled by DesktopShell) */}
      <div className="hidden lg:block">
        <DesktopShell showVerifyBanner={showVerifyBanner}>{children}</DesktopShell>
      </div>
    </>
  )
}
