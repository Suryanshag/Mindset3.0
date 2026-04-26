import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Header from '@/components/dashboard/header'
import MoodCheckIn from '@/components/dashboard/mood-check-in'
import NextSessionCard from '@/components/dashboard/next-session-card'
import StatsRow from '@/components/dashboard/stats-row'
import ProfileCompletionCard from '@/components/dashboard/profile-completion-card'
import TodaysFocus from '@/components/dashboard/todays-focus'
import WorkshopBanner from '@/components/dashboard/workshop-banner'
import { getNextWorkshop, getUnreadNotificationCount, getUpcomingSession, getTodaysMoodCheckIn, getUserStats } from '@/lib/queries/dashboard'

export default async function UserHome({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const session = await auth()
  const userId = session?.user?.id

  const endOfToday = new Date()
  endOfToday.setHours(23, 59, 59, 999)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  // Real data: user info, workshop, notifications, pending assignments, upcoming session
  const [dbUser, workshop, unreadCount, pendingAssignments, upcomingSession, todaysMood, realStats] = await Promise.all([
    userId
      ? prisma.user
          .findUnique({
            where: { id: userId },
            select: {
              name: true,
              image: true,
              phone: true,
              dateOfBirth: true,
              preferredLanguage: true,
              emergencyContact: true,
            },
          })
          .catch(() => null)
      : Promise.resolve(null),
    getNextWorkshop().catch(() => null),
    userId ? getUnreadNotificationCount(userId).catch(() => 0) : Promise.resolve(0),
    userId
      ? prisma.assignment
          .findMany({
            where: {
              userId,
              status: 'PENDING',
              OR: [
                { dueDate: { lte: endOfToday } },
                { dueDate: null, createdAt: { lt: sevenDaysAgo } },
              ],
            },
            include: {
              doctor: { include: { user: { select: { name: true } } } },
            },
            orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
            take: 5,
          })
          .catch(() => [])
      : Promise.resolve([]),
    userId ? getUpcomingSession(userId).catch(() => null) : Promise.resolve(null),
    userId ? getTodaysMoodCheckIn(userId).catch(() => null) : Promise.resolve(null),
    userId
      ? getUserStats(userId).catch(() => ({ streak: 0, sessionsCompleted: 0, mindfulHours: 0 }))
      : Promise.resolve({ streak: 0, sessionsCompleted: 0, mindfulHours: 0 }),
  ])

  // Derive user display info from real DB row
  const userName = dbUser?.name ?? session?.user?.name ?? 'User'
  const avatarUrl = dbUser?.image ?? null
  const avatarInitials = userName
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  // Profile completion — computed from real User fields
  const profileFields = [
    dbUser?.name,
    dbUser?.image,
    dbUser?.phone,
    dbUser?.dateOfBirth,
    dbUser?.preferredLanguage,
    dbUser?.emergencyContact,
  ]
  const profileDone = profileFields.filter(Boolean).length
  const profileTotal = profileFields.length

  const hasAnyStats =
    realStats.sessionsCompleted > 0 ||
    realStats.mindfulHours > 0 ||
    realStats.streak > 0

  // Build TodaysFocus from real assignments
  const focusAssignment = pendingAssignments[0] ?? null
  const focusItem = focusAssignment
    ? {
        id: focusAssignment.id,
        type: 'assignment' as const,
        title: focusAssignment.title,
        meta:
          focusAssignment.dueDate &&
          focusAssignment.dueDate <= endOfToday
            ? 'Due today'
            : `From ${focusAssignment.doctor.user.name}`,
        href: `/user/practice/assignments/${focusAssignment.id}`,
      }
    : null
  const moreCount = Math.max(0, pendingAssignments.length - 1)

  return (
    <div className="space-y-3.5">
      {/* 1. Header */}
      <Header
        name={userName}
        avatarInitials={avatarInitials}
        avatarUrl={avatarUrl}
        streak={realStats.streak}
        unreadNotifications={unreadCount}
      />

      {/* 2. Mood check-in — real data */}
      <MoodCheckIn todaysCheckIn={todaysMood} />

      {/* 3. Next session card — real data */}
      <NextSessionCard session={upcomingSession} />

      {/* 4. Stats row vs profile completion — mutually exclusive */}
      {hasAnyStats ? (
        <StatsRow stats={realStats} />
      ) : (
        <ProfileCompletionCard done={profileDone} total={profileTotal} />
      )}

      {/* 5. Today's focus — real pending assignments */}
      {focusItem && (
        <div>
          <TodaysFocus item={focusItem} />
          {moreCount > 0 && (
            <a
              href="/user/practice/assignments"
              className="block text-[11px] text-primary font-medium mt-1.5 ml-1"
            >
              + {moreCount} more in your assignments
            </a>
          )}
        </div>
      )}

      {/* 6. Workshop banner — real data from DB */}
      {workshop && <WorkshopBanner workshop={workshop} />}
    </div>
  )
}
