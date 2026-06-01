import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import { getWorkshopWindowState, isWorkshopJoinable } from '@/lib/workshop-window'
import MobileWorkshopDetail from '@/components/mobile/workshop-detail'
import BWorkshopDetail from '@/components/dashboard/desktop/b-workshop-detail'

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
      {/* Mobile — Phase 5 ported detail. */}
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

      {/* Desktop — Phase 3f Direction B port. */}
      <div className="hidden lg:block">
        <BWorkshopDetail
          workshop={{
            id: workshop.id,
            title: workshop.title,
            subtitle: workshop.subtitle,
            description: workshop.description,
            coverImageUrl: workshop.coverImageUrl,
            instructorName: workshop.instructorName,
            presenterName: workshop.presenter?.name ?? null,
            startsAt: workshop.startsAt,
            durationMin: workshop.durationMin,
            priceCents: workshop.priceCents,
            capacity: workshop.capacity,
            registrationsCount: workshop._count.registrations,
            meetLink: workshop.meetLink,
            whatsappGroupUrl: workshop.whatsappGroupUrl,
            cancelledAt: workshop.cancelledAt,
          }}
          isRegistered={isRegistered}
          isPast={isPast}
          isFull={isFull}
          isFree={isFree}
          joinWindowState={workshopState}
          joinable={joinable}
        />
      </div>
    </>
  )
}
