import type { Metadata } from 'next'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { userHasOnboardingActivity } from '@/lib/queries/onboarding'
import OnboardingCarousel from './onboarding-carousel'

export const metadata: Metadata = {
  title: 'Welcome aboard',
  robots: { index: false, follow: false },
}

// Three gates, in order:
//   1. Must be authed — onboarding is post-signup, not pre-auth.
//   2. If the `mindset_onboarded` cookie is set, the user already
//      completed (or dismissed) the tutorial. Skip.
//   3. If the user has any activity (sessions / journal / mood),
//      they're a returning user on a fresh device whose cookie was
//      lost. Skip the tutorial — they don't need it.
// Anything that survives all three gates renders the carousel.

export default async function OnboardingPage() {
  const session = await auth()
  if (!session?.user?.id) {
    redirect('/login?callbackUrl=/user')
  }

  const cookieStore = await cookies()
  if (cookieStore.get('mindset_onboarded')) {
    redirect('/user')
  }

  const hasActivity = await userHasOnboardingActivity(session.user.id)
  if (hasActivity) {
    redirect('/user')
  }

  return <OnboardingCarousel />
}
