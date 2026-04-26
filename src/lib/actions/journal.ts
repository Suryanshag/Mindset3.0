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
