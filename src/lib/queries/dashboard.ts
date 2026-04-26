import { prisma } from '@/lib/prisma'
import type { Workshop, Session as DashboardSession } from '@/types/dashboard'

/**
 * Next published workshop starting within the next 14 days.
 * Returns null if none found.
 */
export async function getNextWorkshop(userId?: string): Promise<Workshop | null> {
  const now = new Date()
  const twoWeeks = new Date(now.getTime() + 14 * 24 * 60 * 60 * 1000)

  const ws = await prisma.workshop.findFirst({
    where: {
      published: true,
      startsAt: { gte: now, lte: twoWeeks },
    },
    orderBy: { startsAt: 'asc' },
  })

  if (!ws) return null

  let isRegistered = false
  if (userId) {
    const reg = await prisma.workshopRegistration.findUnique({
      where: { userId_workshopId: { userId, workshopId: ws.id } },
    }).catch(() => null)
    isRegistered = !!reg
  }

  return {
    id: ws.id,
    title: ws.title,
    date: ws.startsAt.toISOString(),
    time: ws.startsAt.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }),
    price: ws.priceCents === 0 ? 'Free' : `\u20B9${(ws.priceCents / 100).toFixed(0)}`,
    imageUrl: ws.coverImageUrl,
    isRegistered,
    whatsappUrl: ws.whatsappGroupUrl ?? null,
  }
}

/**
 * Next upcoming session for a user (status PENDING or CONFIRMED, date >= now).
 */
export async function getUpcomingSession(userId: string): Promise<DashboardSession | null> {
  const s = await prisma.session.findFirst({
    where: {
      userId,
      date: { gte: new Date() },
      status: { in: ['PENDING', 'CONFIRMED'] },
    },
    orderBy: { date: 'asc' },
    include: {
      doctor: {
        include: { user: { select: { name: true } } },
      },
    },
  })

  if (!s) return null

  return {
    id: s.id,
    doctorName: s.doctor.user.name,
    doctorSpecialty: s.doctor.designation,
    doctorAvatarUrl: s.doctor.photo,
    date: s.date.toISOString(),
    meetLink: s.meetLink,
    status: s.status as DashboardSession['status'],
  }
}

/**
 * Streak: consecutive days with at least one engagement event.
 */
export async function getUserStreak(userId: string): Promise<number> {
  const events = await prisma.$queryRaw<{ d: Date }[]>`
    SELECT DISTINCT DATE(occurred_at AT TIME ZONE 'UTC') as d
    FROM engagement_events
    WHERE user_id = ${userId}
    ORDER BY d DESC
    LIMIT 90
  `

  if (events.length === 0) return 0

  const toDateStr = (d: Date) => {
    const dt = new Date(d)
    return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
  }

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)

  const firstEventDate = toDateStr(events[0].d)
  const todayStr = toDateStr(today)
  const yesterdayStr = toDateStr(yesterday)

  // Streak only counts if user engaged today or yesterday
  if (firstEventDate !== todayStr && firstEventDate !== yesterdayStr) {
    return 0
  }

  let streak = 1
  for (let i = 1; i < events.length; i++) {
    const prev = new Date(events[i - 1].d)
    prev.setDate(prev.getDate() - 1)
    if (toDateStr(events[i].d) === toDateStr(prev)) {
      streak++
    } else {
      break
    }
  }
  return streak
}

/**
 * Dashboard stats: sessions completed, mindful hours, streak.
 */
export async function getUserStats(userId: string) {
  const [streak, sessionsCompleted] = await Promise.all([
    getUserStreak(userId),
    prisma.session.count({
      where: { userId, status: 'COMPLETED' },
    }),
  ])

  // Mindful hours: sum of breathing assignment durations (stored in metadata.durationSeconds)
  // For v1, use 0 — most users won't have breathing data yet
  const mindfulHours = 0

  return {
    streak,
    sessionsCompleted,
    mindfulHours,
  }
}

/**
 * Today's mood check-in for a user (null if not checked in today).
 */
export async function getTodaysMoodCheckIn(userId: string): Promise<{ mood: 1|2|3|4|5 } | null> {
  const today = new Date()
  today.setHours(0, 0, 0, 0)

  const checkIn = await prisma.moodCheckIn.findUnique({
    where: {
      userId_checkedInDate: {
        userId,
        checkedInDate: today,
      },
    },
    select: { mood: true },
  })

  if (!checkIn) return null
  return { mood: checkIn.mood as 1|2|3|4|5 }
}

/**
 * Count of unread notifications for a user.
 */
export async function getUnreadNotificationCount(userId: string): Promise<number> {
  return prisma.notification.count({
    where: { userId, readAt: null },
  })
}
