import type { Metadata } from 'next'

// Auth pages aren't indexable content — keep them out of search results.
export const metadata: Metadata = {
  robots: { index: false, follow: true },
}

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}
