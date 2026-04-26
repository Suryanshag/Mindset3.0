import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Ticket } from 'lucide-react'
import PageHeader from '@/components/dashboard/page-header'
import WorkshopRegisterButton from './register-button'

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

  return (
    <div>
      <PageHeader title="Workshop" back="/user/discover/workshops" />

      <div className="space-y-3.5 pt-5 pb-24">
        {/* Cover image — natural aspect ratio, no cropping */}
        {workshop.coverImageUrl ? (
          <img
            src={workshop.coverImageUrl}
            alt={workshop.title}
            className="w-full h-auto rounded-2xl"
          />
        ) : (
          <div className="rounded-2xl bg-accent-tint flex items-center justify-center aspect-[3/4]">
            <Ticket size={48} className="text-accent" />
          </div>
        )}

        {/* Title + instructor */}
        <div className="-mt-0.5">
          <h2 className="text-[20px] font-medium text-text">{workshop.title}</h2>
          {workshop.instructorName && (
            <p className="text-[14px] text-text-muted mt-1">
              with {workshop.instructorName}
            </p>
          )}
        </div>

        {/* Info card — plain text, no icons */}
        <div
          className="bg-bg-card rounded-2xl p-4 space-y-2"
          style={{ border: '0.5px solid var(--color-border)' }}
        >
          <p className="text-[14px] text-text">
            {workshop.startsAt.toLocaleDateString('en-IN', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
          <p className="text-[14px] text-text">
            {workshop.startsAt.toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            })}
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

        {/* Description — hidden when empty */}
        {workshop.description && (
          <div
            className="bg-bg-card rounded-2xl p-4"
            style={{ border: '0.5px solid var(--color-border)' }}
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

      {/* Sticky registration button — above bottom nav */}
      <div className="fixed left-0 right-0 z-40 p-4 bg-bg/80 backdrop-blur-sm lg:max-w-md lg:mx-auto" style={{ bottom: 'calc(3.5rem + env(safe-area-inset-bottom, 0px))', borderTop: '0.5px solid var(--color-border)' }}>
        <WorkshopRegisterButton
          workshopId={workshop.id}
          isPast={isPast}
          isFull={isFull && !isRegistered}
          isFree={isFree}
          isRegistered={isRegistered}
          whatsappUrl={workshop.whatsappGroupUrl}
          price={workshop.priceCents}
        />
      </div>
    </div>
  )
}
