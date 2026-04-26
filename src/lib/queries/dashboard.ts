import { prisma } from '@/lib/prisma'
import type { Workshop, Session as DashboardSession } from '@/types/dashboard'

/**
 * Next published workshop starting within the next 14 days.
 * Returns null if none found.
 */
export async function getNextWorkshop(): Promise<Workshop | null> {
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
