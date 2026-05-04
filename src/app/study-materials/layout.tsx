import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Study Materials',
  description:
    'Ebooks, guides, and study materials curated by Mindset experts — practical resources for everyday mental wellness.',
  alternates: { canonical: '/study-materials' },
  openGraph: {
    title: 'Mental Health Study Materials — Mindset',
    description: 'Ebooks and guides for everyday mental wellness.',
    url: '/study-materials',
  },
}

export default function StudyMaterialsLayout({ children }: { children: React.ReactNode }) {
  return children
}
