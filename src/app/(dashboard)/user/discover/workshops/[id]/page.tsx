import { auth } from '@/lib/auth'
import Image from 'next/image'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Ticket, Video } from 'lucide-react'
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

      {/* Desktop — existing layout, unchanged. */}
      <div className="hidden lg:block">
      <PageHeader title="Workshop" back="/user/discover/workshops" />

      <div className="space-y-3.5 pt-5 pb-24">
        {/* Cover — real image when present, designed gradient hero otherwise */}
        {workshop.coverImageUrl ? (
          <>
            <div className="relative w-full aspect-[3/4] rounded-2xl overflow-hidden">
              <Image
                fill
                src={workshop.coverImageUrl}
                alt={workshop.title}
                sizes="(max-width: 768px) 100vw, 600px"
                className="object-cover"
                unoptimized
              />
            </div>
            <div className="-mt-0.5">
              <h2 className="text-[20px] font-medium text-text">{workshop.title}</h2>
              {(workshop.presenter?.name || workshop.instructorName) && (
                <p className="text-[14px] text-text-muted mt-1">
                  with {workshop.presenter?.name ?? workshop.instructorName}
                </p>
              )}
            </div>
          </>
        ) : (
          <WorkshopHeroFallback
            title={workshop.title}
            presenterName={workshop.presenter?.name ?? workshop.instructorName ?? null}
          />
        )}

        {/* Info card — plain text, no icons */}
        <div
          className="bg-bg-card rounded-2xl p-4 space-y-2"
          style={{ border: '1px solid var(--color-border)' }}
        >
          <p className="text-[14px] text-text">
            {formatSessionDateLong(workshop.startsAt)}
          </p>
          <p className="text-[14px] text-text">
            {formatSessionTime(workshop.startsAt)}
            {' '}&middot; {workshop.durationMin} min
          </p>
          {workshop.capacity && (
            <p className="text-[14px] text-text">
              {workshop._count.registrations} of {workshop.capacity} spots filled
            </p>
          )}
          <p className="text-[15px] font-medium text-primary">
            {isFree ? 'Free' : `\u20B9${(workshop.priceCents / 100).toFixed(0)}`}
          </p>
        </div>

        {/* Meeting link surface — only visible to registered users. Shows
            the live join button inside the workshop window (15 min before
            start through 30 min after end), a quiet "link will appear
            here" prompt before that, or nothing once the workshop is over.
            Server-rendered so the state is correct on each page load;
            refresh to advance through the window. */}
        {isRegistered && !workshop.cancelledAt && (() => {
          const winState = getWorkshopWindowState(workshop.startsAt, workshop.durationMin)
          if (winState === 'ended') return null

          const joinable = isWorkshopJoinable(winState)

          if (joinable && workshop.meetLink) {
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

          if (joinable && !workshop.meetLink) {
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

        {/* Description — hidden when empty */}
        {workshop.description && (
          <div
            className="bg-bg-card rounded-2xl p-4"
            style={{ border: '1px solid var(--color-border)' }}
          >
            <p className="text-[11px] font-medium text-text-faint uppercase tracking-wider mb-2">
              About this workshop
            </p>
            <p className="text-[14px] text-text leading-relaxed whitespace-pre-line">
              {workshop.description}
            </p>
          </div>
        )}
      </div>

      {/* Sticky registration button — above bottom nav on mobile, bottom-0 on desktop */}
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

function WorkshopHeroFallback({
  title,
  presenterName,
}: {
  title: string
  presenterName: string | null
}) {
  const initial = presenterName?.trim().charAt(0).toUpperCase() ?? ''
  return (
    <div
      className="relative rounded-2xl overflow-hidden aspect-[16/9] lg:min-h-[320px] flex items-center justify-center px-6 lg:px-10"
      style={{
        background:
          'linear-gradient(135deg, var(--color-accent-tint) 0%, var(--color-primary-tint) 100%)',
      }}
    >
      <Ticket size={20} className="absolute top-4 left-4 text-accent/60" />
      <div className="text-center">
        <h2 className="text-[24px] lg:text-[32px] font-medium text-text leading-tight">
          {title}
        </h2>
        {presenterName && (
          <div className="mt-4 inline-flex items-center gap-2 text-[14px] text-text-muted">
            <span
              className="w-7 h-7 rounded-full bg-white/70 flex items-center justify-center text-[12px] font-medium text-primary"
            >
              {initial}
            </span>
            <span>with {presenterName}</span>
          </div>
        )}
      </div>
    </div>
  )
}
