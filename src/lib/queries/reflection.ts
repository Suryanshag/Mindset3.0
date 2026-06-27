import { cache } from 'react'
import { prisma } from '@/lib/prisma'
import { getCurrentUserBasics } from '@/lib/queries/current-user'
import { decryptField } from '@/lib/encryption'

/** Sessions grouped by month for the spine sidebar.
 *  Cached per-request: DesktopShell calls this on every /user/* render
 *  and so might other components that share the same render tree. */
export const getSpineSessions = cache(async (userId: string) => {
  const sessions = await prisma.session.findMany({
    where: {
      userId,
      status: { in: ['COMPLETED', 'CONFIRMED', 'PENDING'] },
    },
    select: {
      id: true,
      date: true,
      status: true,
      doctor: {
        select: {
          user: { select: { name: true } },
        },
      },
    },
    orderBy: { date: 'desc' },
    take: 50,
  })

  return sessions.map((s) => ({
    id: s.id,
    date: s.date,
    status: s.status,
    doctorName: s.doctor.user.name,
  }))
})

export type SpineSession = Awaited<ReturnType<typeof getSpineSessions>>[number]

/** "Your therapist" mini-card data for the desktop spine. Derived from
 *  the user's most-recent session (same convention as /user/profile).
 *  Returns null if the user has never had a session. Counts non-cancelled
 *  sessions with this doctor as the "N sessions" line; the "since" line
 *  uses the earliest session date with that doctor. Cached per request. */
export const getSpineTherapist = cache(async (userId: string) => {
  const latest = await prisma.session.findFirst({
    where: { userId },
    orderBy: { date: 'desc' },
    select: {
      doctorId: true,
      doctor: {
        select: {
          designation: true,
          photo: true,
          user: { select: { name: true } },
        },
      },
    },
  })
  if (!latest) return null

  const [sessionCount, earliest] = await Promise.all([
    prisma.session.count({
      where: {
        userId,
        doctorId: latest.doctorId,
        status: { in: ['COMPLETED', 'CONFIRMED', 'PENDING'] },
      },
    }),
    prisma.session.findFirst({
      where: { userId, doctorId: latest.doctorId },
      orderBy: { date: 'asc' },
      select: { date: true },
    }),
  ])

  return {
    doctorId: latest.doctorId,
    name: latest.doctor.user.name,
    designation: latest.doctor.designation,
    photo: latest.doctor.photo,
    sessionCount,
    sinceDate: earliest?.date ?? null,
  }
})

export type SpineTherapist = NonNullable<Awaited<ReturnType<typeof getSpineTherapist>>>

/** Data for the ReflectionLanding component (desktop /user).
 *  Cached per-request: the /user home page calls this directly and it also
 *  fans out 6-8 queries, so memoizing avoids re-running the whole batch if
 *  another component in the same render tree needs it. */
export const getReflectionLandingData = cache(async (userId: string) => {
  const now = new Date()

  // First batch: 6 independent queries. user goes through the cached
  // helper so it dedupes with layout/page calls. totalPending (was
  // sequential in the prior version) moves here since it depends on
  // nothing.
  const [
    user,
    lastSession,
    nextSession,
    pendingAssignments,
    registeredWorkshops,
    totalPending,
  ] = await Promise.all([
    getCurrentUserBasics(userId),

    // Most recent past session
    prisma.session.findFirst({
      where: {
        userId,
        date: { lt: now },
        status: { in: ['COMPLETED', 'CONFIRMED', 'PENDING'] },
      },
      orderBy: { date: 'desc' },
      select: {
        id: true,
        date: true,
        doctorId: true,
        doctor: {
          select: {
            user: { select: { name: true } },
          },
        },
      },
    }),

    // Next upcoming session
    prisma.session.findFirst({
      where: {
        userId,
        date: { gte: now },
        status: { in: ['PENDING', 'CONFIRMED'] },
      },
      orderBy: { date: 'asc' },
      select: {
        id: true,
        date: true,
        meetLink: true,
        status: true,
        doctor: {
          select: {
            user: { select: { name: true } },
          },
        },
      },
    }),

    // Pending assignments (limit 3)
    prisma.assignment.findMany({
      where: { userId, status: 'PENDING' },
      select: {
        id: true,
        title: true,
        type: true,
      },
      orderBy: { dueDate: 'asc' },
      take: 3,
    }),

    // Workshops user is registered for in the next 7 days
    prisma.workshopRegistration.findMany({
      where: {
        userId,
        workshop: {
          startsAt: { gte: now, lte: new Date(now.getTime() + 7 * 86400000) },
          published: true,
        },
      },
      select: {
        workshop: {
          select: { id: true, title: true, startsAt: true },
        },
      },
      take: 1,
    }),

    // Total pending count (independent — was awaited after the lastSession
    // chain in the prior version, costing one extra round-trip).
    prisma.assignment.count({
      where: { userId, status: 'PENDING' },
    }),
  ])

  // Second batch: depends on lastSession.date — counts since last session.
  // Only runs when there IS a last session.
  let entriesSinceLastSession = 0
  let completedSinceLastSession = 0
  if (lastSession) {
    const [ec, ac] = await Promise.all([
      prisma.journalEntry.count({
        where: { userId, isDraft: false, entryDate: { gte: lastSession.date } },
      }),
      prisma.assignment.count({
        where: {
          userId,
          status: { in: ['COMPLETED', 'SUBMITTED', 'REVIEWED'] },
          updatedAt: { gte: lastSession.date },
        },
      }),
    ])
    entriesSinceLastSession = ec
    completedSinceLastSession = ac
  }

  return {
    userName: user?.name ?? 'there',
    lastSession: lastSession
      ? {
          id: lastSession.id,
          date: lastSession.date,
          doctorId: lastSession.doctorId,
          doctorName: lastSession.doctor.user.name,
        }
      : null,
    nextSession: nextSession
      ? {
          id: nextSession.id,
          date: nextSession.date,
          meetLink: nextSession.meetLink,
          status: nextSession.status as string,
          doctorName: nextSession.doctor.user.name,
        }
      : null,
    entriesSinceLastSession,
    completedSinceLastSession,
    pendingAssignments,
    totalPendingCount: totalPending,
    upcomingWorkshop: registeredWorkshops[0]?.workshop ?? null,
  }
})

