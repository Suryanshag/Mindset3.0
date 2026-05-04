// PRIVACY: Journal entries are user-private. Therapists CANNOT read entries.
// Every query in this file MUST filter by session.user.id.
// If you're adding a doctor-facing journal view, STOP and re-discuss
// — that's a separate feature with separate consent flows.

import { prisma } from '@/lib/prisma'

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

  if (opts?.search) {
    where.OR = [
      { title: { contains: opts.search, mode: 'insensitive' } },
      { body: { contains: opts.search, mode: 'insensitive' } },
    ]
  }
  if (opts?.mood) {
    where.mood = opts.mood
  }
  if (opts?.from || opts?.to) {
    where.entryDate = {}
    if (opts?.from) where.entryDate.gte = opts.from
    if (opts?.to) where.entryDate.lte = opts.to
  }

  return prisma.journalEntry.findMany({
    where,
    select: {
      id: true,
      title: true,
      body: true,
      mood: true,
      entryDate: true,
    },
    orderBy: { entryDate: 'desc' },
  })
}

export async function getJournalEntry(userId: string, id: string) {
  return prisma.journalEntry.findFirst({
    where: { id, userId },
  })
}

export async function getLatestJournalEntry(userId: string) {
  return prisma.journalEntry.findFirst({
    where: { userId, isDraft: false },
    orderBy: { entryDate: 'desc' },
    select: { entryDate: true },
  })
}

export async function getActiveDraft(userId: string) {
  return prisma.journalEntry.findFirst({
    where: { userId, isDraft: true },
  })
}

export async function getPendingJournalPrompt(userId: string) {
  return prisma.assignment.findFirst({
    where: {
      userId,
      type: 'JOURNAL_PROMPT',
      status: 'PENDING',
    },
    select: {
      id: true,
      title: true,
      instructions: true,
      dueDate: true,
      doctor: {
        select: { user: { select: { name: true } } },
      },
    },
    orderBy: { dueDate: 'asc' },
  })
}
