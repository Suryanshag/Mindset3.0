// PRIVACY: Journal entries are user-private. Therapists CANNOT read entries.
// Every query in this file MUST filter by session.user.id.
// If you're adding a doctor-facing journal view, STOP and re-discuss
// — that's a separate feature with separate consent flows.

import { prisma } from '@/lib/prisma'
import {
  startOfDayIST,
  startOfNextDayIST,
  dateOnlyIST,
} from '@/lib/format-date'
import { decryptField } from '@/lib/encryption'

export type JournalListItem = {
  id: string
  title: string | null
  body: string
  mood: number | null
  entryDate: Date
}

export async function getJournalEntries(
  userId: string,
  opts?: {
    search?: string
    mood?: number
    from?: Date
    to?: Date
  }
) {
  const where: any = { userId, isDraft: false }

  // DP1: opts.search is intentionally ignored — title/body are encrypted at
  // rest now, so a Postgres `contains` against ciphertext can't match. A
  // blind-index / tokenized-search layer is a separate sprint.
  if (opts?.mood) {
    where.mood = opts.mood
  }
  if (opts?.from || opts?.to) {
    where.entryDate = {}
    if (opts?.from) where.entryDate.gte = opts.from
    if (opts?.to) where.entryDate.lte = opts.to
  }

  const rows = await prisma.journalEntry.findMany({
    where,
    select: {
      id: true,
      titleEncrypted: true,
      bodyEncrypted: true,
      mood: true,
      entryDate: true,
    },
    orderBy: { entryDate: 'desc' },
  })

  return rows.map((r) => ({
    id: r.id,
    title: decryptField(r.titleEncrypted),
    body: decryptField(r.bodyEncrypted) ?? '',
    mood: r.mood,
    entryDate: r.entryDate,
  }))
}

