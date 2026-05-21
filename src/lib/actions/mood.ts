'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function logMoodCheckIn(mood: number, note?: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Unauthorized' }

  if (mood < 1 || mood > 5) return { error: 'Invalid mood value' }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

  // Optional one-line note — capped at the column's textual budget;
  // anything blank/whitespace stores as null so the column reflects
  // intentional content only.
  const trimmedNote = note?.trim() ? note.trim().slice(0, 200) : null

  await prisma.moodCheckIn.upsert({
    where: {
      userId_checkedInDate: {
        userId: session.user.id,
        checkedInDate: today,
      },
    },
    create: {
      userId: session.user.id,
      mood,
      note: trimmedNote,
      checkedInDate: today,
    },
    update: {
      mood,
      note: trimmedNote,
      checkedInAt: new Date(),
    },
  })

  // Log engagement event for streak tracking
  await prisma.engagementEvent.create({
    data: {
      userId: session.user.id,
      kind: 'MOOD_LOGGED',
    },
  }).catch(() => {}) // non-blocking

  revalidatePath('/user')
  return { success: true }
}
