'use client'

import { useState, useTransition } from 'react'
import { logMoodCheckIn } from '@/lib/actions/mood'
import { MOODS } from '@/lib/constants/mood'
import MoodFace from '@/components/dashboard/mood-face'

type Props = {
  todaysCheckIn: { mood: 1 | 2 | 3 | 4 | 5 } | null
}

export default function MoodCheckIn({ todaysCheckIn }: Props) {
  const [selected, setSelected] = useState<number | null>(
    todaysCheckIn?.mood ?? null
  )
  const [collapsed, setCollapsed] = useState(todaysCheckIn !== null)
  const [isPending, startTransition] = useTransition()

  function handleSelect(value: number) {
    setSelected(value)
    setCollapsed(true)
    startTransition(async () => {
      await logMoodCheckIn(value)
    })
  }

  if (collapsed && selected !== null) {
    const mood = MOODS.find((m) => m.value === selected)
    return (
      <div
        className="bg-bg-card rounded-2xl px-4 py-3 flex items-center justify-between"
        style={{ border: '1px solid var(--color-border)' }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center"
            style={{ backgroundColor: mood?.tint, color: mood?.stroke }}
          >
            {mood && <MoodFace mood={mood.value} size={16} />}
          </div>
          <span className="text-[13px] text-text-muted">
            {isPending ? 'Saving...' : 'Logged today'} &middot; {mood?.label}
          </span>
        </div>
        <button
          onClick={() => setCollapsed(false)}
          className="text-[12px] text-primary font-medium bg-transparent border-0 p-0 cursor-pointer"
        >
          Change
        </button>
      </div>
    )
  }

  return (
    <div
      className="bg-bg-card rounded-2xl px-3.5 py-3.5"
      style={{ border: '1px solid var(--color-border)' }}
    >
      <p className="text-[13px] text-text-muted mb-3">
        How are you feeling today?
      </p>
      <div className="flex justify-between">
        {MOODS.map((mood) => {
          const isSelected = selected === mood.value
          return (
            <button
              key={mood.value}
              onClick={() => handleSelect(mood.value)}
              className="flex flex-col items-center gap-1.5"
            >
              <div
                className="w-11 h-11 rounded-full flex items-center justify-center transition-all"
                style={{
                  backgroundColor: mood.tint,
                  color: mood.stroke,
                  border: isSelected ? '2px solid var(--color-primary)' : '2px solid transparent',
                }}
              >
                <MoodFace mood={mood.value} size={22} />
              </div>
              <span className="text-[10px] text-text-faint">{mood.label}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
