import { auth } from '@/lib/auth'
import Image from 'next/image'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Ticket, Video, CalendarDays, Clock, Users } from 'lucide-react'
import PageHeader from '@/components/dashboard/page-header'
import WorkshopRegisterButton from './register-button'
import { formatSessionDateLong, formatSessionTime } from '@/lib/format-date'
import { getWorkshopWindowState, isWorkshopJoinable } from '@/lib/workshop-window'
import MobileWorkshopDetail from '@/components/mobile/workshop-detail'

export default async function WorkshopDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const workshop = await prisma.workshop.findUnique({
    where: { id },
    include: {
      _count: { select: { registrations: true } },
      presenter: { select: { name: true } },
    },
  })

  if (!workshop || !workshop.published) notFound()

  const isRegistered = await prisma.workshopRegistration
    .findUnique({
      where: {
        userId_workshopId: { userId: session.user.id, workshopId: id },
      },
    })
    .then((r) => !!r)

  const now = new Date()
  const isPast = workshop.startsAt < now
  const isFull =
    workshop.capacity !== null &&
    workshop._count.registrations >= workshop.capacity
  const isFree = workshop.priceCents === 0
  const workshopState = getWorkshopWindowState(
    workshop.startsAt,
    workshop.durationMin,
  )
  const joinable = isWorkshopJoinable(workshopState)

  return (
    <>
      {/* Mobile — Phase 5 ported detail. Reuses WorkshopRegisterButton
          (Sprint Workshops-Paid) inside a mobile-styled sticky bar. */}
      <div className="lg:hidden">
        <MobileWorkshopDetail
          w={{
            id: workshop.id,
            title: workshop.title,
            subtitle: workshop.subtitle,
            description: workshop.description,
            coverImageUrl: workshop.coverImageUrl,
            instructorName: workshop.instructorName,
            presenterName: workshop.presenter?.name ?? null,
            startsAt: workshop.startsAt.toISOString(),
            durationMin: workshop.durationMin,
            priceCents: workshop.priceCents,
            capacity: workshop.capacity,
            registrationsCount: workshop._count.registrations,
            meetLink: workshop.meetLink,
            whatsappGroupUrl: workshop.whatsappGroupUrl,
          }}
          isRegistered={isRegistered}
          isPast={isPast}
          isFull={isFull}
          joinable={joinable}
        />
      </div>

      {/* Desktop — constrained two-column hero (cover + details). */}
      <div className="hidden lg:block">
        <PageHeader title="Workshop" back="/user/discover/workshops" />

        <div className="lg:max-w-[720px] lg:mx-auto pt-5 pb-28 space-y-6">
          {/* Hero — cover (left) + key details (right) */}
          <div className="flex gap-6">
            <div className="w-[240px] shrink-0">
              {workshop.coverImageUrl ? (
                <div
                  className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden bg-bg-card"
                  style={{ border: '1px solid var(--color-border)' }}
                >
                  <Image
                    fill
                    src={workshop.coverImageUrl}
                    alt={workshop.title}
                    sizes="240px"
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ) : (
                <div
                  className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden flex items-center justify-center"
                  style={{
                    background:
                      'linear-gradient(135deg, var(--color-accent-tint) 0%, var(--color-primary-tint) 100%)',
                  }}
                >
                  <Ticket size={32} className="text-accent/60" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h1 className="text-[26px] font-semibold text-text leading-tight">
                {workshop.title}
              </h1>
              {(workshop.presenter?.name || workshop.instructorName) && (
                <p className="text-[14px] text-text-muted mt-1.5">
                  with {workshop.presenter?.name ?? workshop.instructorName}
                </p>
              )}

              <div className="mt-5 space-y-3">
                <div className="flex items-center gap-2.5 text-[14px] text-text">
                  <CalendarDays size={16} className="text-text-faint shrink-0" />
                  {formatSessionDateLong(workshop.startsAt)}
                </div>
                <div className="flex items-center gap-2.5 text-[14px] text-text">
                  <Clock size={16} className="text-text-faint shrink-0" />
                  {formatSessionTime(workshop.startsAt)} &middot; {workshop.durationMin} min
                </div>
                {workshop.capacity && (
                  <div className="flex items-center gap-2.5 text-[14px] text-text">
                    <Users size={16} className="text-text-faint shrink-0" />
                    {workshop._count.registrations} of {workshop.capacity} spots filled
                  </div>
                )}
              </div>

              <p className="mt-5 text-[22px] font-bold text-primary">
                {isFree
                  ? 'Free'
                  : `₹${(workshop.priceCents / 100).toLocaleString('en-IN')}`}
              </p>
            </div>
          </div>

          {/* Meeting link surface — only visible to registered users. Shows
              the live join button inside the workshop window (15 min before
              start through 30 min after end), a quiet "link will appear
              here" prompt before that, or nothing once the workshop is over. */}
          {isRegistered && !workshop.cancelledAt && (() => {
            const winState = getWorkshopWindowState(workshop.startsAt, workshop.durationMin)
            if (winState === 'ended') return null

            const canJoin = isWorkshopJoinable(winState)

            if (canJoin && workshop.meetLink) {
              return (
                <div
                  className="bg-bg-card rounded-2xl p-4"
                  style={{
                    border: '1px solid var(--color-border)',
                    borderLeft: '3px solid var(--color-primary)',
                  }}
                >
                  <p className="text-[11px] font-medium text-text-faint uppercase tracking-wider mb-2">
                    {winState === 'live'
                      ? 'Workshop is live'
                      : winState === 'ended_soon'
                        ? 'Just ended — re-join if you got disconnected'
                        : 'Meeting link ready'}
                  </p>
                  <a
                    href={workshop.meetLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-full bg-primary text-white text-[14px] font-medium"
                  >
                    <Video size={16} />
                    Join workshop
                  </a>
                </div>
              )
            }

            if (canJoin && !workshop.meetLink) {
              return (
                <div
                  className="bg-bg-card rounded-2xl p-4"
                  style={{ border: '1px solid var(--color-border)' }}
                >
                  <p className="text-[14px] text-amber-700">
                    Meeting link not yet provided. Contact{' '}
                    <a href="mailto:mindset.org.connect@gmail.com" className="underline">
                      mindset.org.connect@gmail.com
                    </a>{' '}
                    if the workshop starts soon.
                  </p>
                </div>
              )
            }

            // 'upcoming' — meeting link hidden until 15 min before start
            return (
              <div
                className="bg-bg-card rounded-2xl p-4"
                style={{ border: '1px solid var(--color-border)' }}
              >
                <p className="text-[11px] font-medium text-text-faint uppercase tracking-wider mb-2">
                  Meeting link
                </p>
                <p className="text-[14px] text-text-muted">
                  Will appear here 15 minutes before the workshop starts.
                </p>
              </div>
            )
          })()}

          {/* About — workshop description is rich HTML from the admin editor */}
          {workshop.description && (
            <div>
              <p className="text-[11px] font-medium text-text-faint uppercase tracking-wider mb-2.5">
                About this workshop
              </p>
              <div
                className="text-[14px] text-text leading-relaxed [&_p]:mb-3 [&_p:last-child]:mb-0"
                dangerouslySetInnerHTML={{ __html: workshop.description }}
              />
            </div>
          )}
        </div>

        {/* Sticky registration button */}
        <div className="fixed left-0 right-0 z-40 p-4 bg-bg-app/80 backdrop-blur-sm lg:sticky lg:bottom-0 lg:left-auto lg:right-auto lg:max-w-[720px] lg:mx-auto lg:px-0 lg:pb-6" style={{ bottom: 'calc(3.5rem + env(safe-area-inset-bottom, 0px))', borderTop: '1px solid var(--color-border)' }}>
          <WorkshopRegisterButton
            workshopId={workshop.id}
            workshopTitle={workshop.title}
            isPast={isPast}
            isFull={isFull && !isRegistered}
            isFree={isFree}
            isRegistered={isRegistered}
            whatsappUrl={workshop.whatsappGroupUrl}
          />
        </div>
      </div>
    </>
  )
}
