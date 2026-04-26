'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function logMoodCheckIn(mood: number) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Unauthorized' }

  if (mood < 1 || mood > 5) return { error: 'Invalid mood value' }

  const today = new Date()
  today.setHours(0, 0, 0, 0)

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
      checkedInDate: today,
    },
    update: {
      mood,
      checkedInAt: new Date(),
    },
  })

  revalidatePath('/user')
  return { success: true }
}
