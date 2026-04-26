'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState } from 'react'
import { Search, SlidersHorizontal } from 'lucide-react'

const MOOD_DOTS = [
  { face: '·_·', tint: '#FCE7E3' },
  { face: '.-.', tint: '#FBE9DD' },
  { face: '‿‿', tint: '#DDE9DC' },
  { face: '^‿^', tint: '#DDE9DC' },
  { face: '^◡^', tint: '#E8E4F2' },
]

export default function JournalFilters({
  currentSearch,
  currentMood,
}: {
  currentSearch?: string
  currentMood?: number
}) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [search, setSearch] = useState(currentSearch ?? '')
  const [showFilters, setShowFilters] = useState(false)

  function updateParams(updates: Record<string, string | undefined>) {
    const params = new URLSearchParams(searchParams.toString())
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value)
      else params.delete(key)
    }
    router.push(`/user/practice/journal?${params.toString()}`)
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault()
    updateParams({ q: search.trim() || undefined })
  }

  function handleMoodFilter(mood: number) {
    updateParams({ mood: currentMood === mood ? undefined : String(mood) })
  }

  return (
    <div className="space-y-2.5">
      <div className="flex gap-2">
        <form onSubmit={handleSearch} className="flex-1 relative">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-text-faint"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search entries..."
            className="w-full pl-8 pr-3 py-2 rounded-xl bg-bg-card text-[13px] text-text placeholder:text-text-faint"
            style={{ border: '0.5px solid var(--color-border)' }}
          />
        </form>
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
            showFilters || currentMood ? 'bg-primary text-white' : 'bg-bg-card text-text-faint'
          }`}
          style={
            !showFilters && !currentMood
              ? { border: '0.5px solid var(--color-border)' }
              : undefined
          }
        >
          <SlidersHorizontal size={16} />
        </button>
      </div>

      {showFilters && (
        <div className="flex items-center gap-2">
          <span className="text-[11px] text-text-faint mr-1">Mood:</span>
          {MOOD_DOTS.map((dot, i) => {
            const mood = i + 1
            const active = currentMood === mood
            return (
              <button
                key={mood}
                onClick={() => handleMoodFilter(mood)}
                className="w-8 h-8 rounded-full flex items-center justify-center transition-all"
                style={{
                  backgroundColor: dot.tint,
                  border: active ? '2px solid var(--color-primary)' : '2px solid transparent',
                }}
              >
                <span className="text-[10px] text-text-muted leading-none">{dot.face}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
