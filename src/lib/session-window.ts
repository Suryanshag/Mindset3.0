/**
 * Shared logic for whether a session/workshop's Join link should be active.
 *
 * Window: [startsAt − 15 min, startsAt + durationMin + 15 min].
 * The 15-min grace either side covers users who join slightly early or run
 * over the end of the call.
 *
 * Session statuses (from prisma SessionStatus enum):
 *   PENDING | CONFIRMED | COMPLETED | CANCELLED
 *
 * Only CONFIRMED can present a Join link — PENDING means payment hasn't
 * landed yet, so the Meet link is not yet provisioned.
 */

const FIFTEEN_MIN_MS = 15 * 60 * 1000

export type JoinWindowState = 'too_early' | 'open' | 'ended' | 'cancelled'

export function isJoinWindowOpen(
  startsAt: Date | string,
  durationMin: number,
  status: string
): boolean {
  return joinWindowState(startsAt, durationMin, status) === 'open'
}

export function joinWindowState(
  startsAt: Date | string,
  durationMin: number,
  status: string
): JoinWindowState {
  if (status === 'CANCELLED') return 'cancelled'

  const start = (startsAt instanceof Date ? startsAt : new Date(startsAt)).getTime()
  const end = start + durationMin * 60 * 1000
  const now = Date.now()

  if (now < start - FIFTEEN_MIN_MS) return 'too_early'
  if (now > end + FIFTEEN_MIN_MS) return 'ended'
  if (status === 'CONFIRMED') return 'open'

  // PENDING / COMPLETED / anything else inside the time window — not joinable.
  // PENDING: payment hasn't landed yet, no Meet link.
  // COMPLETED: doctor already marked it done.
  return now < start ? 'too_early' : 'ended'
}
