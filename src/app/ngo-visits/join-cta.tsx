'use client'

import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { ArrowRight } from 'lucide-react'

/**
 * Auth-aware Join CTA for the public NGO marketing page.
 *
 * Lives client-side on purpose: server-side `auth()` on this public route
 * was producing the wrong href for already-signed-in users in some session
 * states (Bug 1 — fixed 2026-05-19). useSession() reflects the live JWT,
 * so the href is correct as soon as hydration completes.
 */
export function NgoJoinCta({
  visitId,
  label = 'Join Now',
  className = 'btn-primary inline-flex items-center gap-2',
}: {
  visitId?: string
  label?: string
  className?: string
}) {
  const { data: session, status } = useSession()
  const isAuthed = status === 'authenticated' && !!session?.user
  const target = visitId
    ? `/user/discover/ngo-visits/${visitId}`
    : '/user/discover/ngo-visits'
  const href = isAuthed ? target : `/login?callbackUrl=${encodeURIComponent(target)}`

  return (
    <Link href={href} className={className}>
      {label}
      <ArrowRight size={18} />
    </Link>
  )
}
