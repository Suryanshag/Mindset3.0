import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { getJournalEntry } from '@/lib/queries/journal'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import JournalCompose from '@/components/dashboard/journal/journal-compose'

export default async function EditJournalEntryPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const entry = await getJournalEntry(session.user.id, id)
  if (!entry) notFound()

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href={`/user/practice/journal/${id}`} className="p-1">
          <ArrowLeft size={20} className="text-text-muted" />
        </Link>
        <h1 className="text-[16px] font-medium text-text">Edit entry</h1>
      </div>

      <JournalCompose
        mode="edit"
        entryId={id}
        initial={{
          title: entry.title ?? '',
          body: entry.body,
          mood: entry.mood,
          entryDate: entry.entryDate.toISOString().split('T')[0],
        }}
      />
    </div>
  )
}
