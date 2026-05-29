import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import Image from 'next/image'
import { Ticket, BookOpen, ShoppingBag, ChevronRight, HeartHandshake } from 'lucide-react'
import { getNextWorkshop } from '@/lib/queries/dashboard'
import PageHeader from '@/components/dashboard/page-header'
import { formatSessionDateRelative } from '@/lib/format-date'
import MobileDiscover from '@/components/mobile/discover'

export default async function DiscoverHubPage() {
  const session = await auth()
  const userId = session?.user?.id

  const [
    workshop,
    recentMaterials,
    featuredProduct,
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
    prisma.studyMaterial
      .findMany({
        where: { isPublished: true },
        select: { id: true, title: true },
        orderBy: { createdAt: 'desc' },
        take: 2,
      })
      .catch(() => []),
    prisma.product
      .findFirst({
        where: { isActive: true },
        select: { id: true, name: true, price: true },
        orderBy: { createdAt: 'desc' },
      })
      .catch(() => null),
    prisma.workshop
      .count({ where: { published: true, startsAt: { gte: new Date() } } })
      .catch(() => 0),
    prisma.studyMaterial
      .count({ where: { isPublished: true } })
      .catch(() => 0),
    // Full record for the "Coming up" preview card below.
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
      ? prisma.studyMaterialAccess
          .count({ where: { userId } })
          .catch(() => 0)
      : Promise.resolve(0),
  ])

  const sections = [
    {
      title: 'Workshops',
      subtitle: workshop ? `Next: ${workshop.title}` : 'No upcoming workshops',
      href: '/user/discover/workshops',
      Icon: Ticket,
      color: 'bg-accent-tint',
      iconColor: 'text-accent',
    },
    {
      title: 'Library',
      subtitle:
        recentMaterials.length > 0
          ? recentMaterials.map((m) => m.title).join(', ')
          : 'Browse study materials',
      href: '/user/library',
      Icon: BookOpen,
      color: 'bg-primary-tint',
      iconColor: 'text-primary',
    },
    {
      title: 'Shop',
      subtitle: featuredProduct ? `Featured: ${featuredProduct.name}` : 'Browse products',
      href: '/user/shop',
      Icon: ShoppingBag,
      color: 'bg-tan-tint',
      iconColor: 'text-amber-700',
    },
  ]

  const statsLine = [
    upcomingCount > 0 ? `${upcomingCount} upcoming workshop${upcomingCount > 1 ? 's' : ''}` : null,
    materialCount > 0 ? `${materialCount} book${materialCount > 1 ? 's' : ''} in library` : null,
  ].filter(Boolean).join(' · ')

  const presenterName =
    nextWorkshopFull?.presenter?.name ?? nextWorkshopFull?.instructorName ?? null

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

      {/* Desktop — existing layout (Phase 1, unchanged). */}
      <div className="hidden lg:block">
      <PageHeader title="Discover" subtitle="Workshops, library, and shop" />

      <div className="space-y-3.5 pt-3.5">
        {statsLine && (
          <p className="text-[12px] text-text-muted">{statsLine}</p>
        )}

        <div className="space-y-2 lg:space-y-0 lg:grid lg:grid-cols-3 lg:gap-4">
          {sections.map((s) => (
            <Link
              key={s.title}
              href={s.href}
              className="flex items-center gap-3.5 lg:flex-col lg:items-start lg:gap-3 bg-bg-card rounded-2xl py-3.5 px-3.5 lg:p-6 lg:min-h-[180px] transition-all duration-150 lg:hover:shadow-sm lg:hover:-translate-y-0.5"
              style={{ border: '1px solid var(--color-border)' }}
            >
              <div
                className={`w-10 h-10 lg:w-11 lg:h-11 rounded-xl ${s.color} flex items-center justify-center shrink-0`}
              >
                <s.Icon size={20} className={s.iconColor} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-medium text-text">{s.title}</p>
                <p className="text-[12px] lg:text-[13px] text-text-muted line-clamp-1 lg:mt-1">
                  {s.subtitle}
                </p>
              </div>
              <ChevronRight size={16} className="text-text-faint shrink-0 lg:hidden" />
            </Link>
          ))}
        </div>
      </div>

      {/* Section A — Coming up workshop */}
      {nextWorkshopFull && (
        <section className="mt-12">
          <p className="text-[11px] font-medium text-text-faint uppercase tracking-wider mb-2.5">
            Coming up
          </p>
          <Link
            href={`/user/discover/workshops/${nextWorkshopFull.id}`}
            className="block bg-bg-card rounded-2xl p-5 transition-colors duration-150 lg:hover:bg-white/80"
            style={{
              border: '1px solid var(--color-border)',
              borderLeft: '3px solid var(--color-accent)',
            }}
          >
            <p className="text-[18px] font-medium text-text leading-tight">
              {nextWorkshopFull.title}
            </p>
            {nextWorkshopFull.subtitle && (
              <p className="text-[13px] text-text-muted line-clamp-1 mt-1">
                {nextWorkshopFull.subtitle}
              </p>
            )}
            <p className="text-[13px] text-text-muted mt-2">
              {formatSessionDateRelative(nextWorkshopFull.startsAt)}
              {' · '}
              {nextWorkshopFull.durationMin} min
              {presenterName && (
                <>
                  {' · '}
                  with {presenterName}
                </>
              )}
            </p>
            <div className="flex items-center justify-between mt-3">
              <p className="text-[12px] text-text-muted">
                {nextWorkshopFull.capacity != null
                  ? `${nextWorkshopFull._count.registrations} of ${nextWorkshopFull.capacity} spots filled`
                  : `${nextWorkshopFull._count.registrations} registered`}
                {' · '}
                <span className="font-medium text-text">
                  {nextWorkshopFull.priceCents === 0
                    ? 'Free'
                    : `₹${(nextWorkshopFull.priceCents / 100).toLocaleString('en-IN')}`}
                </span>
              </p>
              <span className="text-[13px] text-primary font-medium">Learn more →</span>
            </div>
          </Link>
        </section>
      )}

      {/* Section B — From the library */}
      {libraryPreview.length > 0 && (
        <section className="mt-10">
          <p className="text-[11px] font-medium text-text-faint uppercase tracking-wider mb-2.5">
            From the library
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-2.5 lg:gap-4">
            {libraryPreview.map((item) => (
              <Link
                key={item.id}
                href={`/user/library/${item.id}`}
                className="bg-bg-card rounded-2xl p-2.5 lg:p-3 transition-all duration-150 lg:hover:shadow-sm lg:hover:-translate-y-0.5"
                style={{ border: '1px solid var(--color-border)' }}
              >
                <div className="relative w-full aspect-[3/4] rounded-xl bg-primary-tint flex items-center justify-center overflow-hidden">
                  {item.coverImage ? (
                    <Image
                      fill
                      src={item.coverImage}
                      alt={item.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <BookOpen size={28} className="text-primary/30" />
                  )}
                  <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded-full bg-black/50 backdrop-blur-sm">
                    <span className="text-[9px] font-medium text-white">
                      {item.type === 'FREE' ? 'Free' : `₹${Number(item.price)}`}
                    </span>
                  </div>
                </div>
                <p className="text-[13px] lg:text-[14px] font-medium text-text mt-2 line-clamp-2">
                  {item.title}
                </p>
              </Link>
            ))}
          </div>
          <Link
            href="/user/library"
            className="inline-block text-[13px] text-primary font-medium mt-3 hover:underline"
          >
            Browse all books →
          </Link>
        </section>
      )}

      {/* Section C — From the shop */}
      {shopPreview.length > 0 && (
        <section className="mt-10">
          <p className="text-[11px] font-medium text-text-faint uppercase tracking-wider mb-2.5">
            From the shop
          </p>
          <div className="grid grid-cols-2 gap-2.5 lg:gap-4">
            {shopPreview.map((p) => (
              <Link
                key={p.id}
                href={`/user/shop/${p.id}`}
                className="bg-bg-card rounded-2xl p-2.5 lg:p-3 transition-all duration-150 lg:hover:shadow-sm lg:hover:-translate-y-0.5"
                style={{ border: '1px solid var(--color-border-strong)' }}
              >
                <div className="relative w-full h-32 rounded-xl bg-bg-app flex items-center justify-center overflow-hidden">
                  {p.image ? (
                    <Image
                      fill
                      src={p.image}
                      alt={p.name}
                      className="w-full h-full object-cover rounded-xl"
                      unoptimized
                    />
                  ) : (
                    <ShoppingBag size={28} className="text-text-faint/30" />
                  )}
                </div>
                <p className="text-[13px] lg:text-[14px] font-medium text-text mt-2 line-clamp-2">
                  {p.name}
                </p>
                <p className="text-[12px] text-primary font-medium mt-0.5">
                  {'₹'}{Number(p.price).toLocaleString('en-IN')}
                </p>
              </Link>
            ))}
          </div>
          <Link
            href="/user/shop"
            className="inline-block text-[13px] text-primary font-medium mt-3 hover:underline"
          >
            Browse the shop →
          </Link>
        </section>
      )}

      {/* Section D — Community (NGO visits) */}
      <section className="mt-10">
        <p className="text-[11px] font-medium text-text-faint uppercase tracking-wider mb-2.5">
          Community
        </p>
        <Link
          href="/user/discover/ngo-visits"
          className="block bg-bg-card rounded-2xl p-5 transition-colors duration-150 lg:hover:bg-white/80"
          style={{
            border: '1px solid var(--color-border)',
            borderLeft: '3px solid var(--color-accent)',
          }}
        >
          <div className="flex items-start gap-4">
            <div className="w-11 h-11 rounded-xl bg-accent-tint flex items-center justify-center shrink-0">
              <HeartHandshake size={20} className="text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[16px] font-medium text-text">NGO Visits</p>
              <p className="text-[13px] text-text-muted mt-0.5">
                {nextNgoVisit
                  ? `Next: ${nextNgoVisit.ngoName} · ${formatSessionDateRelative(nextNgoVisit.visitDate)}`
                  : 'Volunteer with us on community outreach drives'}
              </p>
            </div>
            <ChevronRight size={16} className="text-text-faint shrink-0 self-center" />
          </div>
        </Link>
      </section>
      </div>
    </>
  )
}
