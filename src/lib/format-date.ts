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

// ─── Boundary helpers (IST calendar-day math) ─────────────────────────────
//
// Vercel runs Node in UTC. Indian users see their calendar day as IST
// (UTC+5:30). Any Prisma `where: { date: { gte: ..., lt: ... } }` that
// bounds a "today / this week / this month" query must use these helpers,
// or the cutoff falls 5h30m short and sessions/moods/etc. land in the
// wrong bucket. Works identically in Node and browsers — both ship
// `Intl.DateTimeFormat` with `timeZone: 'Asia/Kolkata'` natively.

const IST_OFFSET_MIN = 5 * 60 + 30
const IST_OFFSET_MS = IST_OFFSET_MIN * 60 * 1000

/**
 * UTC instant corresponding to 00:00:00.000 IST of the calendar day
 * containing `d`. Use as inclusive lower bound (`gte`) in Prisma queries.
 *
 * Example: startOfDayIST('2026-05-27T18:30:00Z') === '2026-05-27T18:30:00Z'
 * (the input is already IST May 28 00:00, so the IST day containing it
 * is May 28, whose UTC start is the same instant)
 */
export function startOfDayIST(d: Date | string): Date {
  const { year, month, day } = istDateParts(toDate(d))
  return new Date(Date.UTC(year, month - 1, day) - IST_OFFSET_MS)
}

/**
 * UTC instant corresponding to 00:00:00.000 IST of the day AFTER `d`'s
 * IST calendar day. Use as exclusive upper bound (`lt`) — preferred over
 * `endOfDayIST` + `lte` since it sidesteps millisecond rounding edges.
 */
export function startOfNextDayIST(d: Date | string): Date {
  const { year, month, day } = istDateParts(toDate(d))
  return new Date(Date.UTC(year, month - 1, day + 1) - IST_OFFSET_MS)
}

/**
 * UTC instant corresponding to 23:59:59.999 IST of `d`'s IST calendar
 * day. Use only when you must pair with `lte`. Otherwise prefer
 * `startOfNextDayIST` + `lt`.
 */
export function endOfDayIST(d: Date | string): Date {
  return new Date(startOfNextDayIST(d).getTime() - 1)
}

/**
 * UTC instant for 00:00 IST of the Monday of `d`'s IST week.
 * Weeks are Monday-start (ISO convention used across the app).
 */
export function startOfWeekIST(d: Date | string): Date {
  const { year, month, day } = istDateParts(toDate(d))
  // Compute weekday of the IST calendar day. UTC-midnight of that date
  // shares its weekday with the IST date (calendar day = same number).
  const dayOfWeek = new Date(Date.UTC(year, month - 1, day)).getUTCDay() // 0=Sun
  const daysFromMonday = (dayOfWeek + 6) % 7 // 0 if Mon, 6 if Sun
  return new Date(Date.UTC(year, month - 1, day - daysFromMonday) - IST_OFFSET_MS)
}

/**
 * UTC instant for 23:59:59.999 IST of the Sunday closing `d`'s IST week.
 * For exclusive upper bound, use `new Date(startOfWeekIST(d).getTime() + 7*86400000)`.
 */
export function endOfWeekIST(d: Date | string): Date {
  return new Date(startOfWeekIST(d).getTime() + 7 * 24 * 60 * 60 * 1000 - 1)
}

/**
 * UTC instant for 00:00 IST of the 1st of `d`'s IST month.
 */
export function startOfMonthIST(d: Date | string): Date {
  const { year, month } = istDateParts(toDate(d))
  return new Date(Date.UTC(year, month - 1, 1) - IST_OFFSET_MS)
}

/**
 * UTC instant for 23:59:59.999 IST of the last day of `d`'s IST month.
 */
export function endOfMonthIST(d: Date | string): Date {
  const { year, month } = istDateParts(toDate(d))
  // Date.UTC with month=N rolls over to N+1 month — day 1 of next month
  // minus 1ms = end of current month (UTC). Then shift back by IST offset.
  return new Date(Date.UTC(year, month, 1) - IST_OFFSET_MS - 1)
}

/**
 * For `@db.Date` columns. Returns a Date object representing UTC
 * midnight of `d`'s IST calendar day — Prisma serializes this as the
 * date portion for storage. Reading from `@db.Date` returns UTC midnight
 * already (so this helper is a no-op for round-trips, but needed for
 * the WRITE path where the application is constructing the date from
 * a local-time `new Date()`).
 */
export function dateOnlyIST(d: Date | string): Date {
  const { year, month, day } = istDateParts(toDate(d))
  return new Date(Date.UTC(year, month - 1, day))
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
