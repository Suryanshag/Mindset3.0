import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'

// Public form deprecated 2026-05-19 (Sprint NGO-Dashboard).
// Anyone landing here is bounced to login (with a callback back into the
// dashboard) or, if already signed in, straight into the dashboard list.
export default async function NgoJoinRedirectPage() {
  const session = await auth()
  if (session?.user?.id) {
    redirect('/user/discover/ngo-visits')
  }
  redirect('/login?callbackUrl=%2Fuser%2Fdiscover%2Fngo-visits')
}
