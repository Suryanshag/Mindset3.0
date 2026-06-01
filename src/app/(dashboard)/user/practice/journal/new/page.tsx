import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getActiveDraft, getPendingJournalPrompt } from '@/lib/queries/journal'
import JournalCompose from '@/components/dashboard/journal/journal-compose'
import MobileJournalCompose from '@/components/mobile/journal-compose'
import { CrisisBanner } from '@/components/shared/crisis-banner'
import BPageHeader from '@/components/dashboard/desktop/b-page-header'
import { BCard, BChip } from '@/components/dashboard/desktop/b-atoms'

export default async function NewJournalEntryPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const [draft, pendingPrompt] = await Promise.all([
    getActiveDraft(session.user.id),
    getPendingJournalPrompt(session.user.id).catch(() => null),
  ])

  const now = new Date()
  const subLine = `${now.toLocaleDateString('en-IN', { weekday: 'long', day: 'numeric', month: 'long' })} · IST · private to you`

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

      {/* Desktop — Phase 3d Direction B port: BPageHeader chrome, optional
          prompt rail above the existing JournalCompose surface. */}
      <div className="hidden lg:block">
        <BPageHeader
          title="New entry."
          breadcrumb="PRACTICE  /  JOURNAL  /  NEW"
          sub={subLine}
          ctas={['search']}
        />

        {pendingPrompt && (
          <BCard
            padding={16}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              background: 'var(--bg-paper)',
              border: '1px dashed var(--border-strong)',
            }}
          >
            <BChip kind="accent">PROMPT</BChip>
            <p
              style={{
                fontFamily: 'var(--font-serif)',
                fontStyle: 'italic',
                fontSize: 15,
                color: 'var(--text)',
                flex: 1,
              }}
            >
              &ldquo;{pendingPrompt.title}&rdquo;
            </p>
          </BCard>
        )}

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
        <CrisisBanner variant="inline" dismissible />
      </div>
    </>
  )
}
