'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Trash2 } from 'lucide-react'
import { deleteJournalEntry } from '@/lib/actions/journal'

export default function JournalDeleteButton({ entryId }: { entryId: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleDelete() {
    if (!confirm('Delete this entry? This cannot be undone.')) return

    startTransition(async () => {
      const result = await deleteJournalEntry(entryId)
      if (result.success) {
        router.push('/user/practice/journal')
      }
    })
  }

  return (
    <button
      onClick={handleDelete}
      disabled={isPending}
      className="w-8 h-8 rounded-full bg-bg-card flex items-center justify-center"
      style={{ border: '1px solid var(--color-border)' }}
    >
      <Trash2
        size={14}
        className={isPending ? 'text-text-faint animate-pulse' : 'text-red-500'}
      />
    </button>
  )
}
