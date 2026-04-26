import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import DoctorSidebar from '@/components/dashboard/doctor/sidebar'

const ROLE_HOME: Record<string, string> = {
  ADMIN: '/admin',
  DOCTOR: '/doctor',
  USER: '/user',
}

export default async function DoctorDashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session?.user) {
    redirect('/login')
  }

  const role = session.user.role as string
  if (role !== 'DOCTOR' && role !== 'ADMIN') {
    redirect(ROLE_HOME[role] ?? '/')
  }

  return (
    <div className="flex min-h-screen">
      <DoctorSidebar doctorName={session.user.name ?? 'Doctor'} />
      <main className="flex-1 p-6 pt-20 pb-24 lg:pt-8 lg:pb-8 lg:p-8" style={{ background: '#f8f9fa' }}>
        {children}
      </main>
    </div>
  )
}
