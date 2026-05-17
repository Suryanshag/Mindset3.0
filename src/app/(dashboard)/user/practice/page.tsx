import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { BookOpen, ClipboardList, ChevronRight } from 'lucide-react'
import PageHeader from '@/components/dashboard/page-header'
import MoodFace from '@/components/dashboard/mood-face'
import { MOODS } from '@/lib/constants/mood'
import { formatSessionDateRelative } from '@/lib/format-date'

export default async function PracticeHubPage() {
  // PERF-INVESTIGATION (temporary)
  const __t0 = Date.now()
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const userId = session.user.id

  const __tQ = Date.now()
  const [latestEntry, pendingCount, recentEntries, pendingAssignments] = await Promise.all([
    prisma.journalEntry
      .findFirst({
        where: { userId },
        orderBy: { entryDate: 'desc' },
        select: { entryDate: true },
      })
      .catch(() => null),
    prisma.assignment
      .count({ where: { userId, status: 'PENDING' } })
      .catch(() => 0),
    prisma.journalEntry
      .findMany({
        where: { userId },
        orderBy: { entryDate: 'desc' },
        take: 3,
        select: { id: true, title: true, body: true, mood: true, entryDate: true },
      })
      .catch(() => []),
    prisma.assignment
      .findMany({
        where: { userId, status: 'PENDING' },
        orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
        take: 3,
        include: { doctor: { include: { user: { select: { name: true } } } } },
      })
      .catch(() => []),
  ])
  console.log(`[PERF] /user/practice Promise.all (4 queries) ${Date.now() - __tQ}ms`)
  console.log(`[PERF] /user/practice TOTAL ${Date.now() - __t0}ms`)

  const sections = [
    {
      title: 'Journal',
      subtitle: latestEntry
        ? `Last entry: ${latestEntry.entryDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
        : 'Start writing',
      href: '/user/practice/journal',
      Icon: BookOpen,
      color: 'bg-primary-tint',
      iconColor: 'text-primary',
    },
    {
      title: 'Assignments',
      subtitle:
        pendingCount > 0
          ? `${pendingCount} pending`
          : 'All caught up',
      href: '/user/practice/assignments',
      Icon: ClipboardList,
      color: 'bg-accent-tint',
      iconColor: 'text-accent',
    },
  ]

  const statsLine = [
    latestEntry ? `${Math.max(0, Math.floor((Date.now() - latestEntry.entryDate.getTime()) / 86400000))}d since last entry` : null,
    pendingCount > 0 ? `${pendingCount} pending` : null,
  ].filter(Boolean).join(' · ')

  return (
    <div>
      <PageHeader title="Practice" subtitle="Your space between sessions" />

      <div className="space-y-3.5 pt-3.5">
        {statsLine && (
          <p className="text-[12px] text-text-muted">{statsLine}</p>
        )}

        <div className="space-y-2 lg:space-y-0 lg:grid lg:grid-cols-2 lg:gap-4">
          {sections.map((s) => (
            <Link
              key={s.title}
              href={s.href}
              className="flex items-center gap-3.5 lg:flex-col lg:items-start lg:gap-3 bg-bg-card rounded-2xl py-3.5 px-3.5 lg:p-5 lg:min-h-[160px] transition-all duration-150 lg:hover:shadow-sm lg:hover:-translate-y-0.5"
              style={{ border: '1px solid var(--color-border)' }}
            >
              <div
                className={`w-10 h-10 lg:w-11 lg:h-11 rounded-xl ${s.color} flex items-center justify-center shrink-0`}
              >
                <s.Icon size={20} className={s.iconColor} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-medium text-text">{s.title}</p>
                <p className="text-[12px] lg:text-[13px] text-text-muted lg:mt-1">{s.subtitle}</p>
              </div>
              <ChevronRight size={16} className="text-text-faint shrink-0 lg:hidden" />
            </Link>
          ))}
        </div>
      </div>

      {/* Section A — Recent journal entries */}
      {recentEntries.length > 0 && (
        <section className="mt-12">
          <p className="text-[11px] font-medium text-text-faint uppercase tracking-wider mb-2.5">
            Recent entries
          </p>
          <div className="space-y-2">
            {recentEntries.map((entry) => (
              <Link
                key={entry.id}
                href={`/user/practice/journal/${entry.id}`}
                className="flex gap-3 lg:gap-4 bg-bg-card rounded-2xl py-3 px-3.5 lg:p-4 transition-colors duration-150 lg:hover:bg-white/80"
                style={{ border: '1px solid var(--color-border)' }}
              >
                <div className="w-10 h-10 rounded-xl bg-primary-tint flex items-center justify-center shrink-0">
                  <span className="text-[17px] font-semibold text-primary leading-none">
                    {entry.entryDate.getDate()}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  {entry.title && (
                    <p className="text-[15px] font-medium text-text line-clamp-1">
                      {entry.title}
                    </p>
                  )}
                  <p className="text-[12px] text-text-muted line-clamp-2 mt-0.5">
                    {entry.body}
                  </p>
                </div>
                {entry.mood && (
                  <span
                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0"
                    style={{
                      backgroundColor: MOODS[entry.mood - 1]?.tint,
                      color: MOODS[entry.mood - 1]?.stroke,
                    }}
                  >
                    <MoodFace mood={entry.mood as 1 | 2 | 3 | 4 | 5} size={16} />
                  </span>
                )}
              </Link>
            ))}
          </div>
          <Link
            href="/user/practice/journal"
            className="inline-block text-[13px] text-primary font-medium mt-3 hover:underline"
          >
            View all entries →
          </Link>
        </section>
      )}

      {/* Section B — Pending assignments */}
      {pendingAssignments.length > 0 && (
        <section className="mt-10">
          <p className="text-[11px] font-medium text-text-faint uppercase tracking-wider mb-2.5">
            Pending from your therapist
          </p>
          <div className="space-y-2">
            {pendingAssignments.map((a) => (
              <Link
                key={a.id}
                href={`/user/practice/assignments/${a.id}`}
                className="flex items-center gap-3 lg:gap-4 bg-bg-card rounded-2xl py-3 px-3.5 lg:p-4 transition-colors duration-150 lg:hover:bg-white/80"
                style={{ border: '1px solid var(--color-border)' }}
              >
                <div className="w-9 h-9 rounded-xl bg-accent-tint flex items-center justify-center shrink-0">
                  <ClipboardList size={16} className="text-accent" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-medium text-text line-clamp-1">
                    {a.title}
                  </p>
                  <p className="text-[12px] text-text-muted">
                    From {a.doctor.user.name}
                    {a.dueDate && (
                      <> · Due {formatSessionDateRelative(a.dueDate)}</>
                    )}
                  </p>
                </div>
                <span className="text-[13px] text-primary font-medium shrink-0">
                  Open →
                </span>
              </Link>
            ))}
          </div>
          <Link
            href="/user/practice/assignments"
            className="inline-block text-[13px] text-primary font-medium mt-3 hover:underline"
          >
            View all assignments →
          </Link>
        </section>
      )}
    </div>
  )
}
