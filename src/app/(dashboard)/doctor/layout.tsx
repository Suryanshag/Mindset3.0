import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import DoctorMobileShell from '@/components/dashboard/doctor/mobile-shell'
import DoctorDesktopShell from '@/components/dashboard/doctor/desktop-shell'

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

  const doctorName = session.user.name ?? 'Doctor'

  return (
    <>
      <div className="lg:hidden">
        <DoctorMobileShell>{children}</DoctorMobileShell>
      </div>
      <DoctorDesktopShell doctorName={doctorName}>{children}</DoctorDesktopShell>
    </>
  )
}
