import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { getJournalEntry } from '@/lib/queries/journal'
import Link from 'next/link'
import { Pencil } from 'lucide-react'
import JournalDeleteButton from '@/components/dashboard/journal/journal-delete-button'
import PageHeader from '@/components/dashboard/page-header'
import { MOODS } from '@/lib/constants/mood'
import MoodFace from '@/components/dashboard/mood-face'

export default async function JournalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const entry = await getJournalEntry(session.user.id, id)
  if (!entry) notFound()

  const dateStr = entry.entryDate.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <div>
      <PageHeader
        title={dateStr}
        back="/user/practice/journal"
        rightAction={
          <div className="flex items-center gap-2">
            <Link
              href={`/user/practice/journal/${id}/edit`}
              className="w-9 h-9 rounded-full bg-bg-card flex items-center justify-center"
              style={{ border: '1px solid var(--color-border)' }}
            >
              <Pencil size={14} className="text-text-muted" />
            </Link>
            <JournalDeleteButton entryId={id} />
          </div>
        }
      />

      <div className="space-y-3.5 pt-3.5 lg:max-w-[680px] lg:mx-auto lg:pt-6">
        {entry.mood && (
          <div className="flex items-center gap-2">
            <span
              className="w-11 h-11 rounded-full flex items-center justify-center"
              style={{
                backgroundColor: MOODS[entry.mood - 1]?.tint,
                color: MOODS[entry.mood - 1]?.stroke,
              }}
            >
              <MoodFace mood={entry.mood as 1 | 2 | 3 | 4 | 5} size={22} />
            </span>
          </div>
        )}

        {entry.title && (
          <h2 className="text-[20px] lg:text-[24px] font-semibold text-text">{entry.title}</h2>
        )}

        <div
          className="text-[16px] lg:text-[17px] text-text font-serif whitespace-pre-wrap"
          style={{ lineHeight: '1.8' }}
        >
          {entry.body}
        </div>
      </div>
    </div>
  )
}
