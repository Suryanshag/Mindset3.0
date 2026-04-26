'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function registerForWorkshop(workshopId: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Unauthorized' }
  const userId = session.user.id

  // Fetch workshop + registration state inside transaction
  const result = await prisma.$transaction(async (tx) => {
    const workshop = await tx.workshop.findUnique({
      where: { id: workshopId },
      include: {
        _count: { select: { registrations: true } },
      },
    })

    if (!workshop) return { error: 'Workshop not found' }
    if (!workshop.published) return { error: 'Workshop not available' }
    if (workshop.startsAt < new Date()) return { error: 'Workshop has ended' }

    // Check already registered
    const existing = await tx.workshopRegistration.findUnique({
      where: { userId_workshopId: { userId, workshopId } },
    })
    if (existing) return { error: 'Already registered' }

    // Check capacity
    if (workshop.capacity && workshop._count.registrations >= workshop.capacity) {
      return { error: 'full' }
    }

    // Only handle free workshops here
    if (workshop.priceCents > 0) {
      return { error: 'Paid workshops require payment flow' }
    }

    // Register
    await tx.workshopRegistration.create({
      data: { userId, workshopId },
    })

    return {
      success: true,
      whatsappUrl: workshop.whatsappGroupUrl ?? null,
      title: workshop.title,
    }
  })

  if ('error' in result) return result

  // Post-transaction: engagement event + notification (non-blocking)
  await prisma.engagementEvent.create({
    data: {
      userId,
      kind: 'SESSION_ATTENDED', // closest kind — workshop attendance
      metadata: { workshopId },
    },
  }).catch(() => {})

  await prisma.notification.create({
    data: {
      userId,
      kind: 'WORKSHOP',
      title: "You're in!",
      body: `You've registered for ${result.title}`,
      link: `/user/discover/workshops/${workshopId}`,
    },
  }).catch(() => {})

  revalidatePath(`/user/discover/workshops/${workshopId}`)
  revalidatePath('/user/discover/workshops')
  revalidatePath('/user')
  return result
}
