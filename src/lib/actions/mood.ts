'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { dateOnlyIST } from '@/lib/format-date'
import { encryptField } from '@/lib/encryption'

// NOTE on pre-existing data: rows written before this fix may have
// drifted by one IST calendar day (server-local UTC midnight stored
// when user checked in between 18:30 UTC and 23:59 UTC). No backfill
// migration is planned — getTodaysMoodCheckIn / getLastWeekMoods now
// look up by the corrected IST key, so a small number of historical
// rows may appear under the wrong day. Acceptable: streak is the
// only feature reading this, and it self-heals within a few days of
// the user's first IST-aligned check-in.

export async function logMoodCheckIn(mood: number, note?: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Unauthorized' }

  if (mood < 1 || mood > 5) return { error: 'Invalid mood value' }

  // checkedInDate is @db.Date — stores the IST calendar day the
  // user checked in on. dateOnlyIST returns UTC midnight of that
  // IST day, which is the canonical @db.Date representation.
  const today = dateOnlyIST(new Date())

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
      noteEncrypted: encryptField(trimmedNote),
      checkedInDate: today,
    },
    update: {
      mood,
      note: trimmedNote,
      noteEncrypted: encryptField(trimmedNote),
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
