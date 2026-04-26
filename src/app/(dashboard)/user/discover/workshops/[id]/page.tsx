import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { Calendar, Clock, Users, Ticket } from 'lucide-react'
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

      <div className="space-y-3.5 pt-5">
        {/* Cover image or icon */}
        {workshop.coverImageUrl ? (
          <div className="rounded-2xl overflow-hidden aspect-video">
            <img
              src={workshop.coverImageUrl}
              alt={workshop.title}
              className="w-full h-full object-cover"
            />
          </div>
        ) : (
          <div className="rounded-2xl bg-accent-tint flex items-center justify-center aspect-video">
            <Ticket size={48} className="text-accent" />
          </div>
        )}

        {/* Title + instructor */}
        <div>
          <h2 className="text-[20px] font-medium text-text">{workshop.title}</h2>
          {workshop.instructorName && (
            <p className="text-[14px] text-text-muted mt-1">
              with {workshop.instructorName}
            </p>
          )}
        </div>

        {/* Info card */}
        <div
          className="bg-bg-card rounded-2xl p-4 space-y-3"
          style={{ border: '0.5px solid var(--color-border)' }}
        >
          <div className="flex items-center gap-3">
            <Calendar size={16} className="text-text-faint shrink-0" />
            <p className="text-[14px] text-text">
              {workshop.startsAt.toLocaleDateString('en-IN', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                year: 'numeric',
              })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Clock size={16} className="text-text-faint shrink-0" />
            <p className="text-[14px] text-text">
              {workshop.startsAt.toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
              })}
              {' '}&middot; {workshop.durationMin} min
            </p>
          </div>
          {workshop.capacity && (
            <div className="flex items-center gap-3">
              <Users size={16} className="text-text-faint shrink-0" />
              <p className="text-[14px] text-text">
                {workshop._count.registrations} of {workshop.capacity} spots filled
              </p>
            </div>
          )}
          <p className="text-[15px] font-medium text-primary">
            {isFree ? 'Free' : `\u20B9${(workshop.priceCents / 100).toFixed(0)}`}
          </p>
        </div>

        {/* Description */}
        {workshop.description && (
          <div
            className="bg-bg-card rounded-2xl p-4"
            style={{ border: '0.5px solid var(--color-border)' }}
          >
            <p className="text-[14px] text-text leading-relaxed whitespace-pre-line">
              {workshop.description}
            </p>
          </div>
        )}

        {/* Action button */}
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
