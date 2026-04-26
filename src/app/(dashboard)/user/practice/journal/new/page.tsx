import JournalCompose from '@/components/dashboard/journal/journal-compose'
import PageHeader from '@/components/dashboard/page-header'

export default function NewJournalEntryPage() {
  return (
    <div>
      <PageHeader title="New entry" back="/user/practice/journal" />

      <div className="pt-3.5">
        <JournalCompose mode="create" />
      </div>
    </div>
  )
}
