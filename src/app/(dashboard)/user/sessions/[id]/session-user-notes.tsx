'use client'

import { useRef, useState } from 'react'

type Props = {
  sessionId: string
  initialValue: string
}

type SaveState = 'idle' | 'saving' | 'saved' | 'error'

const MAX_LEN = 2000

export default function SessionUserNotes({ sessionId, initialValue }: Props) {
  const [value, setValue] = useState(initialValue)
  const [saveState, setSaveState] = useState<SaveState>('idle')
  const lastSavedRef = useRef(initialValue)
  const savedToastTimeout = useRef<NodeJS.Timeout | null>(null)

  async function save() {
    if (value === lastSavedRef.current) return
    if (savedToastTimeout.current) clearTimeout(savedToastTimeout.current)
    setSaveState('saving')
    try {
      const res = await fetch(`/api/user/sessions/${sessionId}/notes`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userNotes: value }),
      })
      const data = await res.json().catch(() => null)
      if (res.ok && data?.success) {
        lastSavedRef.current = value
        setSaveState('saved')
        savedToastTimeout.current = setTimeout(() => setSaveState('idle'), 2000)
      } else {
        setSaveState('error')
      }
    } catch {
      setSaveState('error')
    }
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-[11px] font-medium text-text-faint uppercase tracking-[0.6px]">
          Notes
        </p>
        {saveState === 'saved' && (
          <span className="text-[11px] font-medium text-primary px-2 py-0.5 rounded-full bg-primary-tint">
            Saved
          </span>
        )}
        {saveState === 'saving' && (
          <span className="text-[11px] text-text-faint">Saving…</span>
        )}
        {saveState === 'error' && (
          <span className="text-[11px] text-red-600">Save failed — try again</span>
        )}
      </div>
      <textarea
        value={value}
        onChange={(e) => setValue(e.target.value.slice(0, MAX_LEN))}
        onBlur={save}
        maxLength={MAX_LEN}
        rows={4}
        placeholder="Jot down anything you want to bring up in this session..."
        className="w-full rounded-2xl bg-bg-card p-4 text-[14px] text-text resize-y min-h-[112px] focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
        style={{ border: '0.5px solid var(--color-border)' }}
      />
      <p className="text-[11px] text-text-faint mt-1.5">
        {value.length}/{MAX_LEN}
      </p>
    </div>
  )
}
