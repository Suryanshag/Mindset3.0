'use client'

import { useState } from 'react'

const moods = [
  { value: 1, face: '·_·', label: 'Low', tint: '#FCE7E3' },
  { value: 2, face: '.-.', label: 'Meh', tint: '#FBE9DD' },
  { value: 3, face: '‿‿', label: 'Good', tint: '#DDE9DC' },
  { value: 4, face: '^‿^', label: 'Great', tint: '#DDE9DC' },
  { value: 5, face: '^◡^', label: 'Amazing', tint: '#E8E4F2' },
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
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: mood?.tint }}
          >
            <span className="text-[11px] text-text-muted leading-none">{mood?.face}</span>
          </div>
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
      className="bg-bg-card rounded-2xl px-3.5 py-3.5"
      style={{ border: '0.5px solid var(--color-border)' }}
    >
      <p className="text-[13px] text-text-muted mb-3">
        How are you feeling today?
      </p>
      <div className="flex justify-between">
        {moods.map((mood) => {
          const isSelected = selected === mood.value
          return (
            <button
              key={mood.value}
              onClick={() => {
                setSelected(mood.value)
                setCollapsed(true)
              }}
              className="flex flex-col items-center gap-1.5"
            >
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center transition-all"
                style={{
                  backgroundColor: mood.tint,
                  border: isSelected ? '2px solid var(--color-primary)' : '2px solid transparent',
                }}
              >
                <span className="text-[12px] text-text-muted leading-none">{mood.face}</span>
              </div>
              <span className="text-[10px] text-text-faint">{mood.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
