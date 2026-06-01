import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import BNgoDetail from '@/components/dashboard/desktop/b-ngo-detail'

export default async function NgoVisitDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const [visit, myRegistration, totalCount, whatsappLink] = await Promise.all([
    prisma.ngoVisit.findUnique({ where: { id } }),
    prisma.ngoJoinRequest.findUnique({
      where: { userId_ngoVisitId: { userId: session.user.id, ngoVisitId: id } },
    }),
    prisma.ngoJoinRequest.count({
      where: { ngoVisitId: id, status: { not: 'CANCELLED' } },
    }),
    prisma.whatsappLink.findFirst({ select: { link: true, label: true } }),
  ])

  if (!visit || !visit.isPublished) notFound()

  const isPast = visit.visitDate < new Date()
  const isRegistered = !!myRegistration
  const isFull = visit.capacity != null && totalCount >= visit.capacity
  const spotsLeft = visit.capacity != null ? Math.max(0, visit.capacity - totalCount) : null

  return (
    <BNgoDetail
      visit={{
        id: visit.id,
        ngoName: visit.ngoName,
        location: visit.location,
        description: visit.description,
        photos: visit.photos,
        visitDate: visit.visitDate,
        capacity: visit.capacity,
      }}
      isRegistered={isRegistered}
      isPast={isPast}
      isFull={isFull}
      spotsLeft={spotsLeft}
      goingCount={totalCount}
      whatsappLink={whatsappLink}
    />
  )
}
