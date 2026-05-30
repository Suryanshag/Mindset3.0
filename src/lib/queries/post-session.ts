// Phase 3 — Pending post-session detection + recent followups for HomeEngaged.

import { cache } from 'react'
import { prisma } from '@/lib/prisma'
import { decryptField } from '@/lib/encryption'

const SESSION_DURATION_MIN = 60

/**
 * The most recent ended session for the user that does NOT yet have a
 * SessionFollowup row. Used by the mobile shell to auto-trigger the
 * post-session interstitial.
 *
 * "Ended" = `date + 60 min < now` (the schema has no endsAt column).
 * CANCELLED sessions are excluded — they don't need a follow-up.
 *
 * Cached per-request so the shell + any other consumer don't repeat
 * the query in the same render.
 */
export const getPendingPostSession = cache(async (userId: string) => {
  const now = new Date()
  const endsAtCutoff = new Date(now.getTime() - SESSION_DURATION_MIN * 60 * 1000)

  return await prisma.session.findFirst({
    where: {
      userId,
      // Sessions whose end time (date + 60min) is in the past.
      date: { lt: endsAtCutoff },
      status: { in: ['CONFIRMED', 'COMPLETED'] },
      followup: null,
    },
    orderBy: { date: 'desc' },
    include: {
      doctor: {
        select: {
          photo: true,
          specialization: true,
          designation: true,
          user: { select: { name: true } },
        },
      },
    },
  })
})

/**
 * Recent SessionFollowups for the HomeEngaged "Your last N sessions"
 * block. Includes the session date + doctor name + the user's recorded
 * mood/note for snippet rendering.
 */
export async function getRecentSessionFollowups(userId: string, limit = 3) {
  const rows = await prisma.sessionFollowup.findMany({
    where: { userId },
    orderBy: { completedAt: 'desc' },
    take: limit,
    select: {
      id: true,
      sessionId: true,
      userId: true,
      postMood: true,
      homeworkNoteEncrypted: true,
      rebookIntent: true,
      completedAt: true,
      session: {
        select: {
          date: true,
          doctor: {
            select: {
              photo: true,
              user: { select: { name: true } },
            },
          },
        },
      },
    },
  })

  return rows.map(({ homeworkNoteEncrypted, ...rest }) => ({
    ...rest,
    homeworkNote: decryptField(homeworkNoteEncrypted),
  }))
}
