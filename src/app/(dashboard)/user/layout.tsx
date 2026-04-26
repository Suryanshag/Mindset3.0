import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import BottomNav from '@/components/dashboard/bottom-nav'

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
    <div className="min-h-dvh bg-bg-app lg:max-w-md lg:mx-auto lg:shadow-sm">
      {/* Safe-area top spacer */}
      <div style={{ height: 'env(safe-area-inset-top)' }} />

      <main className="px-4 pb-24 pt-4">
        {children}
      </main>

      <BottomNav />
    </div>
  )
}
