import { auth } from '@/lib/auth'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import ReflectionLanding from '@/components/dashboard/desktop/reflection-landing'
import RailPortal from '@/components/dashboard/desktop/rail-portal'
import HomeRail from '@/components/dashboard/desktop/home-rail'
import MobileHome from '@/components/mobile/home'
import {
  getNextWorkshop,
  getUpcomingWorkshops,
  getUnreadNotificationCount,
  getUpcomingSession,
  getTodaysMoodCheckIn,
  getUserStats,
  getUserEngagementState,
  getLastWeekMoods,
} from '@/lib/queries/dashboard'
import { getReflectionLandingData } from '@/lib/queries/reflection'
import { getCurrentUserBasics } from '@/lib/queries/current-user'
import { endOfDayIST } from '@/lib/format-date'
import { userHasOnboardingActivity } from '@/lib/queries/onboarding'
import { getRecentSessionFollowups } from '@/lib/queries/post-session'
import { CrisisBanner } from '@/components/shared/crisis-banner'

export default async function UserHome({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const params = await searchParams
  const session = await auth()
  const userId = session?.user?.id

  // First-time onboarding gate (Phase 1 sub-phase 1.3) — only on /user, per
  // Resolved Decision 9. We redirect to /onboarding when: the user is
  // signed in, the mindset_onboarded cookie is missing, AND they have no
  // recorded activity (sessions/journal/mood). The check is cheap (three
  // parallel COUNTs) and only triggers for unflagged users. Returning users
  // on a fresh device hit the activity check and skip onboarding.
  if (userId) {
    const cookieStore = await cookies()
    if (!cookieStore.get('mindset_onboarded')) {
      const hasActivity = await userHasOnboardingActivity(userId).catch(() => true)
      if (!hasActivity) {
        redirect('/onboarding')
      }
    }
  }

  // IST end-of-day for "due today" assignment filter — UTC server's
  // setHours(23,…) is 5h30m short.
  const endOfToday = endOfDayIST(new Date())
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)

  // Fetch all data in parallel — mobile + desktop. weekMoods is new for
  // the Phase 2 mobile home; realStats still feeds the desktop variant.
  const [dbUser, workshop, unreadCount, pendingAssignments, upcomingSession, todaysMood, realStats, reflectionData, engagementState, weekMoods, upcomingWorkshops] = await Promise.all([
    userId ? getCurrentUserBasics(userId).catch(() => null) : Promise.resolve(null),
    getNextWorkshop(userId ?? undefined).catch(() => null),
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
    userId
      ? getReflectionLandingData(userId).catch(() => null)
      : Promise.resolve(null),
    userId
      ? getUserEngagementState(userId).catch(() => 'empty' as const)
      : Promise.resolve('empty' as const),
    userId
      ? getLastWeekMoods(userId).catch(() => [] as { date: Date; mood: 1|2|3|4|5 | null }[])
      : Promise.resolve([] as { date: Date; mood: 1|2|3|4|5 | null }[]),
    getUpcomingWorkshops(3).catch(() => [] as { id: string; title: string; host: string; when: string; coverImageUrl: string | null; priceLabel: string }[]),
  ])

  // Phase 3 — recent SessionFollowups feed the HomeEngaged "Your last N
  // sessions" panel. Empty array means HomeEngaged renders its fallback
  // "A look back" copy card.
  const recentFollowups = userId
    ? await getRecentSessionFollowups(userId, 3).catch(() => [])
    : []

  // Derive user display info from real DB row
  const userName = dbUser?.name ?? session?.user?.name ?? 'User'

  // Suppress the unused-var warning for the rest of the previously-used
  // computations (workshop, realStats, etc.) — desktop still uses them
  // via ReflectionLanding / HomeRail's internal data, and `workshop` +
  // assignments-from-prisma are preserved for the engaged-state mobile
  // home (pendingAssignments) and may return for desktop tweaks.
  void workshop
  void realStats

  return (
    <>
      {/* Mobile dashboard — Phase 2 ported home with 3 engagement states. */}
      <div className="lg:hidden">
        <MobileHome
          engagementState={engagementState}
          name={userName}
          unreadCount={unreadCount}
          todaysMood={todaysMood?.mood ?? null}
          upcomingSession={upcomingSession}
          pendingAssignments={pendingAssignments.map((a) => ({
            id: a.id,
            title: a.title,
            dueDate: a.dueDate?.toISOString() ?? null,
            doctor: { user: { name: a.doctor.user.name } },
          }))}
          weekMoods={weekMoods.map((m) => ({
            date: m.date.toISOString(),
            mood: m.mood,
          }))}
          recentFollowups={recentFollowups.map((f) => ({
            sessionId: f.sessionId,
            doctorName: f.session.doctor.user.name,
            doctorPhoto: f.session.doctor.photo,
            sessionDate: f.session.date.toISOString(),
            postMood: f.postMood as 1 | 2 | 3 | 4 | 5 | null,
            homeworkNote: f.homeworkNote,
          }))}
          workshops={upcomingWorkshops}
        />
      </div>

      {/* Desktop: Reflection landing (unchanged from Phase 1). */}
      <div className="hidden lg:block">
        <CrisisBanner variant="callout" className="mb-5" />
        {reflectionData ? (
          <>
            <ReflectionLanding data={reflectionData} engagementState={engagementState} />
            <RailPortal>
              <HomeRail engagementState={engagementState} />
            </RailPortal>
          </>
        ) : (
          <div className="py-8">
            <h1 className="text-[22px] font-medium text-text">Welcome to Mindset</h1>
            <p className="text-[14px] text-text-muted mt-1">Your reflection space is loading...</p>
          </div>
        )}
      </div>
    </>
  )
}
