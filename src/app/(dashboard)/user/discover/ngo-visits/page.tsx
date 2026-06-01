import { prisma } from '@/lib/prisma'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import MobileNgoList from '@/components/mobile/ngo-visits'
import BNgoList from '@/components/dashboard/desktop/b-ngo-list'

export default async function DashboardNgoVisitsListPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const userId = session.user.id
  const now = new Date()

  const [upcoming, myRegistrations, joinCounts, totalAttended] = await Promise.all([
    prisma.ngoVisit
      .findMany({
        where: { isPublished: true, visitDate: { gte: now } },
        orderBy: { visitDate: 'asc' },
      })
      .catch(() => []),
    prisma.ngoJoinRequest
      .findMany({
        where: { userId },
        select: { ngoVisitId: true },
      })
      .catch(() => []),
    // Going-count per visit (excludes CANCELLED), used by the BNgoList rows.
    prisma.ngoJoinRequest
      .groupBy({
        by: ['ngoVisitId'],
        where: {
          ngoVisitId: { not: null },
          status: { not: 'CANCELLED' },
        },
        _count: { _all: true },
      })
      .catch(() => [] as { ngoVisitId: string | null; _count: { _all: number } }[]),
    // The current user's count of attended visits, for the history tile.
    prisma.ngoJoinRequest
      .count({
        where: {
          userId,
          status: 'ATTENDED',
        },
      })
      .catch(() => 0),
  ])

  const registeredIds = new Set(
    myRegistrations.map((r) => r.ngoVisitId).filter((id): id is string => !!id),
  )
  const goingByVisit = new Map<string, number>()
  for (const c of joinCounts) {
    if (c.ngoVisitId) goingByVisit.set(c.ngoVisitId, c._count._all)
  }

  return (
    <>
      {/* Mobile — Phase 5 ported NGO list. */}
      <div className="lg:hidden">
        <MobileNgoList
          upcoming={upcoming.map((v) => ({
            id: v.id,
            ngoName: v.ngoName,
            location: v.location,
            description: v.description,
            photos: v.photos,
            visitDate: v.visitDate.toISOString(),
            isRegistered: registeredIds.has(v.id),
          }))}
        />
      </div>

      {/* Desktop — Phase 3f Direction B port. */}
      <div className="hidden lg:block">
        <BNgoList
          totalAttended={totalAttended}
          upcoming={upcoming.map((v) => ({
            id: v.id,
            ngoName: v.ngoName,
            location: v.location,
            description: v.description,
            photos: v.photos,
            visitDate: v.visitDate,
            capacity: v.capacity,
            isRegistered: registeredIds.has(v.id),
            goingCount: goingByVisit.get(v.id) ?? 0,
          }))}
        />
      </div>
    </>
  )
}
