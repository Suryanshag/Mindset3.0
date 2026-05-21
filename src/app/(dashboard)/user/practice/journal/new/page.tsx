import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getActiveDraft, getPendingJournalPrompt } from '@/lib/queries/journal'
import JournalCompose from '@/components/dashboard/journal/journal-compose'
import PageHeader from '@/components/dashboard/page-header'
import MobileJournalCompose from '@/components/mobile/journal-compose'

export default async function NewJournalEntryPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const [draft, pendingPrompt] = await Promise.all([
    getActiveDraft(session.user.id),
    getPendingJournalPrompt(session.user.id).catch(() => null),
  ])

  return (
    <>
      {/* Mobile — Phase 4 ported composer with sticky bottom mood toolbar. */}
      <div className="lg:hidden">
        <MobileJournalCompose
          initialTitle={draft?.title ?? ''}
          initialBody={draft?.body ?? ''}
          initialMood={(draft?.mood as 1 | 2 | 3 | 4 | 5 | null) ?? null}
          prompt={pendingPrompt?.title ?? null}
        />
      </div>

      {/* Desktop — existing layout (Phase 1, unchanged). */}
      <div className="hidden lg:block">
        <PageHeader title="New entry" back="/user/practice/journal" />

        <div className="pt-3.5">
          <JournalCompose
            mode="create"
            serverDraft={
              draft
                ? {
                    id: draft.id,
                    title: draft.title ?? '',
                    body: draft.body,
                    mood: draft.mood,
                  }
                : null
            }
          />
        </div>
      </div>
    </>
  )
}
