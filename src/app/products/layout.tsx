import type { Metadata, Viewport } from 'next'

export const metadata: Metadata = {
  title: 'Wellness Products',
  description:
    'Curated wellness products to support your mental health journey — journals, mindfulness tools, and self-care essentials.',
  alternates: { canonical: '/products' },
  openGraph: {
    title: 'Wellness Products — Mindset',
    description: 'Curated tools for self-care, mindfulness, and emotional well-being.',
    url: '/products',
  },
}

export const viewport: Viewport = { themeColor: '#F7F2EA' }

export default function ProductsLayout({ children }: { children: React.ReactNode }) {
  return children
}
