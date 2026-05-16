import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Suspense } from 'react'
import Link from 'next/link'
import { Video, ChevronRight, CheckCircle } from 'lucide-react'
import TabControl from '@/components/dashboard/sessions/tab-control'
import PageHeader from '@/components/dashboard/page-header'

const doctorSelect = {
  designation: true,
  photo: true,
  user: { select: { name: true } },
}

function formatDate(d: Date): string {
  const now = new Date()
  const diffDays = Math.round(
    (d.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
  )
  const time = d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
  if (diffDays === 0) return `Today \u00b7 ${time}`
  if (diffDays === 1) return `Tomorrow \u00b7 ${time}`
  return `${d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })} \u00b7 ${time}`
}

function formatPastDate(d: Date): string {
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export default async function SessionsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const userId = session.user.id
  const params = await searchParams
  const tab = (params.tab as string) ?? 'upcoming'

  return (
    <div>
      <PageHeader title="Sessions" subtitle="Your appointments and notes" />

      <div className="pt-3.5">
        <Suspense>
          <TabControl />
        </Suspense>

        {tab === 'upcoming' && <UpcomingTab userId={userId} />}
        {tab === 'past' && <PastTab userId={userId} />}
        {tab === 'assignments' && <AssignmentsTab userId={userId} />}
      </div>
    </div>
  )
}

async function UpcomingTab({ userId }: { userId: string }) {
  const now = new Date()
  const sessions = await prisma.session.findMany({
    where: {
      userId,
      date: { gte: now },
      status: { in: ['PENDING', 'CONFIRMED'] },
    },
    select: {
      id: true,
      date: true,
      meetLink: true,
      status: true,
      notes: true,
      doctor: { select: doctorSelect },
    },
    orderBy: { date: 'asc' },
  })

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center py-16">
        <p className="text-[14px] text-text-muted">No upcoming sessions</p>
        <Link
          href="/doctors"
          className="mt-3 px-4 py-2 rounded-full bg-primary text-white text-[13px] font-medium"
        >
          Find a therapist
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-2.5">
      {sessions.map((s, i) => {
        const isFirst = i === 0
        const initials = s.doctor.user.name
          .split(' ')
          .map((w: string) => w[0])
          .join('')
          .slice(0, 2)

        if (isFirst) {
          // Hero card — same style as NextSessionCard.
          // Card-wide Link is an absolute overlay so the inner Join anchor
          // stays usable (anchors can't be nested in HTML).
          return (
            <div
              key={s.id}
              className="relative overflow-hidden rounded-2xl bg-primary p-4 transition-all duration-150 lg:hover:shadow-sm lg:hover:-translate-y-0.5"
            >
              <Link
                href={`/user/sessions/${s.id}`}
                aria-label={`View session with ${s.doctor.user.name}`}
                className="absolute inset-0 z-0 rounded-2xl"
              />
              <div className="absolute -top-6 -right-6 w-24 h-24 rounded-full bg-primary-soft opacity-40 pointer-events-none" />
              <div className="relative z-10 pointer-events-none">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-full bg-accent flex items-center justify-center shrink-0">
                    <span className="text-xs font-medium text-white">
                      {initials}
                    </span>
                  </div>
                  <div className="min-w-0">
                    <p className="text-[14px] font-medium text-white truncate">
                      {s.doctor.user.name}
                    </p>
                    <p className="text-[12px] text-white/60">
                      {s.doctor.designation}
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-3">
                  <p className="text-[13px] text-white/80">
                    {formatDate(s.date)}
                  </p>
                  {s.status === 'CONFIRMED' && s.meetLink && (
                    <a
                      href={s.meetLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-accent text-white text-[13px] font-medium relative z-20 pointer-events-auto"
                    >
                      <Video size={14} />
                      Join
                    </a>
                  )}
                </div>
              </div>
            </div>
          )
        }

        // Compact card
        return (
          <Link
            key={s.id}
            href={`/user/sessions/${s.id}`}
            className="flex items-center gap-3 lg:gap-4 bg-bg-card rounded-2xl p-3 lg:p-4 transition-colors duration-150 lg:hover:bg-white/80"
            style={{ border: '0.5px solid var(--color-border)' }}
          >
            <div className="w-9 h-9 lg:w-12 lg:h-12 rounded-full bg-primary-tint flex items-center justify-center shrink-0">
              <span className="text-xs lg:text-sm font-medium text-primary">
                {initials}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] lg:text-[15px] font-medium text-text truncate">
                {s.doctor.user.name}
              </p>
              <p className="text-[12px] lg:text-[13px] text-text-faint">
                {formatDate(s.date)}
              </p>
            </div>
            <ChevronRight size={16} className="text-text-faint shrink-0" />
          </Link>
        )
      })}
    </div>
  )
}

