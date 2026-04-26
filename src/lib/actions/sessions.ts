'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function cancelSession(sessionId: string) {
  const authSession = await auth()
  if (!authSession?.user?.id) return { error: 'Unauthorized' }

  const session = await prisma.session.findFirst({
    where: { id: sessionId, userId: authSession.user.id },
    include: { doctor: { select: { userId: true } } },
  })

  if (!session) return { error: 'Session not found' }
  if (session.status === 'CANCELLED') return { error: 'Already cancelled' }
  if (session.status === 'COMPLETED') return { error: 'Cannot cancel a completed session' }

  // Must be more than 24 hours out
  const hoursUntil = (session.date.getTime() - Date.now()) / (1000 * 60 * 60)
  if (hoursUntil <= 24) {
    return { error: "Sessions can't be cancelled within 24 hours of the start time" }
  }

  await prisma.session.update({
    where: { id: sessionId },
    data: { status: 'CANCELLED' },
  })

  // Notify the doctor
  await prisma.notification.create({
    data: {
      userId: session.doctor.userId,
      kind: 'SESSION_REMINDER',
      title: 'Session cancelled',
      body: 'A patient has cancelled their upcoming session.',
      link: `/doctor/calendar`,
    },
  }).catch(() => {})

  revalidatePath('/user/sessions')
  revalidatePath(`/user/sessions/${sessionId}`)
  revalidatePath('/user')
  return { success: true }
}
