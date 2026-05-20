import type { Metadata } from 'next'
import { auth } from '@/lib/auth'
import SplashScreen from './splash-screen'

// PWA cold-launch screen. The manifest's `start_url` is /splash?source=pwa,
// so every PWA launch goes through here. Browser visits to /splash (no
// query param, no display-mode: standalone) skip the animation and route
// instantly. Server-side decides only the redirect target; the client
// child decides whether to animate before navigating.

export const metadata: Metadata = {
  title: 'Mindset',
  robots: { index: false, follow: false },
}

const ROLE_HOME: Record<string, string> = {
  ADMIN: '/admin',
  DOCTOR: '/doctor',
  USER: '/user',
}

export default async function SplashPage() {
  const session = await auth()
  const target = session?.user
    ? ROLE_HOME[session.user.role ?? ''] ?? '/user'
    : '/welcome'

  return <SplashScreen targetUrl={target} />
}
