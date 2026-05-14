import { auth } from '@/lib/auth'
import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { getActiveDraft, getPendingJournalPrompt } from '@/lib/queries/journal'
import { getTodaysMoodCheckIn } from '@/lib/queries/dashboard'
import { prisma } from '@/lib/prisma'
import { WritingProvider } from '@/components/dashboard/desktop/writing-context'
import WritingSurface from '@/components/dashboard/desktop/writing-surface'
import WritingRail from '@/components/dashboard/desktop/writing-rail'
import RailPortal from '@/components/dashboard/desktop/rail-portal'
import MobileRedirect from './mobile-redirect'

export default async function TodayWritingPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  // Server-side mobile redirect (belt)
  const headersList = await headers()
  const ua = headersList.get('user-agent') ?? ''
  if (/Mobile|Android|iPhone|iPad/i.test(ua)) {
    redirect('/user/practice/journal/new')
  }

  const [draft, pendingPrompt, todaysMood, sessionCount] = await Promise.all([
    getActiveDraft(session.user.id),
    getPendingJournalPrompt(session.user.id),
    getTodaysMoodCheckIn(session.user.id),
    prisma.session.count({ where: { userId: session.user.id } }),
  ])

  const isEmptyUser = !pendingPrompt && sessionCount === 0

  const initialDraft = draft
    ? {
        id: draft.id,
        title: draft.title,
        body: draft.body,
        assignmentId: draft.assignmentId,
      }
    : null

  const initialAssignmentId =
    initialDraft?.assignmentId ?? pendingPrompt?.id ?? null

  return (
    <>
      {/* Client-side mobile redirect (suspenders) */}
      <MobileRedirect />

      <WritingProvider
        initialDraft={initialDraft}
        initialAssignmentId={initialAssignmentId}
      >
        <div className="hidden lg:block">
          <WritingSurface />
        </div>
        {!isEmptyUser && (
          <RailPortal>
            <WritingRail
              todaysMood={todaysMood}
              pendingPrompt={pendingPrompt}
            />
          </RailPortal>
        )}
      </WritingProvider>
    </>
  )
}
