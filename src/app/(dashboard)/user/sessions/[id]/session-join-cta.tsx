'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Video, RotateCw } from 'lucide-react'
import { joinWindowState } from '@/lib/session-window'
import { SUPPORT_EMAIL } from '@/lib/email-config'

type Props = {
  startsAt: Date
  durationMin: number
  status: string
  meetLink: string | null
  doctorId: string
  doctorName: string
}

/**
 * State-aware CTA for the session detail page. Combines join-window timing
 * with meet-link presence to render the right copy at the right time.
 *
 *   meetLink present, window open       → Join button
 *   meetLink present, too early         → "Join link will be active 15 min before"
 *   meetLink missing, window open       → "Therapist hasn't added yet" + Refresh + Contact
 *   meetLink missing, too early         → "Therapist will add before the session" (calm)
 *   meetLink missing/present, ended     → "This session has ended" + Book another
 *   cancelled                           → "Session was cancelled"
 */
export default function SessionJoinCta({
  startsAt,
  durationMin,
  status,
  meetLink,
  doctorId,
  doctorName,
}: Props) {
  const router = useRouter()
  const state = joinWindowState(startsAt, durationMin, status)

  // ─── Terminal states first (independent of meetLink) ────────────────────

  if (state === 'cancelled') {
    return <Muted text="This session was cancelled." />
  }

  if (state === 'ended') {
    return (
      <Muted
        text="This session has ended."
        secondary={{
          href: `/user/sessions/book?doctorId=${doctorId}`,
          label: `Book another with ${doctorName}`,
        }}
      />
    )
  }

  // ─── Open window: Join button or "doctor hasn't added link" ─────────────

  if (state === 'open') {
    if (meetLink) {
      return (
        <a
          href={meetLink}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-2 w-full sm:max-w-sm h-12 rounded-full bg-primary text-white text-[14px] font-medium hover:opacity-95 transition-opacity"
        >
          <Video size={18} />
          Join session
        </a>
      )
    }

    // Window is open but no link — failure case, surface clearly but calmly.
    return (
      <div className="rounded-2xl p-4 bg-amber-50 border border-amber-200 space-y-3">
        <p className="text-[14px] text-amber-900 leading-relaxed">
          Your therapist hasn&apos;t added the Meet link yet. They&apos;ve been
          notified — please refresh in a minute, or contact us if it&apos;s been
          over 10 minutes.
        </p>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => router.refresh()}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-amber-900 border border-amber-300 text-[13px] font-medium hover:bg-amber-100 transition-colors"
          >
            <RotateCw size={14} />
            Refresh
          </button>
          <a
            href={`mailto:${SUPPORT_EMAIL}`}
            className="inline-flex items-center px-3 py-1.5 rounded-lg text-[13px] font-medium text-amber-900 hover:underline"
          >
            Contact support
          </a>
        </div>
      </div>
    )
  }

  // ─── too_early: depends on whether the link is already in place ─────────

  if (meetLink) {
    return <Muted text="Join link will be active 15 minutes before your session." />
  }

  return <Muted text="Your therapist will add the Meet link before the session." />
}

function Muted({
  text,
  secondary,
}: {
  text: string
  secondary?: { href: string; label: string }
}) {
  return (
    <div className="space-y-2">
      <p className="text-[13px] text-text-faint">{text}</p>
      {secondary && (
        <Link
          href={secondary.href}
          className="inline-flex items-center text-[13px] font-medium text-primary hover:underline"
        >
          {secondary.label}
        </Link>
      )}
    </div>
  )
}
