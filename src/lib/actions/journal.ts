'use server'

// PRIVACY: Journal entries are user-private. Therapists CANNOT read entries.
// Every mutation MUST verify session.user.id matches the entry owner.

import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createJournalEntry(formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Unauthorized' }

  const title = (formData.get('title') as string)?.trim() || null
  const body = (formData.get('body') as string)?.trim()
  const moodStr = formData.get('mood') as string | null
  const dateStr = formData.get('entryDate') as string | null

  if (!body) return { error: 'Body is required' }

  const mood = moodStr ? parseInt(moodStr, 10) : null
  const entryDate = dateStr ? new Date(dateStr) : new Date()

  const entry = await prisma.journalEntry.create({
    data: {
      userId: session.user.id,
      title,
      body,
      mood: mood && mood >= 1 && mood <= 5 ? mood : null,
      entryDate,
    },
  })

  // Log engagement event for streak tracking
  await prisma.engagementEvent.create({
    data: {
      userId: session.user.id,
      kind: 'JOURNAL_ENTRY_CREATED',
    },
  }).catch(() => {})

  revalidatePath('/user/practice/journal')
  revalidatePath('/user/practice')
  revalidatePath('/user')
  return { id: entry.id }
}

export async function updateJournalEntry(id: string, formData: FormData) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Unauthorized' }

  const existing = await prisma.journalEntry.findFirst({
    where: { id, userId: session.user.id },
  })
  if (!existing) return { error: 'Not found' }

  const title = (formData.get('title') as string)?.trim() || null
  const body = (formData.get('body') as string)?.trim()
  const moodStr = formData.get('mood') as string | null
  const dateStr = formData.get('entryDate') as string | null

  if (!body) return { error: 'Body is required' }

  const mood = moodStr ? parseInt(moodStr, 10) : null

  await prisma.journalEntry.update({
    where: { id },
    data: {
      title,
      body,
      mood: mood && mood >= 1 && mood <= 5 ? mood : null,
      ...(dateStr ? { entryDate: new Date(dateStr) } : {}),
    },
  })

  revalidatePath('/user/practice/journal')
  revalidatePath(`/user/practice/journal/${id}`)
  revalidatePath('/user/practice')
  return { success: true }
}

// ── Draft lifecycle ──────────────────────────────────────────────

export async function saveDraft(data: {
  title?: string
  body: string
  assignmentId?: string | null
}) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Unauthorized' }

  const existing = await prisma.journalEntry.findFirst({
    where: { userId: session.user.id, isDraft: true },
  })

  if (existing) {
    await prisma.journalEntry.update({
      where: { id: existing.id },
      data: {
        title: data.title?.trim() || null,
        body: data.body,
        assignmentId: data.assignmentId ?? null,
        draftUpdatedAt: new Date(),
      },
    })
    return { id: existing.id }
  }

  const entry = await prisma.journalEntry.create({
    data: {
      userId: session.user.id,
      title: data.title?.trim() || null,
      body: data.body,
      isDraft: true,
      assignmentId: data.assignmentId ?? null,
      draftUpdatedAt: new Date(),
      entryDate: new Date(),
    },
  })
  return { id: entry.id }
}

export async function publishDraft(
  draftId: string,
  options?: { assignmentId?: string }
) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Unauthorized' }

  const draft = await prisma.journalEntry.findFirst({
    where: { id: draftId, userId: session.user.id, isDraft: true },
  })
  if (!draft) return { error: 'Draft not found' }
  if (!draft.body.trim()) return { error: 'Cannot publish empty entry' }

  await prisma.journalEntry.update({
    where: { id: draftId },
    data: {
      isDraft: false,
      draftUpdatedAt: null,
      assignmentId: null,
      entryDate: new Date(),
    },
  })

  // If publishing as an assignment response
  if (options?.assignmentId) {
    const assignment = await prisma.assignment.findFirst({
      where: {
        id: options.assignmentId,
        userId: session.user.id,
        status: 'PENDING',
        type: 'JOURNAL_PROMPT',
      },
      include: { doctor: { include: { user: true } } },
    })

    if (assignment) {
      await prisma.assignmentResponse.create({
        data: {
          assignmentId: assignment.id,
          userId: session.user.id,
          responseText: draft.body,
        },
      })

      await prisma.assignment.update({
        where: { id: assignment.id },
        data: { status: 'COMPLETED' },
      })

      await prisma.engagementEvent.create({
        data: { userId: session.user.id, kind: 'ASSIGNMENT_COMPLETED' },
      }).catch(() => {})

      await prisma.notification.create({
        data: {
          userId: assignment.doctor.userId,
          kind: 'ASSIGNMENT_COMPLETED',
          title: 'Assignment completed',
          body: `${session.user.name ?? 'A patient'} completed "${assignment.title}"`,
          link: `/doctor/patients/${session.user.id}`,
        },
      }).catch(() => {})

      revalidatePath('/user/practice/assignments')
    }
  }

  await prisma.engagementEvent.create({
    data: { userId: session.user.id, kind: 'JOURNAL_ENTRY_CREATED' },
  }).catch(() => {})

  revalidatePath('/user/practice/journal')
  revalidatePath('/user/practice')
  revalidatePath('/user')
  revalidatePath('/user/reflection/today')
  return { id: draftId }
}

export async function discardDraft(draftId: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Unauthorized' }

  const draft = await prisma.journalEntry.findFirst({
    where: { id: draftId, userId: session.user.id, isDraft: true },
  })
  if (!draft) return { error: 'Draft not found' }

  await prisma.journalEntry.delete({ where: { id: draftId } })
  return { success: true }
}

export async function deleteJournalEntry(id: string) {
  const session = await auth()
  if (!session?.user?.id) return { error: 'Unauthorized' }

  const existing = await prisma.journalEntry.findFirst({
    where: { id, userId: session.user.id },
  })
  if (!existing) return { error: 'Not found' }

  await prisma.journalEntry.delete({ where: { id } })

  revalidatePath('/user/practice/journal')
  revalidatePath('/user/practice')
  return { success: true }
}
