'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { sendNgoJoinConfirmation } from '@/lib/email-service'

type RegisterResult =
  | { error: string }
  | { error: 'INCOMPLETE_PROFILE'; missing: string[] }
  | { success: true; whatsappLink: string | null; whatsappLabel: string | null }

export async function registerForNgoVisit(ngoVisitId: string): Promise<RegisterResult> {
  const session = await auth()
  if (!session?.user?.id || !session.user.email) {
    return { error: 'Unauthorized' }
  }
  const userId = session.user.id

  const txResult = await prisma.$transaction(
    async (tx) => {
      const visit = await tx.ngoVisit.findUnique({ where: { id: ngoVisitId } })
      if (!visit) return { error: 'NGO visit not found' as const }
      if (!visit.isPublished) {
        return { error: 'This NGO visit is not currently open for registration' as const }
      }
      if (visit.visitDate < new Date()) {
        return { error: 'This NGO visit has already happened' as const }
      }

      const existing = await tx.ngoJoinRequest.findUnique({
        where: { userId_ngoVisitId: { userId, ngoVisitId } },
      })
      if (existing) return { error: 'You are already registered for this visit' as const }

      const user = await tx.user.findUnique({
        where: { id: userId },
        select: { name: true, email: true, phone: true, dateOfBirth: true },
      })
      if (!user) return { error: 'User not found' as const }

      // Dashboard one-click flow only requires name (always present on login)
      // + email (NextAuth guarantees) + phone. Anything beyond that is optional.
      const missing: string[] = []
      if (!user.name) missing.push('name')
      if (!user.phone) missing.push('phone')
      if (missing.length > 0) {
        return { error: 'INCOMPLETE_PROFILE' as const, missing }
      }

      // Age gate — Terms require volunteers to be 18+. The one-click flow
      // can't ask for age, so we derive it from the profile DOB. Compare by
      // calendar against the 18th birthday rather than dividing elapsed ms
      // by 365.25 days — that drift puts someone *below* 18 on their actual
      // birthday (an 18-year span holds only ~4 leap days), wrongly blocking
      // a user who just turned 18.
      if (!user.dateOfBirth) return { error: 'dob_required' as const }
      const dob = user.dateOfBirth
      const eighteenthBirthday = new Date(
        dob.getFullYear() + 18,
        dob.getMonth(),
        dob.getDate(),
      )
      if (new Date() < eighteenthBirthday) return { error: 'age_restricted' as const }

      // Capacity — count everyone not cancelled. null capacity = unlimited.
      if (visit.capacity != null) {
        const count = await tx.ngoJoinRequest.count({
          where: { ngoVisitId, status: { not: 'CANCELLED' } },
        })
        if (count >= visit.capacity) return { error: 'full' as const }
      }

      await tx.ngoJoinRequest.create({
        data: {
          userId,
          ngoVisitId,
          name: user.name!,
          email: user.email,
          phone: user.phone!,
          age: null,
          interest: 'Volunteer with Mindset',
        },
      })

      return { success: true as const, visit }
    },
    { maxWait: 8000, timeout: 15000 },
  )

  if (!('visit' in txResult) || !txResult.visit) {
    if ('error' in txResult && txResult.error === 'INCOMPLETE_PROFILE') {
      return { error: 'INCOMPLETE_PROFILE', missing: txResult.missing }
    }
    return { error: 'error' in txResult ? txResult.error : 'Registration failed' }
  }

  const visit = txResult.visit
  const whatsappLink = await prisma.whatsappLink.findFirst({
    select: { link: true, label: true },
  })

  sendNgoJoinConfirmation(session.user.email, {
    userName: session.user.name ?? 'there',
    ngoName: visit.ngoName,
    visitDate: visit.visitDate,
    location: visit.location,
    whatsappLink: whatsappLink?.link ?? null,
  })

  await prisma.notification
    .create({
      data: {
        userId,
        kind: 'WORKSHOP',
        title: "You're registered!",
        body: `You've signed up for ${visit.ngoName} on ${visit.visitDate.toLocaleDateString('en-IN')}`,
        link: `/user/discover/ngo-visits/${ngoVisitId}`,
      },
    })
    .catch(() => {})

  revalidatePath(`/user/discover/ngo-visits/${ngoVisitId}`)
  revalidatePath('/user/discover/ngo-visits')
  revalidatePath('/user')

  return {
    success: true,
    whatsappLink: whatsappLink?.link ?? null,
    whatsappLabel: whatsappLink?.label ?? null,
  }
}
