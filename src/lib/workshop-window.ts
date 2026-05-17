/**
 * Shared logic for when a workshop's meeting link should be visible /
 * the "Join workshop" CTA should fire.
 *
 * Window: [startsAt − 15 min, startsAt + durationMin + 30 min].
 *   - 15-min lead-in matches the session pattern (users join slightly
 *     early; meeting host expects them).
 *   - 30-min trailing grace lets stragglers re-join after a brief
 *     drop-out without losing access (workshops are longer-form than
 *     1:1 sessions, so a 30-min tail is more generous than the 15-min
 *     used for sessions).
 *
 * States:
 *   upcoming   — > 15 min before start. No join button; show countdown.
 *   join_now   — within 15 min of start, not yet started. Show "Join".
 *   live       — between start and start+durationMin. Show "Join".
 *   ended_soon — start+durationMin to start+durationMin+30min. Show
 *                "Re-join" if user got disconnected.
 *   ended      — past the trailing grace. Workshop is done.
 *
 * Pure function — no React, no I/O.
 */

const FIFTEEN_MIN_MS = 15 * 60 * 1000
const THIRTY_MIN_MS = 30 * 60 * 1000

export type WorkshopWindowState =
  | 'upcoming'
  | 'join_now'
  | 'live'
  | 'ended_soon'
  | 'ended'

export function getWorkshopWindowState(
  startsAt: Date | string,
  durationMin: number,
  now: Date = new Date()
): WorkshopWindowState {
  const start = (startsAt instanceof Date ? startsAt : new Date(startsAt)).getTime()
  const end = start + durationMin * 60 * 1000
  const t = now.getTime()

  if (t < start - FIFTEEN_MIN_MS) return 'upcoming'
  if (t < start) return 'join_now'
  if (t < end) return 'live'
  if (t < end + THIRTY_MIN_MS) return 'ended_soon'
  return 'ended'
}

/** True when the meeting link should be exposed in the UI. */
export function isWorkshopJoinable(state: WorkshopWindowState): boolean {
  return state === 'join_now' || state === 'live' || state === 'ended_soon'
}
