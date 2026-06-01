import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { getJournalEntry } from '@/lib/queries/journal'
import JournalCompose from '@/components/dashboard/journal/journal-compose'
import PageHeader from '@/components/dashboard/page-header'
import BPageHeader from '@/components/dashboard/desktop/b-page-header'

export default async function EditJournalEntryPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const entry = await getJournalEntry(session.user.id, id)
  if (!entry) notFound()

  const dateLabel = entry.entryDate.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <>
      <div className="lg:hidden">
        <PageHeader title="Edit entry" back={`/user/practice/journal/${id}`} />

        <div className="pt-3.5">
          <JournalCompose
            mode="edit"
            entryId={id}
            initial={{
              title: entry.title ?? '',
              body: entry.body,
              mood: entry.mood,
              entryDate: entry.entryDate.toISOString().split('T')[0],
            }}
          />
        </div>
      </div>

      <div className="hidden lg:block">
        <BPageHeader
          title="Edit entry."
          breadcrumb="PRACTICE  /  JOURNAL  /  EDIT"
          sub={`${dateLabel} · IST · private to you`}
          ctas={['search']}
        />
        <div className="pt-2">
          <JournalCompose
            mode="edit"
            entryId={id}
            initial={{
              title: entry.title ?? '',
              body: entry.body,
              mood: entry.mood,
              entryDate: entry.entryDate.toISOString().split('T')[0],
            }}
          />
        </div>
      </div>
    </>
  )
}
