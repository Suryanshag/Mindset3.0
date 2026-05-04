import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Join an NGO Visit',
  description: 'Volunteer with Mindset on community outreach drives. Sign up to join an upcoming visit.',
  alternates: { canonical: '/ngo-visits/join' },
}

export default function NgoVisitsJoinLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
