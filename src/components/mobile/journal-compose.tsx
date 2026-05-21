'use client'

// Phase 4 — Mobile Journal composer. Ported from app/journal.jsx
// JournalNew. Sticky top header (back + date + Save), scrollable body
// (optional prompt + title + textarea), sticky bottom mood toolbar
// with 5-face scale + mic placeholder.
//
// The mood picker sits in the bottom toolbar so it's thumb-reachable
// AND doesn't get pushed out of view when the on-screen keyboard
// opens. This is the deliberate mobile divergence from desktop's
// Sprint UI-2b above-the-title placement.

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { MoodFace, MOOD_INFO, Card } from './ui'
import { IconCloseSmall, IconMic } from './icons'
import { createJournalEntry } from '@/lib/actions/journal'

type MoodValue = 1 | 2 | 3 | 4 | 5

type MobileJournalComposeProps = {
  initialTitle?: string
  initialBody?: string
  initialMood?: MoodValue | null
  /** Optional prompt copy — shown as a tinted card above the title
   *  input. Source: pending JOURNAL_PROMPT assignment for the user. */
  prompt?: string | null
}

export default function MobileJournalCompose({
  initialTitle = '',
  initialBody = '',
  initialMood = null,
  prompt = null,
}: MobileJournalComposeProps) {
  const router = useRouter()
  const [title, setTitle] = useState(initialTitle)
  const [body, setBody] = useState(initialBody)
  const [mood, setMood] = useState<MoodValue | null>(initialMood)
  const [saving, startSaving] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const dateLabel = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
  const timeLabel = new Date().toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })

  const handleSave = () => {
    setError(null)
    const trimmed = body.trim()
    if (!trimmed) {
      setError('Write something before saving.')
      return
    }
    startSaving(async () => {
      const fd = new FormData()
      if (title.trim()) fd.set('title', title.trim())
      fd.set('body', trimmed)
      if (mood) fd.set('mood', String(mood))
      const res = await createJournalEntry(fd)
      if ('error' in res && res.error) {
        setError(res.error)
        return
      }
      router.push('/user/practice/journal')
    })
  }

  const handleMicTap = () => {
    // Voice-to-text is deferred to post-launch per Phase 4 brief.
    // Render a non-interruptive note so the user sees it once and
    // the mic icon stays available as a future affordance.
    setError(
      'Voice-to-text is coming soon. Type your entry for now.'
    )
    setTimeout(() => setError(null), 2500)
  }

  return (
    <div
      data-mobile-fullbleed
      data-no-mobile-header
      style={{
        background: 'var(--bg-app)',
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <header
        style={{
          padding: '14px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'var(--bg-app)',
        }}
      >
        <button
          type="button"
          onClick={() => router.back()}
          aria-label="Discard and go back"
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: 'var(--bg-card)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <IconCloseSmall size={18} sw={1.8} />
        </button>
        <div
          style={{
            flex: 1,
            fontSize: 12,
            color: 'var(--text-muted)',
            textAlign: 'center',
          }}
        >
          {dateLabel} · {timeLabel}
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          style={{
            background: 'var(--primary)',
            color: 'var(--on-dark)',
            padding: '10px 18px',
            borderRadius: 999,
            fontSize: 13,
            fontWeight: 700,
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? 'Saving…' : 'Save'}
        </button>
      </header>

      <div
        className="screen-scroll"
        style={{
          flex: 1,
          padding: '8px 24px 0',
          overflowY: 'auto',
        }}
      >
        {prompt && (
          <Card
            padding={14}
            bg="var(--accent-tint)"
            radius={18}
            style={{ marginBottom: 18 }}
          >
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.14em',
                textTransform: 'uppercase',
                color: 'var(--accent-deep)',
              }}
            >
              Prompt
            </div>
            <div
              className="ms-serif"
              style={{
                fontSize: 16,
                marginTop: 4,
                color: 'var(--text)',
              }}
            >
              {prompt}
            </div>
          </Card>
        )}

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title (optional)"
          style={{
            width: '100%',
            border: 'none',
            background: 'transparent',
            outline: 'none',
            fontFamily: 'var(--font-display)',
            fontWeight: 700,
            fontSize: 28,
            color: 'var(--text)',
            padding: 0,
            marginBottom: 12,
          }}
        />

        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          placeholder="Start writing…"
          style={{
            width: '100%',
            minHeight: 220,
            border: 'none',
            background: 'transparent',
            outline: 'none',
            fontFamily: 'var(--font-serif)',
            fontSize: 17,
            lineHeight: 1.55,
            color: 'var(--text)',
            resize: 'none',
          }}
        />

        {error && (
          <div
            role="alert"
            style={{
              padding: '10px 14px',
              borderRadius: 12,
              background: 'rgba(154,52,18,0.10)',
              color: 'var(--accent-deep)',
              fontSize: 13,
              fontWeight: 600,
              marginTop: 12,
            }}
          >
            {error}
          </div>
        )}
      </div>

      {/* Sticky bottom toolbar — mood scale + mic placeholder. */}
      <div
        style={{
          margin: '0 16px 12px',
          marginBottom: 'calc(env(safe-area-inset-bottom) + 12px)',
          background: 'var(--bg-card)',
          borderRadius: 28,
          padding: '10px 14px',
          boxShadow: 'var(--shadow-pop)',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', gap: 4, flex: 1 }}>
          {([1, 2, 3, 4, 5] as MoodValue[]).map((i) => {
            const active = mood === i
            const info = MOOD_INFO[i]
            return (
              <button
                key={i}
                type="button"
                onClick={() => setMood(active ? null : i)}
                aria-label={info?.label ?? `Mood ${i}`}
                aria-pressed={active}
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '50%',
                  background: active
                    ? info?.tint
                    : 'transparent',
                  color: active ? info?.color : 'var(--text-muted)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <MoodFace mood={i} size={22} />
              </button>
            )
          })}
        </div>
        <button
          type="button"
          onClick={handleMicTap}
          aria-label="Voice-to-text (coming soon)"
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'var(--bg-app)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--text-muted)',
          }}
        >
          <IconMic size={18} sw={1.7} />
        </button>
      </div>
    </div>
  )
}
