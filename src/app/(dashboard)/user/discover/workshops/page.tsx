import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import MobileWorkshopsList from '@/components/mobile/workshops-list'
import BDiscoverWorkshops from '@/components/dashboard/desktop/b-discover-workshops'

export default async function WorkshopsListPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const userId = session.user.id
  const now = new Date()

  const [upcoming, pastRegistrations] = await Promise.all([
    prisma.workshop
      .findMany({
        where: { published: true, startsAt: { gte: now } },
        orderBy: { startsAt: 'asc' },
        include: {
          presenter: { select: { name: true } },
          _count: { select: { registrations: true } },
        },
      })
      .catch(() => []),
    prisma.workshopRegistration
      .findMany({
        where: { userId, workshop: { startsAt: { lt: now } } },
        orderBy: { workshop: { startsAt: 'desc' } },
        select: {
          workshop: { select: { id: true, title: true, startsAt: true } },
        },
      })
      .catch(() => []),
  ])

  return (
    <>
      {/* Mobile — Phase 5 ported list. */}
      <div className="lg:hidden">
        <MobileWorkshopsList
          upcoming={upcoming.map((w) => ({
            id: w.id,
            title: w.title,
            subtitle: w.subtitle,
            description: w.description,
            coverImageUrl: w.coverImageUrl,
            instructorName: w.instructorName,
            presenterName: w.presenter?.name ?? null,
            startsAt: w.startsAt.toISOString(),
            durationMin: w.durationMin,
            priceCents: w.priceCents,
            capacity: w.capacity,
            registrationsCount: w._count.registrations,
          }))}
          attended={pastRegistrations.map((r) => ({
            id: r.workshop.id,
            title: r.workshop.title,
            startsAt: r.workshop.startsAt.toISOString(),
          }))}
        />
      </div>

      {/* Desktop — Phase 3f Direction B port. */}
      <div className="hidden lg:block">
        <BDiscoverWorkshops
          upcoming={upcoming.map((w) => ({
            id: w.id,
            title: w.title,
            subtitle: w.subtitle,
            coverImageUrl: w.coverImageUrl,
            instructorName: w.instructorName,
            presenterName: w.presenter?.name ?? null,
            startsAt: w.startsAt,
            durationMin: w.durationMin,
            priceCents: w.priceCents,
            capacity: w.capacity,
            registrationsCount: w._count.registrations,
          }))}
          attended={pastRegistrations.map((r) => ({
            id: r.workshop.id,
            title: r.workshop.title,
            startsAt: r.workshop.startsAt,
          }))}
        />
      </div>
    </>
  )
}
