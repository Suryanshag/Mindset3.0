'use client'

import { useCallback, useEffect, useRef, useState, useTransition } from 'react'
import { useWriting } from './writing-context'
import { logMoodCheckIn } from '@/lib/actions/mood'
import MoodPicker from '@/components/dashboard/mood-picker'
import { BCap, BCard, BChip } from './b-atoms'
import BPageHeader from './b-page-header'
import type { MoodValue } from '@/lib/constants/mood'

// Phase 3e — Reflection writer (Direction B port).
// Combines the previous WritingSurface (textarea + mood picker) and
// WritingRail (autosave indicator + Publish entry) into one
// BJournalCompose-style card. WritingProvider context is unchanged so
// draft autosave, publish flow, and the privacy guarantees are all
// preserved 1:1.

type PendingPrompt = {
  id: string
  title: string
  instructions: string
  dueDate: Date | null
  doctor: { user: { name: string } }
} | null

type Props = {
  initialMood: MoodValue | null
  pendingPrompt: PendingPrompt
  isEmptyUser: boolean
}

function shortName(fullName: string): string {
  const parts = fullName.split(' ').filter(Boolean)
  if (parts.length > 1 && /^Dr\.?$/i.test(parts[0])) return parts[1]
  return parts[0] ?? fullName
}

export default function BReflectionWriter({
  initialMood,
  pendingPrompt,
  isEmptyUser,
}: Props) {
  const {
    title,
    setTitle,
    body,
    setBody,
    saveStatus,
    wordCount,
    publish,
    isPublishing,
    draftId,
    assignmentId,
    setAssignmentId,
  } = useWriting()

  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [mood, setMood] = useState<MoodValue | null>(initialMood)
  const [, startMoodTransition] = useTransition()

  const todayStr = new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
  const timeStr = new Date().toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })

  const autoGrow = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.max(el.scrollHeight, 320)}px`
  }, [])

  useEffect(() => {
    autoGrow()
  }, [body, autoGrow])

  function handleMood(next: MoodValue | null) {
    setMood(next)
    if (next === null) return
    startMoodTransition(async () => {
      await logMoodCheckIn(next)
    })
  }

  const promptActive = pendingPrompt && assignmentId === pendingPrompt.id
  const canPublish = !!body.trim() && saveStatus === 'saved' && !!draftId

  return (
    <>
      <BPageHeader
        title={`${todayStr}.`}
        breadcrumb={[{ label: 'REFLECTION' }, { label: 'TODAY' }]}
        sub={`${timeStr} IST · only you can read this — and your therapist only if you choose`}
        ctas={['search']}
      />

      {/* Optional prompt rail */}
      {promptActive && pendingPrompt && (
        <BCard
          padding={16}
          style={{
            background: 'var(--bg-paper)',
            border: '1px dashed var(--border-strong)',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <BChip kind="accent">PROMPT FROM {shortName(pendingPrompt.doctor.user.name).toUpperCase()}</BChip>
          <div
            style={{
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              fontSize: 15,
              color: 'var(--text)',
              flex: 1,
            }}
          >
            &ldquo;{pendingPrompt.title}&rdquo;
          </div>
          <button
            type="button"
            onClick={() => setAssignmentId(null)}
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 12,
              color: 'var(--text-muted)',
              padding: '6px 10px',
              background: 'transparent',
            }}
          >
            Dismiss
          </button>
        </BCard>
      )}

      {/* Composer card */}
      <BCard padding={32} style={{ display: 'flex', flexDirection: 'column', gap: 14, minHeight: 420 }}>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10.5,
            color: 'var(--text-faint)',
            letterSpacing: '0.06em',
          }}
        >
          {todayStr.toUpperCase()} · {timeStr} IST
        </div>

        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Untitled"
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 26,
            fontWeight: 500,
            border: 'none',
            outline: 'none',
            background: 'transparent',
            color: 'var(--text)',
            padding: 0,
          }}
        />

        <textarea
          ref={textareaRef}
          value={body}
          onChange={(e) => {
            setBody(e.target.value)
            autoGrow()
          }}
          placeholder="What&rsquo;s on your mind?"
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 17,
            lineHeight: 1.75,
            color: 'var(--text)',
            background: 'transparent',
            border: 'none',
            outline: 'none',
            resize: 'none',
            width: '100%',
            minHeight: 320,
            padding: 0,
          }}
        />

        {/* Bottom action bar */}
        <div
          style={{
            borderTop: '1px solid var(--border)',
            paddingTop: 12,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 16,
            flexWrap: 'wrap',
          }}
        >
          {/* Mood */}
          <div className="flex items-center gap-3">
            <BCap>Mood now</BCap>
            <MoodPicker value={mood} onChange={handleMood} />
          </div>

          {/* Word count + autosave + publish */}
          <div className="flex items-center gap-3 ml-auto">
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10.5,
                color: 'var(--text-faint)',
              }}
            >
              {wordCount} {wordCount === 1 ? 'WORD' : 'WORDS'}
              {saveStatus === 'saving' && ' · SAVING…'}
              {saveStatus === 'saved' && ' · AUTOSAVED'}
              {saveStatus === 'error' && ' · OFFLINE'}
            </span>
            <button
              type="button"
              onClick={publish}
              disabled={!canPublish || isPublishing}
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 12,
                padding: '8px 14px',
                borderRadius: 999,
                background: canPublish ? 'var(--primary)' : 'var(--border-strong)',
                color: '#fff',
                border: 'none',
                fontWeight: 500,
                opacity: canPublish && !isPublishing ? 1 : 0.6,
                cursor: canPublish && !isPublishing ? 'pointer' : 'not-allowed',
              }}
            >
              {isPublishing
                ? 'Publishing…'
                : promptActive
                  ? 'Submit response'
                  : 'Publish entry'}
            </button>
          </div>
        </div>
      </BCard>

      {/* Privacy reassurance */}
      <p
        style={{
          fontFamily: 'var(--font-serif)',
          fontStyle: 'italic',
          fontSize: 13,
          color: 'var(--text-faint)',
        }}
      >
        {isEmptyUser
          ? 'This is your private space. Nothing is shared with anyone unless you choose, and right now there&rsquo;s no one to share with — your therapist will appear here once you&rsquo;ve booked your first session.'
          : 'Nothing is sent anywhere by default. You decide, every time.'}
      </p>
    </>
  )
}
