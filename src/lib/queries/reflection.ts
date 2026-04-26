import { prisma } from '@/lib/prisma'

/** Sessions grouped by month for the spine sidebar. */
export async function getSpineSessions(userId: string) {
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
}

export type SpineSession = Awaited<ReturnType<typeof getSpineSessions>>[number]

/** Data for the ReflectionLanding component (desktop /user). */
export async function getReflectionLandingData(userId: string) {
  const now = new Date()

  const [
    user,
    lastSession,
    nextSession,
    pendingAssignments,
    registeredWorkshops,
  ] = await Promise.all([
    prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    }),

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
  ])

  // Count journal entries + completed assignments since last session
  let entriesSinceLastSession = 0
  let completedSinceLastSession = 0
  if (lastSession) {
    const [ec, ac] = await Promise.all([
      prisma.journalEntry.count({
        where: { userId, entryDate: { gte: lastSession.date } },
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

  // Total pending count (to say "and N more")
  const totalPending = await prisma.assignment.count({
    where: { userId, status: 'PENDING' },
  })

  return {
    userName: user?.name ?? 'there',
    lastSession: lastSession
      ? {
          id: lastSession.id,
          date: lastSession.date,
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
}

export type ReflectionLandingData = Awaited<ReturnType<typeof getReflectionLandingData>>

/** Data for ChapterView — a session and everything that orbited it. */
export async function getChapterData(userId: string, sessionId: string) {
  // Get the target session
  const session = await prisma.session.findFirst({
    where: { id: sessionId, userId },
    include: {
      doctor: {
        include: { user: { select: { name: true } } },
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

  // Window: from session date to next session date (or +14 days)
  const windowEnd = nextSession
    ? nextSession.date
    : new Date(session.date.getTime() + 14 * 86400000)

  // Fetch all orbiting content within the window
  const [journalEntries, completedAssignments, attendedWorkshops] =
    await Promise.all([
      prisma.journalEntry.findMany({
        where: {
          userId,
          entryDate: { gte: session.date, lt: windowEnd },
        },
        select: {
          id: true,
          title: true,
          body: true,
          mood: true,
          entryDate: true,
        },
        orderBy: { entryDate: 'asc' },
      }),

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

  return {
    session: {
      id: session.id,
      date: session.date,
      status: session.status as string,
      notes: session.notes,
      meetLink: session.meetLink,
      doctorId: session.doctorId,
      doctorName: session.doctor.user.name,
      doctorDesignation: session.doctor.designation,
      doctorPhoto: session.doctor.photo,
    },
    timeline,
  }
}

export type ChapterData = NonNullable<Awaited<ReturnType<typeof getChapterData>>>
export type TimelineItem = ChapterData['timeline'][number]
