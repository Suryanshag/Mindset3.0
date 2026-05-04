import type { Metadata } from 'next'
import { JsonLd } from '@/components/seo/json-ld'

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://mindset.example'

export const metadata: Metadata = {
  title: 'Find a Therapist',
  description:
    'Book online or in-person sessions with qualified counselors and clinical psychologists. Confidential, judgment-free, and tailored to you.',
  alternates: { canonical: '/doctors' },
  openGraph: {
    title: 'Find a Therapist — Mindset',
    description: 'Talk to qualified mental health professionals. Online or in person.',
    url: '/doctors',
  },
}

const doctorListingLd = {
  '@context': 'https://schema.org',
  '@type': 'CollectionPage',
  name: 'Mindset Therapists',
  description:
    'Directory of counselors and clinical psychologists available on Mindset.',
  url: `${APP_URL}/doctors`,
  isPartOf: { '@id': `${APP_URL}/#website` },
  about: { '@id': `${APP_URL}/#organization` },
}

export default function DoctorsLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <JsonLd data={doctorListingLd} />
      {children}
    </>
  )
}
