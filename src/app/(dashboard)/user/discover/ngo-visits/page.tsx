import { prisma } from '@/lib/prisma'
import Image from 'next/image'
import Link from 'next/link'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { CalendarDays, MapPin, ChevronRight, HeartHandshake } from 'lucide-react'
import PageHeader from '@/components/dashboard/page-header'
import { formatSessionDate } from '@/lib/format-date'

export default async function DashboardNgoVisitsListPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const userId = session.user.id
  const now = new Date()

  const [upcoming, myRegistrations] = await Promise.all([
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
  ])

  const registeredIds = new Set(
    myRegistrations.map((r) => r.ngoVisitId).filter((id): id is string => !!id),
  )

  return (
    <div>
      <PageHeader title="NGO Visits" subtitle="Join our community outreach drives" back="/user/discover" />

      <div className="pt-3.5">
        {upcoming.length === 0 ? (
          <div
            className="bg-bg-card rounded-2xl p-8 text-center"
            style={{ border: '1px solid var(--color-border)' }}
          >
            <HeartHandshake size={32} className="mx-auto mb-3 text-accent" />
            <p className="text-[15px] font-medium text-text mb-1">No upcoming visits scheduled</p>
            <p className="text-[13px] text-text-muted">
              Check back soon — we run drives every 4–6 weeks.
            </p>
          </div>
        ) : (
          <div className="space-y-2 lg:space-y-3">
            {upcoming.map((visit) => {
              const isRegistered = registeredIds.has(visit.id)
              const firstPhoto = visit.photos[0] ?? null
              const initial = visit.ngoName[0]?.toUpperCase() ?? '?'

              return (
                <Link
                  key={visit.id}
                  href={`/user/discover/ngo-visits/${visit.id}`}
                  className="bg-bg-card rounded-2xl py-3 px-3.5 lg:p-4 flex gap-3 lg:gap-4 transition-colors duration-150 lg:hover:bg-white/60"
                  style={{ border: '1px solid var(--color-border)' }}
                >
                  <div className="relative w-12 h-12 lg:w-20 lg:h-20 rounded-xl bg-accent-tint flex items-center justify-center shrink-0 overflow-hidden">
                    {firstPhoto ? (
                      <Image
                        fill
                        src={firstPhoto}
                        alt={visit.ngoName}
                        sizes="(max-width: 1024px) 48px, 80px"
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <span className="text-[20px] lg:text-[28px] font-medium text-accent">
                        {initial}
                      </span>
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-medium text-text line-clamp-1">
                      {visit.ngoName}
                    </p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <CalendarDays size={12} className="text-text-faint" />
                      <p className="text-[12px] text-text-muted">
                        {formatSessionDate(visit.visitDate)}
                      </p>
                      <span className="text-text-faint">·</span>
                      <MapPin size={12} className="text-text-faint" />
                      <p className="text-[12px] text-text-muted line-clamp-1">{visit.location}</p>
                    </div>
                    <p className="text-[12px] text-text-muted mt-1 line-clamp-2">
                      {visit.description}
                    </p>
                  </div>

                  <div className="shrink-0 self-center flex flex-col items-end gap-1">
                    {isRegistered ? (
                      <span className="text-[11px] font-medium px-2 py-1 rounded-full bg-primary-tint text-primary">
                        ✓ Registered
                      </span>
                    ) : (
                      <span className="text-[12px] font-medium text-accent">Register</span>
                    )}
                    <ChevronRight size={16} className="text-text-faint" />
                  </div>
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
