import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { BookOpen, ClipboardList, Wind, ChevronRight } from 'lucide-react'
import PageHeader from '@/components/dashboard/page-header'

export default async function PracticeHubPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const userId = session.user.id

  const [latestEntry, pendingCount] = await Promise.all([
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
  ])

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
    {
      title: 'Mindfulness',
      subtitle: 'Coming soon',
      href: '#',
      Icon: Wind,
      color: 'bg-purple-tint',
      iconColor: 'text-purple-600',
      disabled: true,
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
          <p className="text-[12px] text-text-faint">{statsLine}</p>
        )}

        <div className="space-y-2">
          {sections.map((s) => {
            const Wrapper = s.disabled ? 'div' : Link
            return (
              <Wrapper
                key={s.title}
                href={s.href}
                className={`flex items-center gap-3.5 bg-bg-card rounded-2xl py-3.5 px-3.5 ${
                  s.disabled ? 'opacity-50' : ''
                }`}
                style={{ border: '0.5px solid var(--color-border)' }}
              >
                <div
                  className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center shrink-0`}
                >
                  <s.Icon size={20} className={s.iconColor} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[15px] font-medium text-text">{s.title}</p>
                  <p className="text-[12px] text-text-faint">{s.subtitle}</p>
                </div>
                {!s.disabled && (
                  <ChevronRight size={16} className="text-text-faint shrink-0" />
                )}
              </Wrapper>
            )
          })}
        </div>
      </div>
    </div>
  )
}
