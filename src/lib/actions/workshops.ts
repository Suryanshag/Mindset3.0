'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { sendWorkshopRegistrationConfirmation } from '@/lib/email-service'

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
        presenter: { select: { name: true } },
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
      success: true as const,
      whatsappUrl: workshop.whatsappGroupUrl ?? null,
      title: workshop.title,
      startsAt: workshop.startsAt,
      durationMin: workshop.durationMin,
      presenterName: workshop.presenter?.name ?? workshop.instructorName ?? 'Mindset',
    }
  }, { maxWait: 8000, timeout: 15000 })

  if ('error' in result) return result

  // Post-transaction: engagement event + notification + email (non-blocking)
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
      kind: 'WORKSHOP_REGISTRATION_CONFIRMED',
      title: "You're in!",
      body: `You've registered for ${result.title}`,
      link: `/user/discover/workshops/${workshopId}`,
    },
  }).catch(() => {})

  // TODO(presenter-notifications): when Presenter model gains an `email`
  // field, also send a "new registration" email to the presenter here.
  // Blocked on schema — see docs/known-bugs.md.

  // Email — retrofit per the audit. Free flow used to silently send nothing;
  // now it shares the same template the paid flow uses (amount=0 hides the
  // "Amount paid" row in the email body).
  try {
    const userRow = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, email: true },
    })
    if (userRow) {
      sendWorkshopRegistrationConfirmation(userRow.email, {
        userName: userRow.name ?? 'there',
        workshopTitle: result.title,
        startsAt: result.startsAt,
        durationMin: result.durationMin,
        presenterName: result.presenterName,
        amount: 0,
        workshopId,
      })
    }
  } catch (err) {
    console.error('[WORKSHOP_FREE] Confirmation email failed:', err)
  }

  revalidatePath(`/user/discover/workshops/${workshopId}`)
  revalidatePath('/user/discover/workshops')
  revalidatePath('/user')
  return result
}