export async function getJournalEntry(userId: string, id: string) {
  const row = await prisma.journalEntry.findFirst({
    where: { id, userId },
    select: {
      id: true,
      userId: true,
      titleEncrypted: true,
      bodyEncrypted: true,
      mood: true,
      isDraft: true,
      draftUpdatedAt: true,
      assignmentId: true,
      entryDate: true,
      createdAt: true,
      updatedAt: true,
    },
  })
  if (!row) return null
  return {
    id: row.id,
    userId: row.userId,
    title: decryptField(row.titleEncrypted),
    body: decryptField(row.bodyEncrypted) ?? '',
    mood: row.mood,
    isDraft: row.isDraft,
    draftUpdatedAt: row.draftUpdatedAt,
    assignmentId: row.assignmentId,
    entryDate: row.entryDate,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export async function getLatestJournalEntry(userId: string) {
  return prisma.journalEntry.findFirst({
    where: { userId, isDraft: false },
    orderBy: { entryDate: 'desc' },
    select: { entryDate: true },
  })
}

export async function getActiveDraft(userId: string) {
  const row = await prisma.journalEntry.findFirst({
    where: { userId, isDraft: true },
    select: {
      id: true,
      userId: true,
      titleEncrypted: true,
      bodyEncrypted: true,
      mood: true,
      isDraft: true,
      draftUpdatedAt: true,
      assignmentId: true,
      entryDate: true,
      createdAt: true,
      updatedAt: true,
    },
  })
  if (!row) return null
  return {
    id: row.id,
    userId: row.userId,
    title: decryptField(row.titleEncrypted),
    body: decryptField(row.bodyEncrypted) ?? '',
    mood: row.mood,
    isDraft: row.isDraft,
    draftUpdatedAt: row.draftUpdatedAt,
    assignmentId: row.assignmentId,
    entryDate: row.entryDate,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }
}

export async function getPendingJournalPrompt(userId: string) {
  const row = await prisma.assignment.findFirst({
    where: {
      userId,
      type: 'JOURNAL_PROMPT',
      status: 'PENDING',
    },
    select: {
      id: true,
      title: true,
      instructionsEncrypted: true,
      dueDate: true,
      doctor: {
        select: { user: { select: { name: true } } },
      },
    },
    orderBy: { dueDate: 'asc' },
  })
  if (!row) return null
  const { instructionsEncrypted, ...rest } = row
  return {
    ...rest,
    instructions: decryptField(instructionsEncrypted) ?? '',
  }
}

/**
 * Consecutive-day journaling streak ending today. Counts each day the
 * user posted at least one non-draft entry; the streak breaks on the
 * first day-gap. Returns 0 when the user has no entries or hasn't
 * written today/yesterday (today doesn't break the streak; missing
 * yesterday does).
 *
 * Phase 4 addition for the mobile Journal header.
 */
export async function getJournalStreak(userId: string): Promise<number> {
  const days = await prisma.$queryRaw<{ d: Date }[]>`
    SELECT DISTINCT DATE(entry_date AT TIME ZONE 'Asia/Kolkata') AS d
    FROM journal_entries
    WHERE user_id = ${userId}
      AND is_draft = false
    ORDER BY d DESC
    LIMIT 365
  `
  if (days.length === 0) return 0

  // IST calendar day keys — SQL already buckets by IST, so the
  // lookup keys must also be IST or the comparison drifts on UTC server.
  const today = dateOnlyIST(new Date())
  const todayKey = today.toISOString().slice(0, 10)
  const yesterdayKey = new Date(today.getTime() - 86400000)
    .toISOString()
    .slice(0, 10)

  const set = new Set(
    days.map((r) => new Date(r.d).toISOString().slice(0, 10))
  )

  // Streak only counts if the user has written today OR yesterday.
  // Writing today extends; missing today but writing yesterday holds
  // the streak (mid-day check-in users); missing both breaks.
  if (!set.has(todayKey) && !set.has(yesterdayKey)) return 0

  let streak = 0
  let cursor = set.has(todayKey) ? new Date(today) : new Date(today.getTime() - 86400000)
  while (set.has(cursor.toISOString().slice(0, 10))) {
    streak++
    cursor = new Date(cursor.getTime() - 86400000)
  }
  return streak
}

/**
 * Last 7 days of (date, mood) entries for the mobile Journal calendar
 * strip. Empty days return mood=null. Most-recent-of-day wins when
 * the user has multiple entries on the same date.
 */
export async function getLastWeekJournal(
  userId: string
): Promise<{ date: Date; mood: 1 | 2 | 3 | 4 | 5 | null }[]> {
  // IST calendar bounds — entryDate is DateTime, so we bracket on the
  // IST day window. dateOnlyIST gives a UTC-midnight key for grouping.
  const istToday = dateOnlyIST(new Date())
  const sevenDaysAgo = new Date(istToday.getTime() - 6 * 86400000)
  const istStart = startOfDayIST(sevenDaysAgo)
  const istEndExclusive = startOfNextDayIST(new Date())

  const rows = await prisma.journalEntry.findMany({
    where: {
      userId,
      isDraft: false,
      entryDate: { gte: istStart, lt: istEndExclusive },
    },
    select: { mood: true, entryDate: true },
    orderBy: { entryDate: 'desc' },
  })

  const byDate = new Map<string, number>()
  for (const r of rows) {
    // IST calendar-day key (not UTC) — an entry at 00:30 IST belongs
    // to the next IST day, not the prior UTC day.
    const key = dateOnlyIST(r.entryDate).toISOString().slice(0, 10)
    if (!byDate.has(key) && r.mood != null) {
      byDate.set(key, r.mood)
    } else if (!byDate.has(key)) {
      // Mark the date as having an entry even when mood is null —
      // the calendar strip uses the mood dot but presence vs absence
      // matters for the user's sense of streak.
      byDate.set(key, 0)
    }
  }

  const out: { date: Date; mood: 1 | 2 | 3 | 4 | 5 | null }[] = []
  for (let i = 0; i < 7; i++) {
    const d = new Date(sevenDaysAgo.getTime() + i * 86400000)
    const key = d.toISOString().slice(0, 10)
    const m = byDate.get(key)
    out.push({
      date: d,
      mood: m && m >= 1 && m <= 5 ? (m as 1 | 2 | 3 | 4 | 5) : null,
    })
  }
  return out
}
