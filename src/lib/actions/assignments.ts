'use server'

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function completeAssignment(
  assignmentId: string,
  formData: FormData
) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Unauthorized' }

  const assignment = await prisma.assignment.findFirst({
    where: { id: assignmentId, userId: session.user.id, status: 'PENDING' },
    include: { doctor: { include: { user: true } } },
  })
  if (!assignment) return { error: 'Assignment not found or already completed' }

  const responseText = (formData.get('responseText') as string)?.trim() || null
  const metadataStr = formData.get('metadata') as string | null
  const metadata = metadataStr ? JSON.parse(metadataStr) : null

  // Create response
  await prisma.assignmentResponse.create({
    data: {
      assignmentId,
      userId: session.user.id,
      responseText,
      metadata,
    },
  })

  // Mark assignment completed
  await prisma.assignment.update({
    where: { id: assignmentId },
    data: { status: 'COMPLETED' },
  })

  // If JOURNAL_PROMPT, also create a journal entry
  if (assignment.type === 'JOURNAL_PROMPT' && responseText) {
    await prisma.journalEntry.create({
      data: {
        userId: session.user.id,
        title: assignment.title,
        body: responseText,
        entryDate: new Date(),
      },
    })
    revalidatePath('/user/practice/journal')
  }

  // Notify the doctor
  await prisma.notification.create({
    data: {
      userId: assignment.doctor.userId,
      kind: 'ASSIGNMENT_COMPLETED',
      title: 'Assignment completed',
      body: `${session.user.name ?? 'A patient'} completed "${assignment.title}"`,
      link: `/doctor/patients/${session.user.id}`,
    },
  })

  revalidatePath('/user/practice/assignments')
  revalidatePath('/user/practice')
  revalidatePath('/user')
  return { success: true }
}

export async function skipAssignment(assignmentId: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Unauthorized' }

  const assignment = await prisma.assignment.findFirst({
    where: { id: assignmentId, userId: session.user.id, status: 'PENDING' },
  })
  if (!assignment) return { error: 'Not found' }

  await prisma.assignment.update({
    where: { id: assignmentId },
    data: { status: 'SKIPPED' },
  })

  revalidatePath('/user/practice/assignments')
  revalidatePath('/user/practice')
  revalidatePath('/user')
  return { success: true }
}
