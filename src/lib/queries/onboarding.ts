import { prisma } from '@/lib/prisma'

/**
 * Should the user see the /onboarding tutorial on this visit to /user?
 *
 * Per Resolved Decision 9 (MOBILE_PORT_PLAN.md §3g): tutorial shows only
 * when the `mindset_onboarded` cookie is missing AND the user has zero
 * completed sessions AND zero journal entries AND zero mood check-ins.
 *
 * Cookie gating is handled by the caller (the /user server component reads
 * `cookies()`). This function answers the activity half of the question.
 *
 * Returning users on a fresh device — cookie gone, but DB shows activity —
 * will not see the tutorial. New signups with no activity yet will.
 */
export async function userHasOnboardingActivity(userId: string): Promise<boolean> {
  // Parallel counts; each is a cheap indexed lookup. We bail on the first
  // hit using Promise.race-style — but Prisma doesn't expose that cleanly;
  // running all three in parallel is fast enough on Neon.
  const [sessionsCompleted, journalCount, moodCount] = await Promise.all([
    prisma.session.count({
      where: { userId, status: 'COMPLETED' },
    }),
    prisma.journalEntry.count({
      where: { userId, isDraft: false },
    }),
    prisma.moodCheckIn.count({
      where: { userId },
    }),
  ])

  return sessionsCompleted > 0 || journalCount > 0 || moodCount > 0
}
