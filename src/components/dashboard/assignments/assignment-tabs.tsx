'use client'

import { useRouter } from 'next/navigation'

export default function AssignmentTabs({
  currentTab,
}: {
  currentTab: 'pending' | 'completed'
}) {
  const router = useRouter()

  return (
    <div className="flex gap-2">
      {(['pending', 'completed'] as const).map((tab) => {
        const active = currentTab === tab
        return (
          <button
            key={tab}
            onClick={() =>
              router.push(
                `/user/practice/assignments${tab === 'completed' ? '?tab=completed' : ''}`
              )
            }
            className={`px-3.5 py-1.5 rounded-full text-[12px] font-medium transition-colors ${
              active
                ? 'bg-primary text-white'
                : 'bg-bg-card text-text-muted'
            }`}
            style={
              !active
                ? { border: '0.5px solid var(--color-border)' }
                : undefined
            }
          >
            {tab === 'pending' ? 'Pending' : 'Completed'}
          </button>
        )
      })}
    </div>
  )
}
