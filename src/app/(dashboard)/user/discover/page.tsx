import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { getNextWorkshop } from '@/lib/queries/dashboard'
import MobileDiscover from '@/components/mobile/discover'
import BDiscoverHub from '@/components/dashboard/desktop/b-discover-hub'

export default async function DiscoverHubPage() {
  const session = await auth()
  const userId = session?.user?.id

  const [
    workshop,
    upcomingCount,
    materialCount,
    nextWorkshopFull,
    libraryPreview,
    shopPreview,
    nextNgoVisit,
    ngoVisitsCount,
    libraryOwnedCount,
  ] = await Promise.all([
    getNextWorkshop().catch(() => null),
    prisma.workshop
      .count({ where: { published: true, startsAt: { gte: new Date() } } })
      .catch(() => 0),
    prisma.studyMaterial.count({ where: { isPublished: true } }).catch(() => 0),
    prisma.workshop
      .findFirst({
        where: { published: true, startsAt: { gte: new Date() } },
        orderBy: { startsAt: 'asc' },
        select: {
          id: true,
          title: true,
          subtitle: true,
          startsAt: true,
          durationMin: true,
          priceCents: true,
          capacity: true,
          instructorName: true,
          presenter: { select: { name: true } },
          _count: { select: { registrations: true } },
        },
      })
      .catch(() => null),
    prisma.studyMaterial
      .findMany({
        where: { isPublished: true },
        orderBy: { createdAt: 'desc' },
        take: 3,
        select: { id: true, title: true, type: true, price: true, coverImage: true },
      })
      .catch(() => []),
    prisma.product
      .findMany({
        where: { isActive: true },
        orderBy: { createdAt: 'desc' },
        take: 2,
        select: { id: true, name: true, price: true, image: true },
      })
      .catch(() => []),
    prisma.ngoVisit
      .findFirst({
        where: { isPublished: true, visitDate: { gte: new Date() } },
        orderBy: { visitDate: 'asc' },
        select: { id: true, ngoName: true, location: true, visitDate: true },
      })
      .catch(() => null),
    prisma.ngoVisit
      .count({ where: { isPublished: true, visitDate: { gte: new Date() } } })
      .catch(() => 0),
    userId
      ? prisma.studyMaterialAccess.count({ where: { userId } }).catch(() => 0)
      : Promise.resolve(0),
  ])

  void workshop
  void ngoVisitsCount

  return (
    <>
      {/* Mobile — Phase 5 ported Discover hub. */}
      <div className="lg:hidden">
        <MobileDiscover
          libraryPreview={libraryPreview.map((m) => ({
            id: m.id,
            title: m.title,
            type: m.type as 'FREE' | 'PAID',
            price: m.price ? String(m.price) : null,
            coverImage: m.coverImage,
          }))}
          libraryOwnedCount={libraryOwnedCount}
          nextNgoVisit={
            nextNgoVisit
              ? {
                  id: nextNgoVisit.id,
                  ngoName: nextNgoVisit.ngoName,
                  location: nextNgoVisit.location,
                  visitDate: nextNgoVisit.visitDate.toISOString(),
                }
              : null
          }
          ngoVisitsCount={ngoVisitsCount}
        />
      </div>

      {/* Desktop — Phase 3f Direction B port. */}
      <div className="hidden lg:block">
        <BDiscoverHub
          upcomingWorkshopCount={upcomingCount}
          libraryMaterialCount={materialCount}
          nextWorkshop={
            nextWorkshopFull
              ? {
                  id: nextWorkshopFull.id,
                  title: nextWorkshopFull.title,
                  subtitle: nextWorkshopFull.subtitle,
                  startsAt: nextWorkshopFull.startsAt,
                  durationMin: nextWorkshopFull.durationMin,
                  priceCents: nextWorkshopFull.priceCents,
                  capacity: nextWorkshopFull.capacity,
                  registrationsCount: nextWorkshopFull._count.registrations,
                  presenterName:
                    nextWorkshopFull.presenter?.name ??
                    nextWorkshopFull.instructorName ??
                    null,
                }
              : null
          }
          libraryPreview={libraryPreview.map((m) => ({
            id: m.id,
            title: m.title,
            type: m.type as 'FREE' | 'PAID',
            price: m.price ? String(m.price) : null,
            coverImage: m.coverImage,
          }))}
          shopPreview={shopPreview.map((p) => ({
            id: p.id,
            name: p.name,
            price: String(p.price),
            image: p.image,
          }))}
          nextNgoVisit={
            nextNgoVisit
              ? {
                  id: nextNgoVisit.id,
                  ngoName: nextNgoVisit.ngoName,
                  location: nextNgoVisit.location,
                  visitDate: nextNgoVisit.visitDate,
                }
              : null
          }
        />
      </div>
    </>
  )
}
