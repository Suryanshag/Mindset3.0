import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Suspense } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { ChevronRight, CheckCircle } from 'lucide-react'
import TabControl from '@/components/dashboard/sessions/tab-control'
import PageHeader from '@/components/dashboard/page-header'
import { formatSessionDateRelative, formatSessionDate } from '@/lib/format-date'
import { joinWindowState } from '@/lib/session-window'
import MobileSessions from '@/components/mobile/sessions'

const SESSION_DURATION_MIN = 60

const doctorSelect = {
  designation: true,
  photo: true,
  user: { select: { name: true } },
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
  const mobileTab: 'upcoming' | 'find' | 'past' =
    tab === 'find' || tab === 'past' ? tab : 'upcoming'

  // Mobile fetches all 3 datasets up-front so the client-side tab
  // switch is instant (no per-tab network round-trip). Desktop keeps
  // its tab-scoped fetching since each tab is its own server component.
  const now = new Date()
  const [mobileUpcoming, mobilePast, mobileDoctors] = await Promise.all([
    prisma.session.findMany({
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
        doctor: { select: doctorSelect },
      },
      orderBy: { date: 'asc' },
    }),
    prisma.session.findMany({
      where: {
        userId,
        OR: [
          { date: { lt: now } },
          { status: { in: ['COMPLETED', 'CANCELLED', 'NO_SHOW'] } },
        ],
      },
      select: {
        id: true,
        date: true,
        meetLink: true,
        status: true,
        doctor: { select: doctorSelect },
      },
      orderBy: { date: 'desc' },
      take: 20,
    }),
    prisma.doctor.findMany({
      where: { isActive: true },
      select: {
        id: true,
        photo: true,
        designation: true,
        type: true,
        specialization: true,
        experience: true,
        sessionPrice: true,
        user: { select: { name: true } },
      },
      orderBy: { createdAt: 'asc' },
    }),
  ])

  return (
    <>
      {/* Mobile — ported Phase 3 sessions surface with 3 tabs. */}
      <div className="lg:hidden">
        <MobileSessions
          initialTab={mobileTab}
          upcoming={mobileUpcoming.map((s) => ({
            id: s.id,
            date: s.date.toISOString(),
            status: s.status as 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW',
            meetLink: s.meetLink,
            doctor: {
              photo: s.doctor.photo,
              designation: s.doctor.designation,
              user: { name: s.doctor.user.name },
            },
          }))}
          past={mobilePast.map((s) => ({
            id: s.id,
            date: s.date.toISOString(),
            status: s.status as 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW',
            meetLink: s.meetLink,
            doctor: {
              photo: s.doctor.photo,
              designation: s.doctor.designation,
              user: { name: s.doctor.user.name },
            },
          }))}
          doctors={mobileDoctors.map((d) => ({
            id: d.id,
            photo: d.photo,
            designation: d.designation,
            type: d.type as 'COUNSELOR' | 'PSYCHOLOGIST',
            specialization: d.specialization,
            experience: d.experience,
            sessionPrice: Number(d.sessionPrice),
            user: { name: d.user.name },
          }))}
        />
      </div>

      {/* Desktop — existing layout unchanged. */}
      <div className="hidden lg:block">
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
    </>
  )
}

type UpcomingSession = {
  id: string
  date: Date
  meetLink: string | null
  status: string
  doctorId: string
  doctor: { designation: string | null; photo: string | null; user: { name: string } }
}

/** "Join in 3 days" / "Join in 5 hours" / "Join in 25 min" */
function formatJoinIn(date: Date): string {
  const ms = date.getTime() - Date.now()
  if (ms <= 0) return 'Join now'
  const minutes = Math.floor(ms / 60000)
  if (minutes < 60) return `Join in ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Join in ${hours} ${hours === 1 ? 'hour' : 'hours'}`
  const days = Math.floor(hours / 24)
  return `Join in ${days} ${days === 1 ? 'day' : 'days'}`
}

