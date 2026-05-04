import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Workshops & Events',
  description:
    'Live workshops, group sessions, and community events on mindfulness, anxiety, relationships, and emotional well-being.',
  alternates: { canonical: '/workshops' },
  openGraph: {
    title: 'Mental Wellness Workshops — Mindset',
    description: 'Live and on-demand sessions led by qualified facilitators.',
    url: '/workshops',
  },
}

export default function WorkshopsLayout({ children }: { children: React.ReactNode }) {
  return children
}
