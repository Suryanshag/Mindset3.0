import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Pencil } from 'lucide-react'
import JournalDeleteButton from '@/components/dashboard/journal/journal-delete-button'
import PageHeader from '@/components/dashboard/page-header'
import { MOODS } from '@/lib/constants/mood'
import MoodFace from '@/components/dashboard/mood-face'
import { getJournalEntry } from '@/lib/queries/journal'
import BJournalRead from '@/components/dashboard/desktop/b-journal-read'

export default async function JournalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const [entry, allIds] = await Promise.all([
    getJournalEntry(session.user.id, id),
    prisma.journalEntry
      .findMany({
        where: { userId: session.user.id, isDraft: false },
        select: { id: true },
        orderBy: { entryDate: 'desc' },
      })
      .catch(() => [] as { id: string }[]),
  ])
  if (!entry) notFound()

  const currentIndex = allIds.findIndex((e) => e.id === id)
  // List is sorted newest-first: the "previous" entry chronologically
  // is at currentIndex + 1; "next" is currentIndex - 1.
  const prevEntryId =
    currentIndex >= 0 && currentIndex < allIds.length - 1 ? allIds[currentIndex + 1].id : null
  const nextEntryId = currentIndex > 0 ? allIds[currentIndex - 1].id : null

  const dateStr = entry.entryDate.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  return (
    <>
      {/* Mobile — unchanged from prior phases. */}
      <div className="lg:hidden">
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

        <div className="space-y-3.5 pt-3.5">
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
            <h2 className="text-[20px] font-semibold text-text">{entry.title}</h2>
          )}

          <div
            className="text-[16px] text-text font-serif whitespace-pre-wrap"
            style={{ lineHeight: '1.8' }}
          >
            {entry.body}
          </div>
        </div>
      </div>

      {/* Desktop — Phase 3d Direction B port. */}
      <div className="hidden lg:block">
        <BJournalRead
          entry={{
            id: entry.id,
            title: entry.title,
            body: entry.body,
            mood: (entry.mood as 1 | 2 | 3 | 4 | 5 | null) ?? null,
            entryDate: entry.entryDate,
            createdAt: entry.createdAt,
          }}
          prevEntryId={prevEntryId}
          nextEntryId={nextEntryId}
        />
      </div>
    </>
  )
}
