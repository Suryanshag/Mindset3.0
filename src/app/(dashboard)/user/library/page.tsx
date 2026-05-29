import Link from 'next/link'
import Image from 'next/image'
import { BookOpen, ShoppingBag } from 'lucide-react'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import PageHeader from '@/components/dashboard/page-header'
import MobileLibrary from '@/components/mobile/library'

/** "Today" / "Yesterday" / "3 days ago" / "Sep 12" — for "last opened" subtitle. */
function formatLastOpened(d: Date): string {
  const now = Date.now()
  const diffMs = now - d.getTime()
  const diffDays = Math.floor(diffMs / (24 * 60 * 60 * 1000))
  if (diffDays <= 0) return 'Opened today'
  if (diffDays === 1) return 'Opened yesterday'
  if (diffDays < 7) return `Opened ${diffDays} days ago`
  if (diffDays < 30) {
    const weeks = Math.floor(diffDays / 7)
    return `Opened ${weeks} ${weeks === 1 ? 'week' : 'weeks'} ago`
  }
  return `Opened ${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
}

type StudyMaterial = {
  id: string
  title: string
  type: string
  price: unknown
  coverImage: string | null
}

type DigitalProduct = {
  id: string
  name: string
  image: string | null
  price: unknown
}

function MaterialCover({ item }: { item: StudyMaterial }) {
  return (
    <div className="relative w-full aspect-[3/4] rounded-xl bg-primary-tint flex items-center justify-center overflow-hidden">
      {item.coverImage ? (
        <Image fill
          src={item.coverImage}
          alt={item.title}
          className="w-full h-full object-cover"
        />
      ) : (
        <BookOpen size={28} className="text-primary/30" />
      )}
      <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-full bg-black/50 backdrop-blur-sm">
        <span className="text-[9px] font-medium text-white">
          {item.type === 'FREE' ? 'Free' : `\u20B9${Number(item.price)}`}
        </span>
      </div>
    </div>
  )
}

function ProductCover({ item }: { item: DigitalProduct }) {
  return (
    <div className="relative w-full h-32 rounded-xl bg-primary-tint flex items-center justify-center overflow-hidden">
      {item.image ? (
        <Image fill
          src={item.image}
          alt={item.name}
          className="w-full h-full object-cover"
        />
      ) : (
        <ShoppingBag size={28} className="text-primary/30" />
      )}
    </div>
  )
}

export default async function LibraryPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const userId = session.user.id

  // Owned paid ebooks
  const paidPayments = await prisma.payment.findMany({
    where: { userId, type: 'EBOOK', status: 'PAID', studyMaterialId: { not: null } },
    select: { studyMaterialId: true },
  })
  const ownedEbookIds = paidPayments
    .map((p) => p.studyMaterialId)
    .filter((id): id is string => id !== null)

  const [ownedEbooks, freeEbooks, allMaterials] = await Promise.all([
    ownedEbookIds.length > 0
      ? prisma.studyMaterial.findMany({
          where: { id: { in: ownedEbookIds }, isPublished: true },
          select: { id: true, title: true, type: true, price: true, coverImage: true },
        })
      : [],
    prisma.studyMaterial.findMany({
      where: { isPublished: true, type: 'FREE' },
      select: { id: true, title: true, type: true, price: true, coverImage: true },
    }),
    prisma.studyMaterial.findMany({
      where: { isPublished: true },
      select: { id: true, title: true, type: true, price: true, coverImage: true },
      orderBy: { createdAt: 'desc' },
    }),
  ])

  // Digital products from paid orders
  const digitalOrders = await prisma.order.findMany({
    where: { userId, paymentStatus: 'PAID' },
    select: {
      orderItems: {
        where: { product: { isDigital: true } },
        select: { product: { select: { id: true, name: true, image: true, price: true } } },
      },
    },
  })
  const ownedDigitalProducts = digitalOrders
    .flatMap((o) => o.orderItems.map((oi) => oi.product))
    .filter((p, i, arr) => arr.findIndex((x) => x.id === p.id) === i)

  // Library items = owned paid ebooks + free ebooks + digital products
  const ownedEbookIdsSet = new Set([...ownedEbookIds, ...freeEbooks.map((e) => e.id)])
  const libraryEbooksRaw = [...ownedEbooks, ...freeEbooks]
    .filter((e, i, arr) => arr.findIndex((x) => x.id === e.id) === i)

  // Per-user reading state for the library items.
  const accesses = libraryEbooksRaw.length > 0
    ? await prisma.studyMaterialAccess.findMany({
        where: {
          userId,
          materialId: { in: libraryEbooksRaw.map((e) => e.id) },
        },
        select: { materialId: true, lastOpenedAt: true },
      })
    : []
  const accessMap = new Map(accesses.map((a) => [a.materialId, a.lastOpenedAt]))

  // Sort: most-recently-opened first, then never-opened (lastOpenedAt = null) last.
  const libraryEbooks = libraryEbooksRaw
    .map((e) => ({ ...e, lastOpenedAt: accessMap.get(e.id) ?? null }))
    .sort((a, b) => {
      if (!a.lastOpenedAt && !b.lastOpenedAt) return 0
      if (!a.lastOpenedAt) return 1
      if (!b.lastOpenedAt) return -1
      return b.lastOpenedAt.getTime() - a.lastOpenedAt.getTime()
    })

  const mostRecentEbookId =
    libraryEbooks.find((e) => e.lastOpenedAt)?.id ?? null

  const hasLibraryItems = libraryEbooks.length > 0 || ownedDigitalProducts.length > 0

  // Recommended = published materials not already in library
  const recommended = allMaterials.filter((m) => !ownedEbookIdsSet.has(m.id))

  return (
    <>
      {/* Mobile — Phase 5 ported Library. */}
      <div className="lg:hidden">
        <MobileLibrary
          owned={libraryEbooks.map((e) => ({
            id: e.id,
            title: e.title,
            type: e.type as 'FREE' | 'PAID',
            price: e.price ? String(e.price) : null,
            coverImage: e.coverImage,
            lastOpenedAt: e.lastOpenedAt ? e.lastOpenedAt.toISOString() : null,
          }))}
          browseFree={recommended
            .filter((m) => m.type === 'FREE')
            .map((m) => ({
              id: m.id,
              title: m.title,
              type: m.type as 'FREE' | 'PAID',
              price: m.price ? String(m.price) : null,
              coverImage: m.coverImage,
            }))}
          browsePaid={recommended
            .filter((m) => m.type === 'PAID')
            .map((m) => ({
              id: m.id,
              title: m.title,
              type: m.type as 'FREE' | 'PAID',
              price: m.price ? String(m.price) : null,
              coverImage: m.coverImage,
            }))}
        />
      </div>

      {/* Desktop — existing layout, unchanged. */}
      <div className="hidden lg:block">
      <PageHeader title="Library" back="/user/discover" />

      <div className="space-y-5 pt-3.5">
        {/* Your Library */}
        {hasLibraryItems ? (
          <div>
            <p className="text-[12px] font-medium text-text-faint uppercase tracking-wider mb-2.5">
              Your Library
            </p>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 lg:gap-4">
              {libraryEbooks.map((item) => {
                const isMostRecent = item.id === mostRecentEbookId
                return (
                  <Link
                    key={item.id}
                    href={`/user/library/${item.id}`}
                    className="bg-bg-card rounded-2xl p-2.5 lg:p-3 transition-all duration-150 lg:hover:shadow-sm lg:hover:-translate-y-0.5"
                    style={{ border: '1px solid var(--color-border)' }}
                  >
                    <MaterialCover item={item} />
                    <p className="text-[13px] lg:text-[14px] font-medium text-text mt-2 line-clamp-2">
                      {item.title}
                    </p>
                    <p className="text-[11px] lg:text-[12px] text-text-faint mt-0.5">
                      {item.lastOpenedAt
                        ? formatLastOpened(item.lastOpenedAt)
                        : 'Not opened yet'}
                    </p>
                    {isMostRecent && (
                      <p className="text-[12px] font-medium text-primary mt-1.5">
                        Continue reading →
                      </p>
                    )}
                  </Link>
                )
              })}
              {ownedDigitalProducts.map((item) => (
                <div
                  key={item.id}
                  className="bg-bg-card rounded-2xl p-2.5 lg:p-3"
                  style={{ border: '1px solid var(--color-border)' }}
                >
                  <ProductCover item={item} />
                  <p className="text-[13px] lg:text-[14px] font-medium text-text mt-2 line-clamp-2">
                    {item.name}
                  </p>
                  <p className="text-[11px] lg:text-[12px] text-green-600 mt-0.5">
                    Available
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center py-12">
            <BookOpen size={28} className="text-text-faint mb-2" />
            <p className="text-[14px] text-text-muted">
              Your library will fill in as you buy ebooks and digital workbooks.
            </p>
            <Link
              href="/user/shop"
              className="mt-3 text-[13px] font-medium text-primary"
            >
              Browse the shop
            </Link>
          </div>
        )}

        {/* Recommended */}
        {recommended.length > 0 && (
          <div>
            <p className="text-[12px] font-medium text-text-faint uppercase tracking-wider mb-2.5">
              Recommended for you
            </p>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 lg:gap-4">
              {recommended.map((item) => (
                <Link
                  key={item.id}
                  href={`/user/library/${item.id}`}
                  className="bg-bg-card rounded-2xl p-2.5 lg:p-3 transition-all duration-150 lg:hover:shadow-sm lg:hover:-translate-y-0.5"
                  style={{ border: '1px solid var(--color-border)' }}
                >
                  <MaterialCover item={item} />
                  <p className="text-[13px] lg:text-[14px] font-medium text-text mt-2 line-clamp-2">
                    {item.title}
                  </p>
                  <p className="text-[11px] lg:text-[12px] text-text-faint mt-0.5">
                    {item.type === 'FREE' ? 'Free' : `\u20B9${Number(item.price)}`}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>
      </div>
    </>
  )
}
