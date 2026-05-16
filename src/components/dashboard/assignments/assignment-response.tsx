'use client'

import { useState, useTransition, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { completeAssignment } from '@/lib/actions/assignments'

type Props = {
  assignmentId: string
  type: string
}

export default function AssignmentResponseSurface({ assignmentId, type }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [text, setText] = useState('')
  const [error, setError] = useState('')

  // Breathing exercise state
  const [breathingActive, setBreathingActive] = useState(false)
  const [elapsed, setElapsed] = useState(0)
  const duration = 300 // 5 minutes default
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    if (!breathingActive) return
    timerRef.current = setInterval(() => {
      setElapsed((prev) => {
        if (prev + 1 >= duration) {
          clearInterval(timerRef.current!)
          setBreathingActive(false)
          return duration
        }
        return prev + 1
      })
    }, 1000)
    return () => {
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }, [breathingActive])

  function handleSubmit() {
    if ((type === 'JOURNAL_PROMPT' || type === 'WORKSHEET' || type === 'CUSTOM') && !text.trim()) {
      setError('Please write a response.')
      return
    }
    setError('')

    const fd = new FormData()
    if (text.trim()) fd.append('responseText', text)

    if (type === 'BREATHING') {
      fd.append('metadata', JSON.stringify({ durationSeconds: elapsed }))
    }

    startTransition(async () => {
      const result = await completeAssignment(assignmentId, fd)
      if (result.error) {
        setError(result.error)
        return
      }
      router.push('/user/practice/assignments')
    })
  }

  if (type === 'BREATHING') {
    const progress = Math.min((elapsed / duration) * 100, 100)
    const mins = Math.floor(elapsed / 60)
    const secs = elapsed % 60

    return (
      <div className="space-y-4">
        {error && (
          <p className="text-[13px] text-red-600 bg-red-50 px-3 py-2 rounded-xl">{error}</p>
        )}

        <div className="flex flex-col items-center py-8">
          {/* Circular progress */}
          <div className="relative w-40 h-40 mb-6">
            <svg viewBox="0 0 100 100" className="w-full h-full -rotate-90">
              <circle
                cx="50" cy="50" r="45"
                fill="none"
                stroke="var(--color-border)"
                strokeWidth="6"
              />
              <circle
                cx="50" cy="50" r="45"
                fill="none"
                stroke="var(--color-primary)"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${progress * 2.827} ${282.7 - progress * 2.827}`}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[24px] font-medium text-text tabular-nums">
                {mins}:{secs.toString().padStart(2, '0')}
              </span>
            </div>
          </div>

          {!breathingActive && elapsed === 0 && (
            <button
              onClick={() => setBreathingActive(true)}
              className="px-6 py-3 rounded-2xl bg-primary text-white text-[14px] font-medium"
            >
              Start breathing
            </button>
          )}

          {breathingActive && (
            <p className="text-[14px] text-text-muted">Breathe slowly and deeply...</p>
          )}

          {!breathingActive && elapsed > 0 && (
            <button
              onClick={handleSubmit}
              disabled={isPending}
              className="px-6 py-3 rounded-2xl bg-primary text-white text-[14px] font-medium disabled:opacity-50"
            >
              {isPending ? 'Saving...' : 'Complete'}
            </button>
          )}
        </div>
      </div>
    )
  }

  if (type === 'READING') {
    return (
      <div className="space-y-4">
        {error && (
          <p className="text-[13px] text-red-600 bg-red-50 px-3 py-2 rounded-xl">{error}</p>
        )}
        <button
          onClick={handleSubmit}
          disabled={isPending}
          className="w-full py-3 rounded-2xl bg-primary text-white text-[14px] font-medium disabled:opacity-50"
        >
          {isPending ? 'Marking...' : 'Mark as read'}
        </button>
      </div>
    )
  }

  // JOURNAL_PROMPT, WORKSHEET, CUSTOM — all show a textarea
  const placeholder =
    type === 'JOURNAL_PROMPT'
      ? 'Write your journal response...'
      : type === 'WORKSHEET'
        ? 'Write your answers...'
        : 'Write your response...'

  return (
    <div className="space-y-4">
      {error && (
        <p className="text-[13px] text-red-600 bg-red-50 px-3 py-2 rounded-xl">{error}</p>
      )}

      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        rows={8}
        className="w-full px-4 py-3 rounded-2xl bg-bg-card text-[14px] text-text placeholder:text-text-faint resize-none"
        style={{
          border: '1px solid var(--color-border)',
          lineHeight: '1.7',
        }}
      />

      <button
        onClick={handleSubmit}
        disabled={isPending || !text.trim()}
        className="w-full py-3 rounded-2xl bg-primary text-white text-[14px] font-medium disabled:opacity-50"
      >
        {isPending ? 'Submitting...' : 'Submit'}
      </button>
    </div>
  )
}
