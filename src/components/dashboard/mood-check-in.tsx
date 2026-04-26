'use client'

import { useState } from 'react'

const moods = [
  { value: 1, emoji: '😔', label: 'Low' },
  { value: 2, emoji: '😕', label: 'Meh' },
  { value: 3, emoji: '🙂', label: 'Good' },
  { value: 4, emoji: '😊', label: 'Great' },
  { value: 5, emoji: '🤩', label: 'Amazing' },
] as const

type Props = {
  todaysCheckIn: { mood: 1 | 2 | 3 | 4 | 5 } | null
}

export default function MoodCheckIn({ todaysCheckIn }: Props) {
  const [selected, setSelected] = useState<number | null>(
    todaysCheckIn?.mood ?? null
  )
  const [collapsed, setCollapsed] = useState(todaysCheckIn !== null)

  if (collapsed && selected !== null) {
    const mood = moods.find((m) => m.value === selected)
    return (
      <div
        className="bg-bg-card rounded-2xl px-4 py-3 flex items-center justify-between"
        style={{ border: '0.5px solid var(--color-border)' }}
      >
        <div className="flex items-center gap-2">
          <span className="text-base">{mood?.emoji}</span>
          <span className="text-[13px] text-text-muted">
            Logged today &middot; {mood?.label}
          </span>
        </div>
        <button
          onClick={() => setCollapsed(false)}
          className="text-[12px] text-primary font-medium"
        >
          Change
        </button>
      </div>
    )
  }

  return (
    <div
      className="bg-bg-card rounded-2xl p-3.5"
      style={{ border: '0.5px solid var(--color-border)' }}
    >
      <p className="text-[13px] text-text-muted mb-3">
        How are you feeling today?
      </p>
      <div className="flex justify-between">
        {moods.map((mood) => (
          <button
            key={mood.value}
            onClick={() => {
              setSelected(mood.value)
              setCollapsed(true)
            }}
            className="flex flex-col items-center gap-1 w-14"
          >
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all ${
                selected === mood.value
                  ? 'ring-2 ring-primary bg-primary-tint'
                  : 'bg-bg-app'
              }`}
            >
              {mood.emoji}
            </div>
            <span className="text-[10px] text-text-faint">{mood.label}</span>
          </button>
        ))}
      </div>
    </div>
  )
}
