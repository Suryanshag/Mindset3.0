import Link from 'next/link'
import { Video } from 'lucide-react'
import { joinWindowState } from '@/lib/session-window'

type Props = {
  startsAt: Date
  durationMin: number
  status: string
  meetLink: string | null
  doctorId: string
  doctorName: string
}

/**
 * Renders the right CTA / message for the user's join window:
 * - 'open' + meetLink: primary Join button, opens meetLink in new tab.
 *   Full-width on mobile, capped on desktop (sm:max-w-sm).
 * - 'too_early': muted explanation.
 * - 'ended': muted explanation + "Book another with Dr. X" secondary link.
 * - 'cancelled': muted explanation.
 *
 * meetLink-missing is folded into the open state — without a link there's
 * nothing to join, so we degrade to the "link not available yet" message.
 */
export default function SessionJoinCta({
  startsAt,
  durationMin,
  status,
  meetLink,
  doctorId,
  doctorName,
}: Props) {
  const state = joinWindowState(startsAt, durationMin, status)

  const muted = (text: string, secondary?: { href: string; label: string }) => (
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

  if (state === 'cancelled') {
    return muted('This session was cancelled.')
  }

  if (state === 'ended') {
    return muted('This session has ended.', {
      href: `/user/sessions/book?doctorId=${doctorId}`,
      label: `Book another with ${doctorName}`,
    })
  }

  if (state === 'too_early') {
    return muted('Join link will be active 15 minutes before your session.')
  }

  // state === 'open'
  if (!meetLink) {
    return muted('Meeting link not available yet.')
  }

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
