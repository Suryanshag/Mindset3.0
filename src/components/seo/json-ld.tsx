type JsonLdValue =
  | string
  | number
  | boolean
  | null
  | JsonLdValue[]
  | { [key: string]: JsonLdValue | undefined }

export function JsonLd({ data }: { data: Record<string, JsonLdValue | undefined> }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(data) }}
    />
  )
}

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://mindset.example'

export const organizationLd = {
  '@context': 'https://schema.org',
  '@type': 'MedicalOrganization',
  '@id': `${APP_URL}/#organization`,
  name: 'Mindset',
  url: APP_URL,
  logo: `${APP_URL}/images/icons/Logo.webp`,
  description:
    'Online therapy, counseling, and mental wellness workshops — accessible, affordable, and stigma-free.',
  medicalSpecialty: ['Psychiatric', 'Psychology'],
  areaServed: { '@type': 'Country', name: 'India' },
  sameAs: [],
}

export const websiteLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  '@id': `${APP_URL}/#website`,
  url: APP_URL,
  name: 'Mindset',
  publisher: { '@id': `${APP_URL}/#organization` },
  inLanguage: 'en-IN',
  potentialAction: {
    '@type': 'SearchAction',
    target: `${APP_URL}/?q={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
}
