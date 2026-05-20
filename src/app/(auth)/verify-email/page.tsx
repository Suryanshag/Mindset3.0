import type { Metadata } from 'next'
import { Suspense } from 'react'
import { redirect } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { auth } from '@/lib/auth'
import { getCurrentUserBasics } from '@/lib/queries/current-user'
import AuthShell from '@/components/auth/auth-shell'
import VerifyEmailTokenFlow from './verify-email-token-flow'
import VerifyEmailSent from './verify-email-sent'

// Three navigation patterns, resolved server-side per Resolved Decision 3:
//
//   /verify-email?token=X        token-validation flow (5 states preserved
//                                from the original implementation:
//                                verifying / success / expired / invalid /
//                                used). Renders without an auth check —
//                                the email link itself is the credential.
//
//   /verify-email?sent=1         post-signup "check your inbox" stage.
//                                Requires an active session because the
//                                email comes from session.user.email.
//
//   /verify-email                bare URL. If session.user.email exists
//                                and is unverified → render sent stage
//                                (same as ?sent=1). If verified → /user.
//                                If no session → /login.
//
// Email is never accepted from query params or rendered into URLs — only
// read from session.user.email (Decision 5 privacy stance).

export const metadata: Metadata = {
  title: 'Verify your email',
  robots: { index: false, follow: false },
}

export default async function VerifyEmailPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const token = typeof params.token === 'string' ? params.token : undefined
  const sentFlag = params.sent === '1'

  // Token-validation flow — handled entirely client-side because the
  // POST happens on mount and the page mutates through states. Skip the
  // session lookup; the token is the unit of authorization here.
  if (token) {
    return (
      <AuthShell headline="One quick check, and you're set.">
        <Suspense
          fallback={
            <div className="text-center py-12">
              <Loader2
                className="w-8 h-8 animate-spin mx-auto"
                style={{ color: 'var(--primary)' }}
                aria-hidden="true"
              />
            </div>
          }
        >
          <VerifyEmailTokenFlow />
        </Suspense>
      </AuthShell>
    )
  }

  // Sent stage and bare-URL both need an active session for the email.
  const session = await auth()
  if (!session?.user?.id || !session.user.email) {
    redirect('/login')
  }

  // Bare URL: if the user is already verified, drop them on the
  // dashboard instead of showing a stale "check your inbox" pitch.
  // sent=1 explicitly bypasses this check — it's a post-signup landing
  // intent, and the user *should* see the inbox prompt even if they
  // somehow got verified between signup and this navigation.
  if (!sentFlag) {
    const user = await getCurrentUserBasics(session.user.id)
    if (user?.emailVerified) {
      redirect('/user')
    }
  }

  return (
    <AuthShell headline="One quick check, and you're set.">
      <VerifyEmailSent email={session.user.email} />
    </AuthShell>
  )
}
