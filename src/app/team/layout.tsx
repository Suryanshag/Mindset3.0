import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Our Team',
  description:
    'Meet the therapists, facilitators, and team behind Mindset — qualified professionals dedicated to making mental health care accessible.',
  alternates: { canonical: '/team' },
  openGraph: {
    title: 'The Mindset Team',
    description: 'The people behind Mindset.',
    url: '/team',
  },
}

export default function TeamLayout({ children }: { children: React.ReactNode }) {
  return children
}
