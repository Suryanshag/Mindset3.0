import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import ConsentGateClient from './consent-gate-client'

export const metadata = {
  title: 'Complete your signup — Mindset',
  description: 'One-time consent step before continuing into Mindset.',
}

const ROLE_HOME: Record<string, string> = {
  ADMIN: '/admin',
  DOCTOR: '/doctor',
  USER: '/user',
}

/**
 * One-time consent gate shown to users who reached an authenticated route
 * without a stored consent record. In practice this is the Google-OAuth
 * flow — email signups capture consent at registration, but the OAuth
 * adapter creates the User row with consentedAt=null. The dashboard
 * layouts redirect any such user here; on submit we set consentedAt /
 * consentVersion / IP / UA and bounce them to their role home.
 */
export default async function ConsentGatePage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login?callbackUrl=/consent-gate')

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { consentedAt: true, role: true },
  })

  if (!user) redirect('/login')
  if (user.consentedAt) redirect(ROLE_HOME[user.role] ?? '/user')

  return <ConsentGateClient />
}
