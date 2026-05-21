import { prisma } from '@/lib/prisma'
import Image from 'next/image'
import Link from 'next/link'
import { CalendarDays, Ticket, ChevronRight } from 'lucide-react'
import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import PageHeader from '@/components/dashboard/page-header'
import { formatSessionDate } from '@/lib/format-date'
import MobileWorkshopsList from '@/components/mobile/workshops-list'

export default async function WorkshopsListPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')
  const userId = session.user.id
  const now = new Date()

  const [upcoming, pastRegistrations] = await Promise.all([
    prisma.workshop
      .findMany({
        where: { published: true, startsAt: { gte: now } },
        orderBy: { startsAt: 'asc' },
        include: {
          presenter: { select: { name: true } },
          _count: { select: { registrations: true } },
        },
      })
      .catch(() => []),
    // Workshops THIS user has registered for that have already happened.
    prisma.workshopRegistration
      .findMany({
        where: {
          userId,
          workshop: { startsAt: { lt: now } },
        },
        orderBy: { workshop: { startsAt: 'desc' } },
        select: {
          workshop: {
            select: { id: true, title: true, startsAt: true },
          },
        },
      })
      .catch(() => []),
  ])

  const hasAttended = pastRegistrations.length > 0

  return (
    <>
      {/* Mobile — Phase 5 ported list. */}
      <div className="lg:hidden">
        <MobileWorkshopsList
          upcoming={upcoming.map((w) => ({
            id: w.id,
            title: w.title,
            subtitle: w.subtitle,
            description: w.description,
            coverImageUrl: w.coverImageUrl,
            instructorName: w.instructorName,
            presenterName: w.presenter?.name ?? null,
            startsAt: w.startsAt.toISOString(),
            durationMin: w.durationMin,
            priceCents: w.priceCents,
            capacity: w.capacity,
            registrationsCount: w._count.registrations,
          }))}
          attended={pastRegistrations.map((r) => ({
            id: r.workshop.id,
            title: r.workshop.title,
            startsAt: r.workshop.startsAt.toISOString(),
          }))}
        />
      </div>

      {/* Desktop — existing layout, unchanged. */}
      <div className="hidden lg:block">
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
                  style={{ border: '1px solid var(--color-border)' }}
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
                        {formatSessionDate(ws.startsAt)}
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
                        : `₹${(ws.priceCents / 100).toFixed(0)}`}
                    </p>
                  </div>
                  <ChevronRight size={16} className="text-text-faint shrink-0 self-center" />
                </Link>
              ))}
            </div>
          </div>
        )}

        {upcoming.length === 0 && !hasAttended && (
          <div className="flex flex-col items-center py-12">
            <Ticket size={28} className="text-text-faint mb-2" />
            <p className="text-[14px] text-text-muted">No workshops yet</p>
          </div>
        )}

        {/* Conditional below: explainer for new users, past-attended for returning */}
        {hasAttended ? (
          <section>
            <p className="text-[12px] font-medium text-text-faint uppercase tracking-wider mb-2.5">
              You&apos;ve attended
            </p>
            <div className="space-y-2">
              {pastRegistrations.map((reg) => (
                <div
                  key={reg.workshop.id}
                  className="bg-bg-card rounded-2xl py-3 px-3.5 lg:p-4 flex items-center gap-3"
                  style={{ border: '1px solid var(--color-border)' }}
                >
                  <div className="w-9 h-9 rounded-xl bg-accent-tint flex items-center justify-center shrink-0">
                    <Ticket size={16} className="text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[14px] font-medium text-text line-clamp-1">
                      {reg.workshop.title}
                    </p>
                    <p className="text-[12px] text-text-muted">
                      Attended {formatSessionDate(reg.workshop.startsAt)}
                    </p>
                  </div>
                  <Link
                    href="/user/discover/workshops"
                    className="text-[12px] text-primary font-medium shrink-0 hover:underline"
                  >
                    Browse similar →
                  </Link>
                </div>
              ))}
            </div>
          </section>
        ) : (
          <section>
            <div
              className="bg-bg-card rounded-2xl p-5 space-y-3"
              style={{ border: '1px solid var(--color-border-strong)' }}
            >
              <p className="text-[16px] font-medium text-text">New to workshops?</p>
              <p className="text-[14px] text-text-muted leading-relaxed">
                Workshops are small group sessions led by a Mindset therapist on
                a specific theme — managing anxiety, sleep, relationships, work
                stress, parenting.
              </p>
              <p className="text-[14px] text-text-muted leading-relaxed">
                They run 60–90 minutes and cap at 25 people so there&apos;s room
                to ask questions. You join via video link, just like a session.
              </p>
              <p className="text-[14px] text-text-muted leading-relaxed">
                Most are free; some specialized ones are paid. Browse upcoming
                workshops above or check back weekly — we add new ones often.
              </p>
            </div>
          </section>
        )}
      </div>
      </div>
    </>
  )
}
