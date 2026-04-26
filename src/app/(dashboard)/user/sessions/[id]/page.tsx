import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Video, Calendar, Clock, CheckCircle, XCircle, ChevronRight } from 'lucide-react'
import PageHeader from '@/components/dashboard/page-header'
import CancelSessionButton from './cancel-button'
import ChapterView from '@/components/dashboard/desktop/chapter-view'
import RailPortal from '@/components/dashboard/desktop/rail-portal'
import SessionRail from '@/components/dashboard/desktop/session-rail'
import { getChapterData } from '@/lib/queries/reflection'

export default async function SessionDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const authSession = await auth()
  if (!authSession?.user?.id) redirect('/login')

  const [session, chapterData] = await Promise.all([
    prisma.session.findFirst({
      where: { id, userId: authSession.user.id },
      include: {
        doctor: {
          include: { user: { select: { name: true } } },
        },
      },
    }),
    getChapterData(authSession.user.id, id).catch(() => null),
  ])

  if (!session) notFound()

  const now = new Date()
  const isUpcoming =
    session.date > now &&
    (session.status === 'PENDING' || session.status === 'CONFIRMED')
  const isPast = session.status === 'COMPLETED' || session.date < now
  const isCancelled = session.status === 'CANCELLED'

  // Join button: enabled 15 min before to 15 min after (assume 60 min session)
  const fifteenMin = 15 * 60 * 1000
  const sessionEnd = new Date(session.date.getTime() + 60 * 60 * 1000)
  const joinEnabled =
    isUpcoming &&
    session.status === 'CONFIRMED' &&
    session.meetLink &&
    now.getTime() >= session.date.getTime() - fifteenMin &&
    now.getTime() <= sessionEnd.getTime() + fifteenMin

  const joinDisabledReason =
    now.getTime() < session.date.getTime() - fifteenMin
      ? 'Join opens 15 min before your session'
      : now.getTime() > sessionEnd.getTime() + fifteenMin
        ? 'Session has ended'
        : !session.meetLink
          ? 'Meeting link not available yet'
          : null

  // Cancel: only if > 24 hours away
  const hoursUntil = (session.date.getTime() - now.getTime()) / (1000 * 60 * 60)
  const canCancel = isUpcoming && hoursUntil > 24

  const doctorName = session.doctor.user.name
  const doctorInitials = doctorName
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .slice(0, 2)

  // Related assignments (created within 48h after session)
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

  return (
    <>
      {/* Mobile: existing session detail */}
      <div className="lg:hidden">
        <PageHeader title="Session details" back="/user/sessions" />

        <div className="space-y-3.5 pt-5">
          {/* Doctor card */}
          <div
            className="bg-bg-card rounded-2xl p-4"
            style={{ border: '0.5px solid var(--color-border)' }}
          >
            <div className="flex items-center gap-3">
              {session.doctor.photo ? (
                <img
                  src={session.doctor.photo}
                  alt={doctorName}
                  className="w-14 h-14 rounded-full object-cover shrink-0"
                />
              ) : (
                <div className="w-14 h-14 rounded-full bg-accent flex items-center justify-center shrink-0">
                  <span className="text-sm font-medium text-white">{doctorInitials}</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-[16px] font-medium text-text">{doctorName}</p>
                <p className="text-[13px] text-text-muted">{session.doctor.designation}</p>
              </div>
            </div>
          </div>

          {/* Status line */}
          {isCancelled && (
            <div className="flex items-center gap-2 px-1">
              <XCircle size={16} className="text-red-500" />
              <p className="text-[13px] text-red-600 font-medium">Cancelled</p>
            </div>
          )}
          {isPast && !isCancelled && (
            <div className="flex items-center gap-2 px-1">
              <CheckCircle size={16} className="text-primary" />
              <p className="text-[13px] text-primary font-medium">
                Completed on{' '}
                {session.date.toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>
          )}

          {/* Session info */}
          <div
            className="bg-bg-card rounded-2xl p-4 space-y-3"
            style={{ border: '0.5px solid var(--color-border)' }}
          >
            <div className="flex items-center gap-3">
              <Calendar size={16} className="text-text-faint shrink-0" />
              <p className="text-[14px] text-text">
                {session.date.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Clock size={16} className="text-text-faint shrink-0" />
              <p className="text-[14px] text-text">
                {session.date.toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                })}
                {' '}&middot; 60 min
              </p>
            </div>
            {session.status === 'PENDING' && (
              <p className="text-[12px] text-accent-deep bg-accent-tint px-3 py-1.5 rounded-lg inline-block">
                Awaiting confirmation
              </p>
            )}
          </div>

          {/* Upcoming: Join + Cancel buttons */}
          {isUpcoming && (
            <div className="space-y-2.5">
              {session.meetLink ? (
                joinEnabled ? (
                  <a
                    href={session.meetLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center justify-center gap-2 w-full h-[48px] rounded-full bg-primary text-white text-[14px] font-medium"
                  >
                    <Video size={18} />
                    Join session
                  </a>
                ) : (
                  <div className="flex items-center justify-center gap-2 w-full h-[48px] rounded-full bg-bg-card text-text-faint text-[14px] font-medium"
                    style={{ border: '0.5px solid var(--color-border)' }}
                  >
                    <Video size={18} />
                    {joinDisabledReason}
                  </div>
                )
              ) : (
                <div className="flex items-center justify-center gap-2 w-full h-[48px] rounded-full bg-bg-card text-text-faint text-[14px] font-medium"
                  style={{ border: '0.5px solid var(--color-border)' }}
                >
                  <Video size={18} />
                  Meeting link not available yet
                </div>
              )}

              {canCancel ? (
                <CancelSessionButton sessionId={session.id} />
              ) : (
                <div className="flex items-center justify-center w-full h-[44px] rounded-full bg-bg-card text-text-faint text-[13px]"
                  style={{ border: '0.5px solid var(--color-border)' }}
                >
                  Can&apos;t cancel within 24 hours of start time
                </div>
              )}
            </div>
          )}

          {/* Past: related assignments */}
          {isPast && !isCancelled && relatedAssignments.length > 0 && (
            <div>
              <p className="text-[12px] font-medium text-text-faint uppercase tracking-wider mb-2">
                Assignments from this session
              </p>
              <div
                className="bg-bg-card rounded-2xl overflow-hidden"
                style={{ border: '0.5px solid var(--color-border)' }}
              >
                {relatedAssignments.map((a, i) => (
                  <Link
                    key={a.id}
                    href={`/user/practice/assignments/${a.id}`}
                    className="flex items-center gap-3 px-4 py-3"
                    style={
                      i < relatedAssignments.length - 1
                        ? { borderBottom: '0.5px solid var(--color-border)' }
                        : undefined
                    }
                  >
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-text truncate">{a.title}</p>
                      <p className="text-[11px] text-text-faint capitalize">{a.status.toLowerCase()}</p>
                    </div>
                    <ChevronRight size={16} className="text-text-faint shrink-0" />
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Past / Cancelled: Book again */}
          {(isPast || isCancelled) && (
            <Link
              href={`/user/sessions/book?doctorId=${session.doctorId}`}
              className="flex items-center justify-center w-full h-[48px] rounded-full bg-bg-card text-primary text-[14px] font-medium"
              style={{ border: '0.5px solid var(--color-border)' }}
            >
              {isCancelled ? 'Book again' : 'Book follow-up'}
            </Link>
          )}
        </div>
      </div>

      {/* Desktop: Chapter view */}
      <div className="hidden lg:block">
        {chapterData ? (
          <>
            <ChapterView chapter={chapterData} />
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
          </>
        ) : (
          <div className="py-8">
            <p className="text-[14px] text-text-faint">Session not found.</p>
          </div>
        )}
      </div>
    </>
  )
}
