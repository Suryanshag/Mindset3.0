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

const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://mindset.org.in'

export const organizationLd = {
  '@context': 'https://schema.org',
  '@type': 'MedicalOrganization',
  '@id': `${APP_URL}/#organization`,
  name: 'Mindset',
  url: APP_URL,
  // Logo as ImageObject (with dimensions) is preferred by Google's logo rich result.
  logo: {
    '@type': 'ImageObject',
    url: `${APP_URL}/images/icons/Logo.webp`,
    width: 512,
    height: 512,
  },
  description:
    'Online therapy, counseling, and mental wellness workshops — accessible, affordable, and stigma-free.',
  // 'Psychiatric' is a valid MedicalSpecialty enum; 'Psychology' is not — use knowsAbout for it.
  medicalSpecialty: ['Psychiatric'],
  knowsAbout: ['Psychotherapy', 'Counseling', 'Mental Health', 'Mindfulness'],
  areaServed: { '@type': 'Country', name: 'India' },
  contactPoint: {
    '@type': 'ContactPoint',
    contactType: 'customer support',
    email: 'mindset.org.connect@gmail.com',
    availableLanguage: ['English', 'Hindi'],
    areaServed: 'IN',
  },
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
