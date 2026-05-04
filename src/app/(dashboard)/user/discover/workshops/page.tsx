import { prisma } from '@/lib/prisma'
import Image from 'next/image'
import Link from 'next/link'
import { CalendarDays, Ticket, ChevronRight } from 'lucide-react'
import PageHeader from '@/components/dashboard/page-header'

export default async function WorkshopsListPage() {
  const now = new Date()

  const [upcoming, past] = await Promise.all([
    prisma.workshop
      .findMany({
        where: { published: true, startsAt: { gte: now } },
        orderBy: { startsAt: 'asc' },
      })
      .catch(() => []),
    prisma.workshop
      .findMany({
        where: { published: true, startsAt: { lt: now } },
        orderBy: { startsAt: 'desc' },
        take: 10,
      })
      .catch(() => []),
  ])

  return (
    <div>
      <PageHeader title="Workshops" back="/user/discover" />

      <div className="space-y-5 pt-3.5">
        {upcoming.length > 0 && (
          <div>
            <p className="text-[12px] font-medium text-text-faint uppercase tracking-wider mb-2.5">
              Upcoming
            </p>
            <div className="space-y-2">
              {upcoming.map((ws) => (
                <Link
                  key={ws.id}
                  href={`/user/discover/workshops/${ws.id}`}
                  className="bg-bg-card rounded-2xl py-3 px-3.5 lg:p-4 flex gap-3 lg:gap-4 transition-colors duration-150 lg:hover:bg-white/60"
                  style={{ border: '0.5px solid var(--color-border)' }}
                >
                  <div className="relative w-10 h-10 lg:w-20 lg:h-20 rounded-xl bg-accent-tint flex items-center justify-center shrink-0 overflow-hidden">
                    {ws.coverImageUrl ? (
                      <Image
                        fill
                        src={ws.coverImageUrl}
                        alt={ws.title}
                        sizes="(max-width: 1024px) 40px, 80px"
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <Ticket size={18} className="text-accent" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-medium text-text line-clamp-1">
                      {ws.title}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <CalendarDays size={12} className="text-text-faint" />
                      <p className="text-[12px] text-text-muted">
                        {ws.startsAt.toLocaleDateString('en-IN', {
                          day: 'numeric',
                          month: 'short',
                          year: 'numeric',
                        })}
                      </p>
                    </div>
                    {ws.subtitle && (
                      <p className="text-[12px] text-text-muted mt-0.5 line-clamp-1">
                        {ws.subtitle}
                      </p>
                    )}
                    <p className="text-[12px] font-medium text-primary mt-0.5">
                      {ws.priceCents === 0
                        ? 'Free'
                        : `\u20B9${(ws.priceCents / 100).toFixed(0)}`}
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-text-faint shrink-0 self-center" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {past.length > 0 && (
          <div>
            <p className="text-[12px] font-medium text-text-faint uppercase tracking-wider mb-2.5">
              Past
            </p>
            <div className="space-y-2">
              {past.map((ws) => (
                <div
                  key={ws.id}
                  className="bg-bg-card rounded-2xl py-3 px-3.5 opacity-60"
                  style={{ border: '0.5px solid var(--color-border)' }}
                >
                  <p className="text-[15px] font-medium text-text line-clamp-1">
                    {ws.title}
                  </p>
                  <p className="text-[12px] text-text-muted">
                    {ws.startsAt.toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {upcoming.length === 0 && past.length === 0 && (
          <div className="flex flex-col items-center py-12">
            <Ticket size={28} className="text-text-faint mb-2" />
            <p className="text-[14px] text-text-muted">No workshops yet</p>
          </div>
        )}
      </div>
    </div>
  )
}