function StatusBadge({ session }: { session: UpcomingSession }) {
  const state = joinWindowState(session.date, SESSION_DURATION_MIN, session.status)

  if (state === 'cancelled') {
    return (
      <span className="text-[12px] font-medium px-3 py-1 rounded-full bg-red-100 text-red-700 shrink-0">
        Cancelled
      </span>
    )
  }

  if (state === 'open') {
    if (!session.meetLink) {
      return (
        <span className="text-[12px] font-medium px-3 py-1 rounded-full bg-amber-100 text-amber-800 shrink-0">
          Awaiting Meet link
        </span>
      )
    }
    return (
      <span className="text-[12px] font-medium px-3 py-1 rounded-full bg-primary-tint text-primary shrink-0">
        Join now
      </span>
    )
  }

  if (state === 'ended') {
    return (
      <span className="text-[12px] font-medium px-3 py-1 rounded-full bg-bg-app text-text-muted shrink-0">
        Ended
      </span>
    )
  }

  // too_early — show countdown
  return (
    <span className="text-[12px] font-medium px-3 py-1 rounded-full bg-primary-tint text-primary shrink-0">
      {formatJoinIn(session.date)}
    </span>
  )
}

function SessionCard({ s }: { s: UpcomingSession }) {
  const initials = s.doctor.user.name
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .slice(0, 2)

  return (
    <Link
      href={`/user/sessions/${s.id}`}
      className="flex items-center gap-3 lg:gap-4 bg-bg-card rounded-2xl p-4 transition-colors duration-150 lg:hover:bg-white/80"
      style={{ border: '1px solid var(--color-border-strong)' }}
    >
      {s.doctor.photo ? (
        <Image
          src={s.doctor.photo}
          alt={s.doctor.user.name}
          width={48}
          height={48}
          className="w-10 h-10 lg:w-12 lg:h-12 rounded-full object-cover shrink-0"
        />
      ) : (
        <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-primary-tint flex items-center justify-center shrink-0">
          <span className="text-[13px] font-medium text-primary">{initials}</span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="text-[16px] font-medium text-text truncate">
          {s.doctor.user.name}
        </p>
        <p className="text-[13px] text-text-muted">
          {formatSessionDateRelative(s.date)}
        </p>
      </div>
      <StatusBadge session={s} />
    </Link>
  )
}

async function UpcomingTab({ userId }: { userId: string }) {
  const now = new Date()
  const [sessions, primaryDoctor] = await Promise.all([
    prisma.session.findMany({
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
        doctorId: true,
        doctor: { select: doctorSelect },
      },
      orderBy: { date: 'asc' },
    }),
    // Primary therapist = the doctor on the user's most-recent session
    // (upcoming or past). Used by the "Book another" CTA below.
    prisma.session.findFirst({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      select: {
        doctorId: true,
        doctor: { select: { user: { select: { name: true } } } },
      },
    }),
  ])

  if (sessions.length === 0) {
    return (
      <div>
        <div className="flex flex-col items-center py-16">
          <p className="text-[14px] text-text-muted">No upcoming sessions</p>
          <Link
            href="/user/sessions/book"
            className="mt-3 px-4 py-2 rounded-full bg-primary text-white text-[13px] font-medium"
          >
            Find a therapist
          </Link>
        </div>
        <BookAnotherCta primaryDoctor={primaryDoctor} />
      </div>
    )
  }

  return (
    <div>
      <div className="space-y-2.5">
        {sessions.map((s) => (
          <SessionCard key={s.id} s={s} />
        ))}
      </div>
      <BookAnotherCta primaryDoctor={primaryDoctor} />
    </div>
  )
}

/** "Dr. Ananya" from "Dr. Ananya Sharma"; "Ananya" from "Ananya Sharma". */
function bookButtonName(fullName: string): string {
  const parts = fullName.split(' ').filter(Boolean)
  if (parts.length >= 2 && /^Dr\.?$/i.test(parts[0])) {
    return `Dr. ${parts[1]}`
  }
  return parts[0] ?? fullName
}

function BookAnotherCta({
  primaryDoctor,
}: {
  primaryDoctor: { doctorId: string; doctor: { user: { name: string } } } | null
}) {
  return (
    <section className="mt-10">
      <p className="text-[15px] font-medium text-text">Want to book your next one?</p>
      <p className="text-[13px] text-text-muted mt-1">
        {primaryDoctor
          ? 'Continue with your current therapist or browse all therapists.'
          : 'Browse our therapists and find someone who fits.'}
      </p>
      <div className="flex flex-wrap items-center gap-3 mt-3">
        {primaryDoctor && (
          <Link
            href={`/user/sessions/book?doctorId=${primaryDoctor.doctorId}`}
            className="inline-flex items-center whitespace-nowrap px-4 py-2 rounded-full bg-primary text-white text-[13px] font-medium"
          >
            Book with {bookButtonName(primaryDoctor.doctor.user.name)}
          </Link>
        )}
        <Link
          href="/user/sessions/book"
          className={`inline-flex items-center whitespace-nowrap px-4 py-2 rounded-full text-[13px] font-medium ${
            primaryDoctor
              ? 'bg-bg-card text-text'
              : 'bg-primary text-white'
          }`}
          style={
            primaryDoctor
              ? { border: '1px solid var(--color-border-strong)' }
              : undefined
          }
        >
          Browse all therapists
        </Link>
      </div>
    </section>
  )
}

async function PastTab({ userId }: { userId: string }) {
  const now = new Date()
  const sessions = await prisma.session.findMany({
    where: {
      userId,
      OR: [
        { date: { lt: now } },
        { status: { in: ['COMPLETED', 'CANCELLED', 'NO_SHOW'] } },
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
        const statusLabel =
          s.status === 'CANCELLED' ? 'Cancelled' :
          s.status === 'COMPLETED' ? 'Completed' :
          s.status === 'NO_SHOW' ? 'Marked no-show' :
          'Ended'
        const statusCls =
          s.status === 'CANCELLED'
            ? 'bg-red-100 text-red-700'
            : 'bg-bg-app text-text-muted'

        return (
          <Link
            key={s.id}
            href={`/user/sessions/${s.id}`}
            className="flex items-start gap-3 lg:gap-4 bg-bg-card rounded-2xl p-4 transition-colors duration-150 lg:hover:bg-white/80"
            style={{ border: '1px solid var(--color-border-strong)' }}
          >
            {s.doctor.photo ? (
              <Image
                src={s.doctor.photo}
                alt={s.doctor.user.name}
                width={48}
                height={48}
                className="w-10 h-10 lg:w-12 lg:h-12 rounded-full object-cover shrink-0 mt-0.5"
              />
            ) : (
              <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-full bg-primary-tint flex items-center justify-center shrink-0 mt-0.5">
                <span className="text-[13px] font-medium text-primary">{initials}</span>
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-[16px] font-medium text-text truncate">
                {s.doctor.user.name}
              </p>
              <p className="text-[13px] text-text-muted">
                {formatSessionDate(s.date)}
              </p>
              {s.notes && (
                <p className="text-[12px] lg:text-[13px] text-text-muted italic mt-1 line-clamp-2">
                  {s.notes}
                </p>
              )}
            </div>
            <span className={`text-[12px] font-medium px-3 py-1 rounded-full shrink-0 ${statusCls}`}>
              {statusLabel}
            </span>
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
          Your therapist hasn&apos;t shared any exercises yet
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
                style={{ border: '1px solid var(--color-border-strong)' }}
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
                  <p className="text-[12px] text-text-muted">
                    from {a.doctor.user.name}
                    {a.dueDate &&
                      ` · Due ${new Date(a.dueDate).toLocaleDateString(
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
                style={{ border: '1px solid var(--color-border)' }}
              >
                <CheckCircle size={18} className="text-primary shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] text-text truncate">{a.title}</p>
                  <p className="text-[12px] text-text-muted">
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
