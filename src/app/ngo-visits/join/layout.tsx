import type { Metadata } from 'next'

// Public form deprecated 2026-05-19. /ngo-visits/join now redirects to
// /login (logged-out) or /user/discover/ngo-visits (signed-in). Layout
// kept so the segment compiles; canonical points to the new dashboard
// path so any indexed links roll over cleanly.
export const metadata: Metadata = {
  title: 'Join an NGO Visit',
  description: 'Volunteer with Mindset on community outreach drives. Sign up to join an upcoming visit.',
  alternates: { canonical: '/user/discover/ngo-visits' },
  robots: { index: false, follow: true },
}

export default function NgoVisitsJoinLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
