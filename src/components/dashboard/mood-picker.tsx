'use client'

import { MOODS, type MoodValue } from '@/lib/constants/mood'
import MoodFace from '@/components/dashboard/mood-face'

type Props = {
  value: MoodValue | null
  onChange: (next: MoodValue | null) => void
  label?: string
}

/**
 * Prominent 5-mood picker: 64px buttons with text labels.
 * Selecting an active face deselects it (toggle).
 */
export default function MoodPicker({ value, onChange, label = 'How are you feeling today?' }: Props) {
  return (
    <div className="mx-auto max-w-[500px]">
      <p className="text-[12px] text-text-muted text-center mb-3">{label}</p>
      <div className="flex items-start justify-between gap-1">
        {MOODS.map((m) => {
          const active = value === m.value
          return (
            <button
              key={m.value}
              type="button"
              onClick={() => onChange(active ? null : m.value)}
              className="flex flex-col items-center gap-1.5 transition-all"
              title={m.label}
              aria-pressed={active}
            >
              <span
                className="w-16 h-16 rounded-full flex items-center justify-center transition-all"
                style={{
                  backgroundColor: active ? m.tint : 'transparent',
                  color: m.stroke,
                  border: active
                    ? `2px solid ${m.stroke}`
                    : '1px solid var(--color-border-strong)',
                }}
              >
                <MoodFace mood={m.value} size={32} />
              </span>
              <span
                className={`text-[11px] ${
                  active ? 'font-medium text-text' : 'text-text-muted'
                }`}
              >
                {m.label}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
