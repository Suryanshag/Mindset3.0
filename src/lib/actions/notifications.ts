'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function markNotificationRead(notificationId: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Unauthorized' }

  await prisma.notification.updateMany({
    where: { id: notificationId, userId: session.user.id, readAt: null },
    data: { readAt: new Date() },
  })

  revalidatePath('/user/notifications')
  revalidatePath('/user')
  return { ok: true }
}

export async function markAllNotificationsRead() {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Unauthorized' }

  await prisma.notification.updateMany({
    where: { userId: session.user.id, readAt: null },
    data: { readAt: new Date() },
  })

  revalidatePath('/user/notifications')
  revalidatePath('/user')
  return { ok: true }
}
