import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import JournalCompose from '@/components/dashboard/journal/journal-compose'

export default function NewJournalEntryPage() {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/user/practice/journal" className="p-1">
          <ArrowLeft size={20} className="text-text-muted" />
        </Link>
        <h1 className="text-[16px] font-medium text-text">New entry</h1>
      </div>

      <JournalCompose mode="create" />
    </div>
  )
}
