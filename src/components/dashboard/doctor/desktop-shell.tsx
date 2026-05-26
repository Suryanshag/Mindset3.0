import DoctorDesktopSidebar from '@/components/dashboard/doctor/desktop-sidebar'

type Props = {
  children: React.ReactNode
  doctorName: string
}

/**
 * Desktop chrome for the doctor module — navy sidebar + main column.
 * Mirrors the previous layout exactly so existing pages still render
 * unchanged on lg+ viewports.
 */
export default function DoctorDesktopShell({ children, doctorName }: Props) {
  return (
    <div className="hidden lg:flex min-h-screen">
      <DoctorDesktopSidebar doctorName={doctorName} />
      <main className="flex-1 p-8" style={{ background: '#f8f9fa' }}>
        {children}
      </main>
    </div>
  )
}
