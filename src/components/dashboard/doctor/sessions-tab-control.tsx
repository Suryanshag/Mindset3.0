'use client'

import { useRouter, useSearchParams } from 'next/navigation'

const tabs = [
  { key: 'today', label: 'Today' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'past', label: 'Past' },
] as const

export type DoctorSessionsTab = (typeof tabs)[number]['key']

export default function DoctorSessionsTabControl() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const active = searchParams.get('tab') ?? 'upcoming'

  function setTab(key: string) {
    router.replace(`/doctor/sessions?tab=${key}`, { scroll: false })
  }

  return (
    <div className="flex gap-1 p-1 bg-gray-100 rounded-xl mb-4">
      {tabs.map((t) => (
        <button
          key={t.key}
          onClick={() => setTab(t.key)}
          className={`flex-1 py-2 rounded-lg text-[13px] font-medium transition-colors duration-150 ${
            active === t.key
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 lg:hover:text-gray-700'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  )
}
