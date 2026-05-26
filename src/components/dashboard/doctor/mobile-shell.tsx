import DoctorBottomNavMobile from '@/components/dashboard/doctor/bottom-nav-mobile'

type Props = {
  children: React.ReactNode
}

/**
 * Lightweight wrapper for the doctor mobile UI — safe-area top spacer,
 * coloured background, bottom nav. The top bar is rendered by each
 * page so kicker/title/back can be route-specific.
 */
export default function DoctorMobileShell({ children }: Props) {
  return (
    <div className="min-h-dvh" style={{ background: 'var(--bg-app)' }}>
      <div style={{ height: 'env(safe-area-inset-top)' }} />
      <main className="pb-28">{children}</main>
      <DoctorBottomNavMobile />
    </div>
  )
}
