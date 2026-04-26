import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Ticket, BookOpen, ShoppingBag, ChevronRight } from 'lucide-react'
import { getNextWorkshop } from '@/lib/queries/dashboard'
import PageHeader from '@/components/dashboard/page-header'

export default async function DiscoverHubPage() {
  const [workshop, recentMaterials, featuredProduct, upcomingCount, materialCount] = await Promise.all([
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
  ])

  const sections = [
    {
      title: 'Workshops',
      subtitle: workshop
        ? `Next: ${workshop.title}`
        : 'No upcoming workshops',
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
      subtitle: featuredProduct
        ? `Featured: ${featuredProduct.name}`
        : 'Browse products',
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

  return (
    <div>
      <PageHeader title="Discover" />

      <div className="space-y-3.5 pt-3.5">
        {statsLine && (
          <p className="text-[12px] text-text-faint">{statsLine}</p>
        )}

        <div className="space-y-2">
          {sections.map((s) => (
            <Link
              key={s.title}
              href={s.href}
              className="flex items-center gap-3.5 bg-bg-card rounded-2xl py-3.5 px-3.5"
              style={{ border: '0.5px solid var(--color-border)' }}
            >
              <div
                className={`w-10 h-10 rounded-xl ${s.color} flex items-center justify-center shrink-0`}
              >
                <s.Icon size={20} className={s.iconColor} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[15px] font-medium text-text">{s.title}</p>
                <p className="text-[12px] text-text-faint line-clamp-1">
                  {s.subtitle}
                </p>
              </div>
              <ChevronRight size={16} className="text-text-faint shrink-0" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  )
}
