import { cache } from 'react'
import { prisma } from '@/lib/prisma'

export type UpcomingItem =
  | {
      kind: 'session'
      id: string
      title: string
      startsAt: Date
      durationMin: number
      meetLink: string | null
      counterpartyName: string
      counterpartyImage: string | null
      status: string
      href: string
    }
  | {
      kind: 'workshop' | 'circle'
      id: string
      title: string
      startsAt: Date
      durationMin: number
      meetLink: string | null
      counterpartyName: string | null
      counterpartyImage: string | null
      status: string
      href: string
    }
  | {
      kind: 'ngo'
      id: string
      title: string
      startsAt: Date
      durationMin: number
      meetLink: string | null
      counterpartyName: string | null
      counterpartyImage: string | null
      status: string
      href: string
    }

const DAY_MS = 24 * 60 * 60 * 1000
const SESSION_DURATION_MIN = 60
const MAX_ITEMS = 20

/**
 * Merge upcoming user sessions + workshop/circle registrations into a single
 * chronological list. Failed sub-queries degrade to [] for that source —
 * never throws. Cached per-request — same userId only hits the DB once
 * per render tree even if multiple components ask.
 */
export const getUpcomingItems = cache(async (userId: string, days = 30): Promise<UpcomingItem[]> => {
  const now = new Date()
  const horizon = new Date(now.getTime() + days * DAY_MS)

  const [sessions, registrations, ngoRegs] = await Promise.all([
    prisma.session.findMany({
      where: {
        userId,
        date: { gte: now, lt: horizon },
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
      select: {
        id: true,
        date: true,
        meetLink: true,
        status: true,
        doctor: {
          select: {
            photo: true,
            user: { select: { name: true } },
          },
        },
      },
      orderBy: { date: 'asc' },
    }).catch(() => []),

    prisma.workshopRegistration.findMany({
      where: {
        userId,
        refundedAt: null,
        workshop: {
          startsAt: { gte: now, lt: horizon },
          status: { not: 'CANCELLED' },
        },
      },
      select: {
        workshop: {
          select: {
            id: true,
            title: true,
            startsAt: true,
            durationMin: true,
            meetLink: true,
            status: true,
            type: true,
            presenter: { select: { name: true } },
          },
        },
      },
    }).catch(() => []),

    prisma.ngoJoinRequest.findMany({
      where: {
        userId,
        status: { not: 'CANCELLED' },
        ngoVisit: { isPublished: true, visitDate: { gte: now, lt: horizon } },
      },
      select: {
        ngoVisit: {
          select: { id: true, ngoName: true, location: true, visitDate: true },
        },
      },
    }).catch(() => []),
  ])

  const sessionItems: UpcomingItem[] = sessions.map((s) => ({
    kind: 'session',
    id: s.id,
    title: `Session with ${s.doctor.user.name}`,
    startsAt: s.date,
    durationMin: SESSION_DURATION_MIN,
    meetLink: s.meetLink,
    counterpartyName: s.doctor.user.name,
    counterpartyImage: s.doctor.photo,
    status: s.status,
    href: `/user/sessions/${s.id}`,
  }))

  const workshopItems: UpcomingItem[] = registrations.map((r) => {
    const w = r.workshop
    return {
      kind: w.type === 'CIRCLE' ? 'circle' : 'workshop',
      id: w.id,
      title: w.title,
      startsAt: w.startsAt,
      durationMin: w.durationMin,
      meetLink: w.meetLink,
      counterpartyName: w.presenter?.name ?? null,
      counterpartyImage: null,
      status: w.status,
      href: `/user/discover/workshops/${w.id}`,
    }
  })

  const ngoItems: UpcomingItem[] = ngoRegs.flatMap((r) =>
    r.ngoVisit
      ? [
          {
            kind: 'ngo' as const,
            id: r.ngoVisit.id,
            title: r.ngoVisit.ngoName,
            startsAt: r.ngoVisit.visitDate,
            durationMin: 0,
            meetLink: null,
            counterpartyName: r.ngoVisit.location,
            counterpartyImage: null,
            status: 'CONFIRMED',
            href: `/user/discover/ngo-visits/${r.ngoVisit.id}`,
          },
        ]
      : [],
  )

  return [...sessionItems, ...workshopItems, ...ngoItems]
    .sort((a, b) => a.startsAt.getTime() - b.startsAt.getTime())
    .slice(0, MAX_ITEMS)
})
