import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getJournalEntries } from '@/lib/queries/journal'
import Link from 'next/link'
import { ArrowLeft, Plus, BookOpen } from 'lucide-react'
import JournalFilters from '@/components/dashboard/journal/journal-filters'

const MOOD_EMOJI = ['', '😞', '😔', '😐', '🙂', '😊']

export default async function JournalListPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const params = await searchParams
  const search = typeof params.q === 'string' ? params.q : undefined
  const mood = typeof params.mood === 'string' ? parseInt(params.mood, 10) : undefined
  const from = typeof params.from === 'string' ? new Date(params.from) : undefined
  const to = typeof params.to === 'string' ? new Date(params.to) : undefined

  const entries = await getJournalEntries(session.user.id, {
    search,
    mood: mood && mood >= 1 && mood <= 5 ? mood : undefined,
    from,
    to,
  })

  // Group by month
  const grouped = new Map<string, typeof entries>()
  for (const entry of entries) {
    const key = entry.entryDate.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    })
    if (!grouped.has(key)) grouped.set(key, [])
    grouped.get(key)!.push(entry)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/user/practice" className="p-1">
            <ArrowLeft size={20} className="text-text-muted" />
          </Link>
          <h1 className="text-[16px] font-medium text-text">Journal</h1>
        </div>
        <Link
          href="/user/practice/journal/new"
          className="w-9 h-9 rounded-full bg-primary flex items-center justify-center"
        >
          <Plus size={18} className="text-white" />
        </Link>
      </div>

      <JournalFilters
        currentSearch={search}
        currentMood={mood}
      />

      {entries.length === 0 ? (
        <div className="flex flex-col items-center py-16">
          <BookOpen size={32} className="text-text-faint mb-3" />
          <p className="text-[15px] font-medium text-text-muted mb-1">
            Start writing
          </p>
          <p className="text-[13px] text-text-faint text-center max-w-[240px] mb-5">
            Your journal is private. Write freely — only you can see your entries.
          </p>
          <Link
            href="/user/practice/journal/new"
            className="px-5 py-2.5 rounded-full bg-primary text-white text-[13px] font-medium"
          >
            New entry
          </Link>
        </div>
      ) : (
        <div className="space-y-5">
          {Array.from(grouped.entries()).map(([month, items]) => (
            <div key={month}>
              <p className="text-[11px] font-medium text-text-faint uppercase tracking-wider mb-2">
                {month}
              </p>
              <div className="space-y-2">
                {items.map((entry) => (
                  <Link
                    key={entry.id}
                    href={`/user/practice/journal/${entry.id}`}
                    className="flex gap-3 bg-bg-card rounded-2xl p-3.5"
                    style={{ border: '0.5px solid var(--color-border)' }}
                  >
                    <div className="w-11 h-11 rounded-xl bg-primary-tint flex items-center justify-center shrink-0">
                      <span className="text-[18px] font-semibold text-primary leading-none">
                        {entry.entryDate.getDate()}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      {entry.title && (
                        <p className="text-[14px] font-medium text-text line-clamp-1">
                          {entry.title}
                        </p>
                      )}
                      <p className="text-[12px] text-text-muted line-clamp-2 mt-0.5">
                        {entry.body}
                      </p>
                    </div>
                    {entry.mood && (
                      <span className="text-[16px] shrink-0">
                        {MOOD_EMOJI[entry.mood]}
                      </span>
                    )}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
