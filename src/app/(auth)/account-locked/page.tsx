import type { Metadata } from 'next'
import { redirect } from 'next/navigation'
import AuthShell from '@/components/auth/auth-shell'
import AccountLockedClient from './account-locked-client'

// Per Resolved Decision 5: URL takes only `?until=<ISO8601>` — no email,
// no identifier, no signed token. The route is reachable only via
// /login's submit handler after a real lockout (or — in tests — by
// constructing the URL manually).
//
// Edge-case behavior:
//   missing `until`           → redirect('/login')
//   malformed `until`         → redirect('/login')
//   `until` > 24h in future   → redirect('/login') (real lockouts are 15
//                               min; 24h ahead is almost certainly a
//                               malformed input or manual misuse)
//   `until` in the past       → render unlocked state directly (countdown
//                               at 0:00, "Sign in now" affordance active)
//   `until` in the near future → render active state with mm:ss countdown
//
// The route doesn't exist as a destination without a valid `until` —
// /login is the canonical landing for everything else.

const TWENTY_FOUR_HOURS_MS = 24 * 60 * 60 * 1000

export const metadata: Metadata = {
  title: 'Account paused',
  robots: { index: false, follow: false },
}

export default async function AccountLockedPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const untilRaw = typeof params.until === 'string' ? params.until : undefined

  if (!untilRaw) {
    redirect('/login')
  }

  const untilDate = new Date(untilRaw)
  if (Number.isNaN(untilDate.getTime())) {
    redirect('/login')
  }

  const msFromNow = untilDate.getTime() - Date.now()
  if (msFromNow > TWENTY_FOUR_HOURS_MS) {
    redirect('/login')
  }

  return (
    <AuthShell headline="A short pause, for safety.">
      <AccountLockedClient untilIso={untilDate.toISOString()} />
    </AuthShell>
  )
}
