import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ArrowLeft, CalendarDays, Ticket } from 'lucide-react'

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
    <div className="space-y-5">
      <div className="flex items-center gap-3">
        <Link href="/user/discover" className="p-1">
          <ArrowLeft size={20} className="text-text-muted" />
        </Link>
        <h1 className="text-[16px] font-medium text-text">Workshops</h1>
      </div>

      {upcoming.length > 0 && (
        <div>
          <p className="text-[12px] font-medium text-text-faint uppercase tracking-wider mb-2.5">
            Upcoming
          </p>
          <div className="space-y-2.5">
            {upcoming.map((ws) => (
              <div
                key={ws.id}
                className="bg-bg-card rounded-2xl p-4 flex gap-3"
                style={{ border: '0.5px solid var(--color-border)' }}
              >
                <div className="w-12 h-12 rounded-xl bg-accent-tint flex items-center justify-center shrink-0 overflow-hidden">
                  {ws.coverImageUrl ? (
                    <img
                      src={ws.coverImageUrl}
                      alt={ws.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Ticket size={20} className="text-accent" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-medium text-text line-clamp-1">
                    {ws.title}
                  </p>
                  <div className="flex items-center gap-1.5 mt-1">
                    <CalendarDays size={12} className="text-text-faint" />
                    <p className="text-[12px] text-text-faint">
                      {ws.startsAt.toLocaleDateString('en-IN', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </p>
                  </div>
                  {ws.subtitle && (
                    <p className="text-[12px] text-text-muted mt-1 line-clamp-1">
                      {ws.subtitle}
                    </p>
                  )}
                  <p className="text-[12px] font-medium text-primary mt-1">
                    {ws.priceCents === 0
                      ? 'Free'
                      : `\u20B9${(ws.priceCents / 100).toFixed(0)}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {past.length > 0 && (
        <div>
          <p className="text-[12px] font-medium text-text-faint uppercase tracking-wider mb-2.5">
            Past
          </p>
          <div className="space-y-2.5">
            {past.map((ws) => (
              <div
                key={ws.id}
                className="bg-bg-card rounded-2xl p-4 opacity-60"
                style={{ border: '0.5px solid var(--color-border)' }}
              >
                <p className="text-[14px] font-medium text-text line-clamp-1">
                  {ws.title}
                </p>
                <p className="text-[12px] text-text-faint">
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
  )
}
