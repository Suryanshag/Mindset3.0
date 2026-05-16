import { auth } from '@/lib/auth'
import Image from 'next/image'
import Link from 'next/link'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import PageHeader from '@/components/dashboard/page-header'
import CancelSessionButton from './cancel-button'
import SessionJoinCta from './session-join-cta'
import SessionUserNotes from './session-user-notes'
import RailPortal from '@/components/dashboard/desktop/rail-portal'
import SessionRail from '@/components/dashboard/desktop/session-rail'
import { formatSessionDateRelative } from '@/lib/format-date'

const SESSION_DURATION_MIN = 60

type SessionStatusKey = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED'

const STATUS_CHIP: Record<SessionStatusKey, { label: string; cls: string }> = {
  PENDING: { label: 'Pending', cls: 'bg-accent-tint text-accent' },
  CONFIRMED: { label: 'Confirmed', cls: 'bg-primary-tint text-primary' },
  COMPLETED: { label: 'Completed', cls: 'bg-bg-card text-text-faint' },
  CANCELLED: { label: 'Cancelled', cls: 'bg-red-100 text-red-700' },
}

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const authSession = await auth()
  if (!authSession?.user?.id) redirect('/login')

  const session = await prisma.session.findFirst({
    where: { id, userId: authSession.user.id },
    include: {
      doctor: {
        include: { user: { select: { name: true } } },
      },
    },
  })
  if (!session) notFound()

  const isPast = session.status === 'COMPLETED' || session.date < new Date()
  const relatedAssignments = isPast
    ? await prisma.assignment.findMany({
        where: {
          userId: authSession.user.id,
          doctorId: session.doctorId,
          createdAt: {
            gte: session.date,
            lte: new Date(session.date.getTime() + 48 * 60 * 60 * 1000),
          },
        },
        select: { id: true, title: true, status: true },
        take: 5,
      })
    : []

  const now = new Date()
  const isUpcoming =
    session.date > now &&
    (session.status === 'PENDING' || session.status === 'CONFIRMED')
  const isCancelled = session.status === 'CANCELLED'

  // Cancel: only if > 24 hours away
  const hoursUntil = (session.date.getTime() - now.getTime()) / (1000 * 60 * 60)
  const canCancel = isUpcoming && hoursUntil > 24

  const doctorName = session.doctor.user.name
  const doctorInitials = doctorName
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .slice(0, 2)

  const chip = STATUS_CHIP[session.status as SessionStatusKey] ?? STATUS_CHIP.PENDING

  return (
    <div>
      {/* Desktop right-rail: doctor card + book follow-up + cancel + related assignments */}
      <RailPortal>
        <SessionRail
          doctor={{
            name: doctorName,
            designation: session.doctor.designation,
            photo: session.doctor.photo,
          }}
          doctorId={session.doctorId}
          sessionId={session.id}
          canCancel={canCancel}
          assignments={relatedAssignments}
        />
      </RailPortal>

      <PageHeader title="Session details" back="/user/sessions" />

      <div className="space-y-5 pt-4">
        {/* 1. Doctor header */}
        <div
          className="flex items-center justify-between gap-3 bg-bg-card rounded-2xl p-4 lg:p-5"
          style={{ border: '0.5px solid var(--color-border)' }}
        >
          <div className="flex items-center gap-3 min-w-0">
            {session.doctor.photo ? (
              <Image
                width={64}
                height={64}
                src={session.doctor.photo}
                alt={doctorName}
                className="w-12 h-12 lg:w-16 lg:h-16 rounded-full object-cover shrink-0"
              />
            ) : (
              <div className="w-12 h-12 lg:w-16 lg:h-16 rounded-full bg-accent flex items-center justify-center shrink-0">
                <span className="text-sm lg:text-base font-medium text-white">{doctorInitials}</span>
              </div>
            )}
            <div className="min-w-0">
              <p className="text-base lg:text-xl font-medium text-text truncate">
                {doctorName}
              </p>
              <p className="text-sm text-text-muted truncate">
                {session.doctor.designation}
              </p>
            </div>
          </div>
          <span
            className={`shrink-0 text-[11px] font-medium uppercase tracking-[0.5px] px-2.5 py-1 rounded-full ${chip.cls}`}
          >
            {chip.label}
          </span>
        </div>

        {/* 2. Date + time + duration */}
        <p className="text-base text-text-muted">
          {formatSessionDateRelative(session.date)} · {SESSION_DURATION_MIN} min
        </p>

        {/* 3. Join CTA — drives off shared joinWindowState */}
        <SessionJoinCta
          startsAt={session.date}
          durationMin={SESSION_DURATION_MIN}
          status={session.status}
          meetLink={session.meetLink}
          doctorId={session.doctorId}
          doctorName={doctorName}
        />

        {/* 4. User notes — autosaves on blur */}
        <SessionUserNotes
          sessionId={session.id}
          initialValue={session.userNotes ?? ''}
        />

        {/* 5. Doctor's notes — only if completed and present */}
        {session.status === 'COMPLETED' && session.notes && (
          <div>
            <p className="text-[11px] font-medium text-text-faint uppercase tracking-[0.6px] mb-2">
              From your session
            </p>
            <div
              className="bg-bg-card rounded-2xl p-4"
              style={{ border: '0.5px solid var(--color-border)' }}
            >
              <p className="text-[14px] text-text whitespace-pre-wrap leading-relaxed">
                {session.notes}
              </p>
            </div>
          </div>
        )}

        {/* Cancel button — upcoming sessions only */}
        {isUpcoming && (
          canCancel ? (
            <CancelSessionButton sessionId={session.id} />
          ) : (
            <p className="text-[12px] text-text-faint text-center py-2">
              Can&apos;t cancel within 24 hours of start time.
            </p>
          )
        )}

        {/* Cancelled: Book again */}
        {isCancelled && (
          <Link
            href={`/user/sessions/book?doctorId=${session.doctorId}`}
            className="flex items-center justify-center w-full h-12 rounded-full bg-bg-card text-primary text-[14px] font-medium"
            style={{ border: '0.5px solid var(--color-border)' }}
          >
            Book again
          </Link>
        )}
      </div>
    </div>
  )
}
