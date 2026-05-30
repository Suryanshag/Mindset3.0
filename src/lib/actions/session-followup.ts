'use server'

// Phase 3 — Post-session follow-up server action.
// Writes the SessionFollowup row created by the post-session interstitial.
// Idempotent: upserts by sessionId so re-submitting updates the same row.

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { encryptField } from '@/lib/encryption'

const SESSION_DURATION_MIN = 60

export async function saveSessionFollowup(input: {
  sessionId: string
  postMood?: number
  homeworkNote?: string
  rebookIntent?: boolean
}) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Unauthorized' as const }
  const userId = session.user.id

  // Verify the session belongs to this user, and that it's actually
  // ended (date + 60 min in the past). The schema has no endsAt column;
  // we compute end as date + SESSION_DURATION_MIN.
  const sessionRow = await prisma.session.findUnique({
    where: { id: input.sessionId },
    select: { userId: true, date: true, status: true },
  })
  if (!sessionRow) return { error: 'Session not found' as const }
  if (sessionRow.userId !== userId) return { error: 'Not your session' as const }
  if (sessionRow.status === 'CANCELLED') {
    return { error: 'Session was cancelled' as const }
  }

  const endsAtMs = sessionRow.date.getTime() + SESSION_DURATION_MIN * 60 * 1000
  if (endsAtMs > Date.now()) {
    return { error: 'Session has not ended yet' as const }
  }

  // Light bound-checking on optional inputs.
  if (
    input.postMood !== undefined &&
    (input.postMood < 1 || input.postMood > 5)
  ) {
    return { error: 'Invalid mood value' as const }
  }
  const note =
    input.homeworkNote && input.homeworkNote.trim().length > 0
      ? input.homeworkNote.trim().slice(0, 500)
      : null

  await prisma.sessionFollowup.upsert({
    where: { sessionId: input.sessionId },
    update: {
      postMood: input.postMood ?? null,
      homeworkNote: note,
      homeworkNoteEncrypted: encryptField(note),
      rebookIntent: input.rebookIntent ?? null,
    },
    create: {
      sessionId: input.sessionId,
      userId,
      postMood: input.postMood ?? null,
      homeworkNote: note,
      homeworkNoteEncrypted: encryptField(note),
      rebookIntent: input.rebookIntent ?? null,
    },
  })

  revalidatePath('/user')
  revalidatePath('/user/sessions')
  revalidatePath(`/user/sessions/${input.sessionId}`)
  return { success: true as const }
}
