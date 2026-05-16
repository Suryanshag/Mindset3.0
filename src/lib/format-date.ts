/**
 * Date formatters locked to Asia/Kolkata (IST, UTC+05:30).
 *
 * Use these everywhere user-facing dates render. Never reach for
 * `toLocaleString`/`toLocaleDateString`/`toLocaleTimeString` without an
 * explicit `timeZone` — those use the runtime's tz, which is UTC on
 * Vercel during SSR and varies on the client. That mismatch caused the
 * "session time wrong" bug surfaced in case 1 smoke.
 *
 * Format is day-month order (Indian/British convention) per product spec.
 */

const TZ = 'Asia/Kolkata'
const LOCALE = 'en-GB'

function toDate(d: Date | string): Date {
  return d instanceof Date ? d : new Date(d)
}

function fmtPart(d: Date, opts: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat(LOCALE, { timeZone: TZ, ...opts }).format(d)
}

/** "Thu, 19 Nov · 2:00 PM" */
export function formatSessionDateTime(d: Date | string): string {
  const date = toDate(d)
  const weekday = fmtPart(date, { weekday: 'short' })
  const day = fmtPart(date, { day: 'numeric' })
  const month = fmtPart(date, { month: 'short' })
  return `${weekday}, ${day} ${month} · ${formatSessionTime(date)}`
}

/** "2:00 PM" */
export function formatSessionTime(d: Date | string): string {
  const date = toDate(d)
  return new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(date)
}

/**
 * "Today, 2:00 PM" if same IST calendar day as now
 * "Tomorrow, 2:00 PM" if next IST calendar day
 * "Thu, 19 Nov · 2:00 PM" otherwise (matches formatSessionDateTime)
 */
export function formatSessionDateRelative(d: Date | string): string {
  const date = toDate(d)
  const now = new Date()
  const dKey = istDateKey(date)
  const nowKey = istDateKey(now)

  if (dKey === nowKey) return `Today, ${formatSessionTime(date)}`

  const nowParts = istDateParts(now)
  const tomorrow = new Date(Date.UTC(nowParts.year, nowParts.month - 1, nowParts.day + 1))
  if (istDateKey(tomorrow) === dKey) return `Tomorrow, ${formatSessionTime(date)}`

  return formatSessionDateTime(date)
}

/** "Thu, 19 Nov" — date only, no time. For tight UI surfaces. */
export function formatSessionDate(d: Date | string): string {
  const date = toDate(d)
  const weekday = fmtPart(date, { weekday: 'short' })
  const day = fmtPart(date, { day: 'numeric' })
  const month = fmtPart(date, { month: 'short' })
  return `${weekday}, ${day} ${month}`
}

/** "November 2026" — long month + year, for monthly grouping/labels */
export function formatMonthYear(d: Date | string): string {
  return fmtPart(toDate(d), { month: 'long', year: 'numeric' })
}

/** "Thursday, 19 November 2026 at 2:00 PM IST" — for email body, no ambient ctx */
export function formatSessionDateLong(d: Date | string): string {
  const date = toDate(d)
  const weekday = fmtPart(date, { weekday: 'long' })
  const day = fmtPart(date, { day: 'numeric' })
  const month = fmtPart(date, { month: 'long' })
  const year = fmtPart(date, { year: 'numeric' })
  return `${weekday}, ${day} ${month} ${year} at ${formatSessionTime(date)} IST`
}

// ─── Internals ─────────────────────────────────────────────────────────────

function istDateParts(d: Date): { year: number; month: number; day: number } {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(d)
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value ?? '0')
  return { year: get('year'), month: get('month'), day: get('day') }
}

/** Stable "YYYY-MM-DD" key in IST for same-day comparisons. */
function istDateKey(d: Date): string {
  const { year, month, day } = istDateParts(d)
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}
