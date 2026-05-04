import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getActiveDraft } from '@/lib/queries/journal'
import JournalCompose from '@/components/dashboard/journal/journal-compose'
import PageHeader from '@/components/dashboard/page-header'

export default async function NewJournalEntryPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const draft = await getActiveDraft(session.user.id)

  return (
    <div>
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
  )
}
