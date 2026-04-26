import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import AdminSidebar from '@/components/dashboard/admin/sidebar'

const ROLE_HOME: Record<string, string> = {
  ADMIN: '/admin',
  DOCTOR: '/doctor',
  USER: '/user',
}

export default async function AdminDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const role = session.user.role as string
  if (role !== 'ADMIN') {
    redirect(ROLE_HOME[role] ?? '/')
  }

  return (
    <div className="flex min-h-screen">
      <AdminSidebar adminName={session.user.name ?? 'Admin'} />
      <main className="flex-1 p-6 pt-20 pb-24 lg:pt-8 lg:pb-8 lg:p-8" style={{ background: '#f8f9fa' }}>
        {children}
      </main>
    </div>
  )
}
