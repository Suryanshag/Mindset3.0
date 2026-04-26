'use client'

import { useRouter, useSearchParams } from 'next/navigation'

const tabs = [
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'past', label: 'Past' },
  { key: 'assignments', label: 'Assignments' },
] as const

export default function TabControl() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const active = searchParams.get('tab') ?? 'upcoming'

  function setTab(key: string) {
    router.replace(`/user/sessions?tab=${key}`, { scroll: false })
  }

  return (
    <div className="flex gap-1 p-1 bg-bg-app rounded-xl mb-4">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => setTab(t.key)}
          className={`flex-1 py-2 rounded-lg text-[13px] font-medium transition-colors ${
            active === t.key
              ? 'bg-bg-card text-text shadow-sm'
              : 'text-text-faint'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}