async function PastTab({ userId }: { userId: string }) {
  const now = new Date()
  const sessions = await prisma.session.findMany({
    where: {
      userId,
      OR: [
        { date: { lt: now } },
        { status: { in: ['COMPLETED', 'CANCELLED'] } },
      ],
    },
    select: {
      id: true,
      date: true,
      status: true,
      notes: true,
      doctor: { select: doctorSelect },
    },
    orderBy: { date: 'desc' },
    take: 20,
  })

  if (sessions.length === 0) {
    return (
      <div className="flex flex-col items-center py-16">
        <p className="text-[14px] text-text-muted">
          Your past sessions will appear here
        </p>
      </div>
    )
  }

  return (
    <div className="space-y-2.5">
      {sessions.map((s) => {
        const initials = s.doctor.user.name
          .split(' ')
          .map((w: string) => w[0])
          .join('')
          .slice(0, 2)

        return (
          <Link
            key={s.id}
            href={`/user/sessions/${s.id}`}
            className="flex items-start gap-3 lg:gap-4 bg-bg-card rounded-2xl p-3.5 lg:p-4 transition-colors duration-150 lg:hover:bg-white/80"
            style={{ border: '0.5px solid var(--color-border)' }}
          >
            <div className="w-9 h-9 lg:w-12 lg:h-12 rounded-full bg-primary-tint flex items-center justify-center shrink-0 mt-0.5">
              <span className="text-xs lg:text-sm font-medium text-primary">
                {initials}
              </span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] lg:text-[15px] font-medium text-text truncate">
                {s.doctor.user.name}
              </p>
              <p className="text-[12px] lg:text-[13px] text-text-faint">
                {formatPastDate(s.date)}
              </p>
              {s.notes && (
                <p className="text-[12px] lg:text-[13px] text-text-muted italic mt-1 line-clamp-2">
                  {s.notes}
                </p>
              )}
            </div>
            <ChevronRight size={16} className="text-text-faint shrink-0 mt-1" />
          </Link>
        )
      })}
    </div>
  )
}

async function AssignmentsTab({ userId }: { userId: string }) {
  const assignments = await prisma.assignment.findMany({
    where: { userId },
    select: {
      id: true,
      title: true,
      status: true,
      dueDate: true,
      doctor: { select: { user: { select: { name: true } } } },
    },
    orderBy: { dueDate: 'asc' },
  })

  if (assignments.length === 0) {
    return (
      <div className="flex flex-col items-center py-16">
        <p className="text-[14px] text-text-muted">
          Your therapist hasn't shared any exercises yet
        </p>
      </div>
    )
  }

  const due = assignments.filter((a) => a.status === 'PENDING')
  const completed = assignments.filter((a) => a.status !== 'PENDING')

  return (
    <div className="space-y-5">
      {due.length > 0 && (
        <div>
          <p className="text-[12px] font-medium text-text-faint uppercase tracking-wider mb-2">
            Due
          </p>
          <div className="space-y-2">
            {due.map((a) => (
              <Link
                key={a.id}
                href={`/user/sessions?tab=assignments`}
                className="flex items-center gap-3 lg:gap-4 bg-bg-card rounded-2xl p-3.5 lg:p-4 transition-colors duration-150 lg:hover:bg-white/80"
                style={{ border: '0.5px solid var(--color-border)' }}
              >
                <div className="w-8 h-8 rounded-full bg-accent-tint flex items-center justify-center shrink-0">
                  <span className="text-[11px] font-medium text-accent">
                    {a.dueDate
                      ? new Date(a.dueDate).toLocaleDateString('en-US', {
                          day: 'numeric',
                        })
                      : '?'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-medium text-text truncate">
                    {a.title}
                  </p>
                  <p className="text-[12px] text-text-faint">
                    from {a.doctor.user.name}
                    {a.dueDate &&
                      ` \u00b7 Due ${new Date(a.dueDate).toLocaleDateString(
                        'en-US',
                        { month: 'short', day: 'numeric' }
                      )}`}
                  </p>
                </div>
                <ChevronRight size={16} className="text-text-faint shrink-0" />
              </Link>
            ))}
          </div>
        </div>
      )}

      {completed.length > 0 && (
        <details>
          <summary className="text-[12px] font-medium text-text-faint uppercase tracking-wider mb-2 cursor-pointer list-none flex items-center gap-1">
            Completed ({completed.length})
            <ChevronRight size={12} className="text-text-faint" />
          </summary>
          <div className="space-y-2 mt-2">
            {completed.map((a) => (
              <div
                key={a.id}
                className="flex items-center gap-3 bg-bg-card rounded-2xl p-3.5 opacity-60"
                style={{ border: '0.5px solid var(--color-border)' }}
              >
                <CheckCircle size={18} className="text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-text truncate">{a.title}</p>
                  <p className="text-[12px] text-text-faint">
                    from {a.doctor.user.name}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  )
}
