'use client'

import { useState, useEffect, useRef, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { createJournalEntry, updateJournalEntry } from '@/lib/actions/journal'

const MOOD_EMOJI = ['😞', '😔', '😐', '🙂', '😊']
const DRAFT_KEY = 'journal-draft'

type Props = {
  mode: 'create' | 'edit'
  entryId?: string
  initial?: {
    title: string
    body: string
    mood: number | null
    entryDate: string // YYYY-MM-DD
  }
}

export default function JournalCompose({ mode, entryId, initial }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [title, setTitle] = useState(initial?.title ?? '')
  const [body, setBody] = useState(initial?.body ?? '')
  const [mood, setMood] = useState<number | null>(initial?.mood ?? null)
  const [entryDate, setEntryDate] = useState(
    initial?.entryDate ?? new Date().toISOString().split('T')[0]
  )
  const [error, setError] = useState('')
  const draftLoaded = useRef(false)

  // Load draft from localStorage on mount (create mode only)
  useEffect(() => {
    if (mode !== 'create' || draftLoaded.current) return
    draftLoaded.current = true
    try {
      const saved = localStorage.getItem(DRAFT_KEY)
      if (saved) {
        const draft = JSON.parse(saved)
        if (draft.body) setBody(draft.body)
        if (draft.title) setTitle(draft.title)
        if (draft.mood) setMood(draft.mood)
      }
    } catch {}
  }, [mode])

  // Auto-save draft every 5s (create mode only)
  useEffect(() => {
    if (mode !== 'create') return
    const timer = setInterval(() => {
      if (body.trim()) {
        localStorage.setItem(
          DRAFT_KEY,
          JSON.stringify({ title, body, mood })
        )
      }
    }, 5000)
    return () => clearInterval(timer)
  }, [mode, title, body, mood])

  function handleSubmit() {
    if (!body.trim()) {
      setError('Write something before saving.')
      return
    }
    setError('')

    const fd = new FormData()
    fd.append('title', title)
    fd.append('body', body)
    fd.append('entryDate', entryDate)
    if (mood) fd.append('mood', String(mood))

    startTransition(async () => {
      const result =
        mode === 'edit' && entryId
          ? await updateJournalEntry(entryId, fd)
          : await createJournalEntry(fd)

      if ('error' in result && result.error) {
        setError(result.error)
        return
      }

      // Clear draft on successful create
      if (mode === 'create') {
        localStorage.removeItem(DRAFT_KEY)
      }

      if ('id' in result && result.id) {
        router.push(`/user/practice/journal/${result.id}`)
      } else {
        router.push('/user/practice/journal')
      }
    })
  }

  return (
    <div className="space-y-4">
      {error && (
        <p className="text-[13px] text-red-600 bg-red-50 px-3 py-2 rounded-xl">
          {error}
        </p>
      )}

      {/* Date picker */}
      <input
        type="date"
        value={entryDate}
        onChange={(e) => setEntryDate(e.target.value)}
        className="w-full px-3 py-2 rounded-xl bg-bg-card text-[13px] text-text"
        style={{ border: '0.5px solid var(--color-border)' }}
      />

      {/* Title (optional) */}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title (optional)"
        maxLength={500}
        className="w-full px-3 py-2 rounded-xl bg-bg-card text-[15px] font-medium text-text placeholder:text-text-faint"
        style={{ border: '0.5px solid var(--color-border)' }}
      />

      {/* Body */}
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder="Write your thoughts..."
        rows={12}
        className="w-full px-4 py-3 rounded-2xl bg-bg-card text-[16px] text-text placeholder:text-text-faint resize-none font-serif"
        style={{
          border: '0.5px solid var(--color-border)',
          lineHeight: '1.8',
        }}
      />

      {/* Mood selector */}
      <div className="flex items-center gap-2">
        <span className="text-[12px] text-text-faint mr-1">Mood:</span>
        {MOOD_EMOJI.map((emoji, i) => {
          const value = i + 1
          const active = mood === value
          return (
            <button
              key={value}
              type="button"
              onClick={() => setMood(active ? null : value)}
              className={`w-9 h-9 rounded-full flex items-center justify-center text-[18px] transition-all ${
                active
                  ? 'bg-primary-tint ring-2 ring-primary scale-110'
                  : 'bg-bg-card'
              }`}
              style={
                !active
                  ? { border: '0.5px solid var(--color-border)' }
                  : undefined
              }
            >
              {emoji}
            </button>
          )
        })}
      </div>

      {/* Submit */}
      <button
        onClick={handleSubmit}
        disabled={isPending || !body.trim()}
        className="w-full py-3 rounded-2xl bg-primary text-white text-[14px] font-medium disabled:opacity-50"
      >
        {isPending
          ? 'Saving...'
          : mode === 'edit'
            ? 'Update entry'
            : 'Save entry'}
      </button>
    </div>
  )
}
