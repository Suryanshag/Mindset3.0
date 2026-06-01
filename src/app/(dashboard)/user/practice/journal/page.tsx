import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import {
  getJournalEntries,
  getJournalStreak,
  getLastWeekJournal,
  getPendingJournalPrompt,
} from '@/lib/queries/journal'
import MobileJournalList from '@/components/mobile/journal-list'
import BJournalList from '@/components/dashboard/desktop/b-journal-list'

// Static rotation when the user has no pending JOURNAL_PROMPT assignment.
// Day-of-week cycle so the prompt feels fresh but stable within a day.
const STATIC_PROMPTS = [
  "What's one small thing that surprised you this week?",
  'What did your body need today that it didn’t get?',
  "What's a thought that's been louder than the others?",
  'What would you tell a younger you about this week?',
  'Where did you feel most yourself today?',
  "What's one boundary you held — or wish you had?",
  'What deserves more attention than you’re giving it?',
]

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

  // Mobile + desktop share the entry list; mobile additionally needs
  // the calendar strip + streak + today's prompt. Desktop also needs
  // the earliest-entry date for the "since X" line in the page header.
  const [entries, streak, weekJournal, pendingPrompt, earliest] = await Promise.all([
    getJournalEntries(session.user.id, {
      search,
      mood: mood && mood >= 1 && mood <= 5 ? mood : undefined,
      from,
      to,
    }),
    getJournalStreak(session.user.id).catch(() => 0),
    getLastWeekJournal(session.user.id).catch(
      () => [] as { date: Date; mood: 1 | 2 | 3 | 4 | 5 | null }[]
    ),
    getPendingJournalPrompt(session.user.id).catch(() => null),
    prisma.journalEntry
      .findFirst({
        where: { userId: session.user.id, isDraft: false },
        orderBy: { entryDate: 'asc' },
        select: { entryDate: true },
      })
      .catch(() => null),
  ])

  const todayPromptText =
    pendingPrompt?.title ??
    STATIC_PROMPTS[new Date().getDay() % STATIC_PROMPTS.length]
  const promptHref = pendingPrompt
    ? `/user/practice/assignments/${pendingPrompt.id}`
    : '/user/practice/journal/new'

  return (
    <>
      {/* Mobile — Phase 4 ported Journal list. */}
      <div className="lg:hidden">
        <MobileJournalList
          entries={entries.map((e) => ({
            id: e.id,
            title: e.title,
            body: e.body,
            mood: (e.mood as 1 | 2 | 3 | 4 | 5 | null) ?? null,
            entryDate: e.entryDate.toISOString(),
          }))}
          weekDays={weekJournal.map((w) => ({
            date: w.date.toISOString(),
            mood: w.mood,
          }))}
          streak={streak}
          prompt={{ text: todayPromptText, href: promptHref }}
        />
      </div>

      {/* Desktop — Phase 3d Direction B port. */}
      <div className="hidden lg:block">
        <BJournalList
          entries={entries.map((e) => ({
            id: e.id,
            title: e.title,
            body: e.body,
            mood: (e.mood as 1 | 2 | 3 | 4 | 5 | null) ?? null,
            entryDate: e.entryDate.toISOString(),
          }))}
          totalCount={entries.length}
          sinceDate={earliest?.entryDate ?? null}
        />
      </div>
    </>
  )
}
