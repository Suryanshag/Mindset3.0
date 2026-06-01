import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import MobileLibrary from '@/components/mobile/library'
import BLibrary, { type LibraryMaterial } from '@/components/dashboard/desktop/b-library'

export default async function LibraryPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const userId = session.user.id

  // Owned paid ebooks.
  const paidPayments = await prisma.payment.findMany({
    where: { userId, type: 'EBOOK', status: 'PAID', studyMaterialId: { not: null } },
    select: { studyMaterialId: true },
  })
  const ownedEbookIds = paidPayments
    .map((p) => p.studyMaterialId)
    .filter((id): id is string => id !== null)
  const ownedEbookIdsSet = new Set(ownedEbookIds)

  const allMaterials = await prisma.studyMaterial.findMany({
    where: { isPublished: true },
    select: { id: true, title: true, type: true, price: true, coverImage: true },
    orderBy: { createdAt: 'desc' },
  })

  // Per-user reading state — used to sort owned items by recency in
  // the mobile path. Desktop uses it for the "Last opened" caption +
  // featured-card pick.
  const accesses =
    allMaterials.length > 0
      ? await prisma.studyMaterialAccess.findMany({
          where: { userId, materialId: { in: allMaterials.map((m) => m.id) } },
          select: { materialId: true, lastOpenedAt: true },
        })
      : []
  const accessMap = new Map(accesses.map((a) => [a.materialId, a.lastOpenedAt]))

  const desktopItems: LibraryMaterial[] = allMaterials.map((m) => {
    const isOwned = m.type === 'FREE' || ownedEbookIdsSet.has(m.id)
    return {
      id: m.id,
      title: m.title,
      type: m.type as 'FREE' | 'PAID',
      price: m.price ? String(m.price) : null,
      coverImage: m.coverImage,
      lastOpenedAt: accessMap.get(m.id)?.toISOString() ?? null,
      isOwned,
    }
  })

  // Mobile expects the legacy split shape.
  const ownedEbooksWithLastOpen = desktopItems
    .filter((m) => m.isOwned)
    .map((m) => ({
      id: m.id,
      title: m.title,
      type: m.type,
      price: m.price,
      coverImage: m.coverImage,
      lastOpenedAt: m.lastOpenedAt,
    }))
    .sort((a, b) => {
      if (!a.lastOpenedAt && !b.lastOpenedAt) return 0
      if (!a.lastOpenedAt) return 1
      if (!b.lastOpenedAt) return -1
      return new Date(b.lastOpenedAt).getTime() - new Date(a.lastOpenedAt).getTime()
    })

  const browseFree = desktopItems.filter((m) => m.type === 'FREE' && !m.isOwned)
  const browsePaid = desktopItems.filter((m) => m.type === 'PAID' && !m.isOwned)

  return (
    <>
      {/* Mobile — Phase 5 ported Library. */}
      <div className="lg:hidden">
        <MobileLibrary
          owned={ownedEbooksWithLastOpen}
          browseFree={browseFree.map((m) => ({
            id: m.id,
            title: m.title,
            type: m.type,
            price: m.price,
            coverImage: m.coverImage,
          }))}
          browsePaid={browsePaid.map((m) => ({
            id: m.id,
            title: m.title,
            type: m.type,
            price: m.price,
            coverImage: m.coverImage,
          }))}
        />
      </div>

      {/* Desktop — Phase 3g Direction B port. */}
      <div className="hidden lg:block">
        <BLibrary items={desktopItems} />
      </div>
    </>
  )
}