export type ReflectionLandingData = Awaited<ReturnType<typeof getReflectionLandingData>>

/** Data for ChapterView — a session and everything that orbited it. */
export async function getChapterData(userId: string, sessionId: string) {
  // Get the target session. Explicit select so the encrypted notes column
  // is the only PHI loaded — everything else is metadata used downstream.
  const session = await prisma.session.findFirst({
    where: { id: sessionId, userId },
    select: {
      id: true,
      date: true,
      status: true,
      meetLink: true,
      doctorId: true,
      notesEncrypted: true,
      doctor: {
        select: {
          designation: true,
          photo: true,
          user: { select: { name: true } },
        },
      },
    },
  })

  if (!session) return null

  // Find the next session (to bound the chapter window)
  const nextSession = await prisma.session.findFirst({
    where: {
      userId,
      date: { gt: session.date },
      status: { in: ['COMPLETED', 'CONFIRMED', 'PENDING'] },
    },
    orderBy: { date: 'asc' },
    select: { date: true },
  })

  // Window: from session date to next session date (or +14 days), capped at now
  const now = new Date()
  const rawEnd = nextSession
    ? nextSession.date
    : new Date(session.date.getTime() + 14 * 86400000)
  const windowEnd = rawEnd < now ? rawEnd : now

  // Fetch all orbiting content within the window
  const [journalEntries, completedAssignments, attendedWorkshops] =
    await Promise.all([
      prisma.journalEntry
        .findMany({
          where: {
            userId,
            isDraft: false,
            entryDate: { gte: session.date, lt: windowEnd },
          },
          select: {
            id: true,
            titleEncrypted: true,
            bodyEncrypted: true,
            mood: true,
            entryDate: true,
          },
          orderBy: { entryDate: 'asc' },
        })
        .then((rows) =>
          rows.map((r) => ({
            id: r.id,
            title: decryptField(r.titleEncrypted),
            body: decryptField(r.bodyEncrypted) ?? '',
            mood: r.mood,
            entryDate: r.entryDate,
          }))
        ),

      prisma.assignment.findMany({
        where: {
          userId,
          doctorId: session.doctorId,
          status: { in: ['COMPLETED', 'SUBMITTED', 'REVIEWED'] },
          updatedAt: { gte: session.date, lt: windowEnd },
        },
        select: {
          id: true,
          title: true,
          type: true,
          status: true,
          updatedAt: true,
        },
        orderBy: { updatedAt: 'asc' },
      }),

      prisma.workshopRegistration.findMany({
        where: {
          userId,
          workshop: {
            startsAt: { gte: session.date, lt: windowEnd },
            published: true,
          },
        },
        select: {
          workshop: {
            select: {
              id: true,
              title: true,
              startsAt: true,
            },
          },
        },
      }),
    ])

  // Build timeline items sorted by date
  type TimelineItem =
    | { type: 'journal'; date: Date; data: (typeof journalEntries)[number] }
    | { type: 'assignment'; date: Date; data: (typeof completedAssignments)[number] }
    | { type: 'workshop'; date: Date; data: { id: string; title: string; startsAt: Date } }

  const timeline: TimelineItem[] = [
    ...journalEntries.map(
      (e) => ({ type: 'journal' as const, date: e.entryDate, data: e })
    ),
    ...completedAssignments.map(
      (a) => ({ type: 'assignment' as const, date: a.updatedAt, data: a })
    ),
    ...attendedWorkshops.map(
      (w) => ({ type: 'workshop' as const, date: w.workshop.startsAt, data: w.workshop })
    ),
  ].sort((a, b) => a.date.getTime() - b.date.getTime())

  // For upcoming sessions, fetch pending assignments due before this session
  const isUpcoming =
    session.date > now &&
    (session.status === 'PENDING' || session.status === 'CONFIRMED')

  const preSessionAssignments = isUpcoming
    ? await prisma.assignment.findMany({
        where: {
          userId,
          status: 'PENDING',
          dueDate: { not: null, lt: session.date },
        },
        select: {
          id: true,
          title: true,
          type: true,
          dueDate: true,
        },
        orderBy: { dueDate: 'asc' },
      })
    : []

  return {
    session: {
      id: session.id,
      date: session.date,
      status: session.status as string,
      notes: decryptField(session.notesEncrypted),
      meetLink: session.meetLink,
      doctorId: session.doctorId,
      doctorName: session.doctor.user.name,
      doctorDesignation: session.doctor.designation,
      doctorPhoto: session.doctor.photo,
    },
    timeline,
    preSessionAssignments,
  }
}

export type ChapterData = NonNullable<Awaited<ReturnType<typeof getChapterData>>>
export type TimelineItem = ChapterData['timeline'][number]
export type PreSessionAssignment = ChapterData['preSessionAssignments'][number]
