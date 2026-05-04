import Link from 'next/link'
import Image from 'next/image'
import { BookOpen, ShoppingBag } from 'lucide-react'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import PageHeader from '@/components/dashboard/page-header'

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
    <div className="relative w-full h-32 rounded-xl bg-primary-tint flex items-center justify-center overflow-hidden">
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
  const libraryEbooks = [...ownedEbooks, ...freeEbooks]
    .filter((e, i, arr) => arr.findIndex((x) => x.id === e.id) === i)

  const hasLibraryItems = libraryEbooks.length > 0 || ownedDigitalProducts.length > 0

  // Recommended = published materials not already in library
  const recommended = allMaterials.filter((m) => !ownedEbookIdsSet.has(m.id))

  return (
    <div>
      <PageHeader title="Library" back="/user/discover" />

      <div className="space-y-5 pt-3.5">
        {/* Your Library */}
        {hasLibraryItems ? (
          <div>
            <p className="text-[12px] font-medium text-text-faint uppercase tracking-wider mb-2.5">
              Your Library
            </p>
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 lg:gap-4">
              {libraryEbooks.map((item) => (
                <Link
                  key={item.id}
                  href="/user/ebooks"
                  className="bg-bg-card rounded-2xl p-2.5 lg:p-3 transition-all duration-150 lg:hover:shadow-sm lg:hover:-translate-y-0.5"
                  style={{ border: '0.5px solid var(--color-border)' }}
                >
                  <MaterialCover item={item} />
                  <p className="text-[13px] lg:text-[14px] font-medium text-text mt-2 line-clamp-2">
                    {item.title}
                  </p>
                  <p className="text-[11px] lg:text-[12px] text-text-faint mt-0.5">
                    {item.type === 'FREE' ? 'Free' : 'Purchased'}
                  </p>
                </Link>
              ))}
              {ownedDigitalProducts.map((item) => (
                <div
                  key={item.id}
                  className="bg-bg-card rounded-2xl p-2.5 lg:p-3"
                  style={{ border: '0.5px solid var(--color-border)' }}
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
                  href="/study-materials"
                  className="bg-bg-card rounded-2xl p-2.5 lg:p-3 transition-all duration-150 lg:hover:shadow-sm lg:hover:-translate-y-0.5"
                  style={{ border: '0.5px solid var(--color-border)' }}
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
  )
}
