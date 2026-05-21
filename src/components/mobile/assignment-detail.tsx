'use client'

// Phase 4 — Mobile Assignment detail. Ported from app/assignments.jsx
// AssignmentDetail. Type-specific completion zone:
//
//   JOURNAL_PROMPT → textarea, copy "Completing this will also save it
//                    to your Journal" (existing completeAssignment
//                    server action already auto-creates the entry)
//   WORKSHEET      → Trigger + Automatic-thought form fields + 1-5
//                    belief-intensity scale, all stored in metadata
//   READING        → tinted "Open the reading" link card (informational;
//                    completion uses "Mark as read" without text input)
//   BREATHING      → inline 3-min box-breathing timer; completion
//                    enabled after timer hits target
//   CUSTOM         → textarea + optional mood scale

import { useEffect, useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Avatar, Card, MoodFace, MOOD_INFO } from './ui'
import {
  IconArrowLeft,
  IconArrowRight,
  IconBook,
  IconCheck,
  IconPen,
} from './icons'
import {
  completeAssignment,
  skipAssignment,
} from '@/lib/actions/assignments'
import { ASSIGNMENT_TYPE_CFG } from './assignments-list'

export type AssignmentDetailItem = {
  id: string
  type: 'JOURNAL_PROMPT' | 'READING' | 'WORKSHEET' | 'BREATHING' | 'CUSTOM'
  title: string
  description: string | null
  instructions: string
  status: 'PENDING' | 'SUBMITTED' | 'COMPLETED' | 'SKIPPED' | 'REVIEWED'
  dueDate: string | null
  therapistName: string
  /** Most recent SUBMITTED/COMPLETED response, if any. */
  responseText: string | null
  responseCompletedAt: string | null
}

type MobileAssignmentDetailProps = {
  a: AssignmentDetailItem
}

export default function MobileAssignmentDetail({
  a,
}: MobileAssignmentDetailProps) {
  const router = useRouter()
  const cfg = ASSIGNMENT_TYPE_CFG[a.type]
  const done = a.status !== 'PENDING'

  const [text, setText] = useState(a.responseText ?? '')
  const [mood, setMood] = useState<1 | 2 | 3 | 4 | 5 | null>(null)
  const [scale, setScale] = useState<number>(3)
  const [field1, setField1] = useState('') // WORKSHEET: Trigger
  const [field2, setField2] = useState('') // WORKSHEET: Automatic thought
  const [breathingElapsed, setBreathingElapsed] = useState(0)
  const [breathingRunning, setBreathingRunning] = useState(false)
  const [saving, startSaving] = useTransition()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!breathingRunning) return
    const id = setInterval(
      () => setBreathingElapsed((e) => e + 1),
      1000
    )
    return () => clearInterval(id)
  }, [breathingRunning])

  const dueLabel = done
    ? a.responseCompletedAt
      ? `Completed on ${new Date(a.responseCompletedAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
      : 'Completed'
    : a.dueDate
    ? `Due ${new Date(a.dueDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}`
    : 'No due date'

  const canSubmit =
    a.type === 'BREATHING'
      ? breathingElapsed >= 180
      : a.type === 'READING'
      ? true
      : text.trim().length > 0

  const handleSave = () => {
    setError(null)
    if (!canSubmit) {
      setError(
        a.type === 'BREATHING'
          ? 'Complete the breathing exercise before saving.'
          : 'Write a response before saving.'
      )
      return
    }
    startSaving(async () => {
      const fd = new FormData()
      if (text.trim()) fd.set('responseText', text.trim())
      const metadata: Record<string, unknown> = {}
      if (a.type === 'CUSTOM' && mood) metadata.mood = mood
      if (a.type === 'WORKSHEET') {
        metadata.trigger = field1
        metadata.automaticThought = field2
        metadata.beliefIntensity = scale
      }
      if (a.type === 'BREATHING') metadata.completedSec = breathingElapsed
      if (Object.keys(metadata).length > 0) {
        fd.set('metadata', JSON.stringify(metadata))
      }
      const res = await completeAssignment(a.id, fd)
      if ('error' in res && res.error) {
        setError(res.error)
        return
      }
      router.push('/user/practice/assignments?tab=completed')
    })
  }

  const handleSkip = () => {
    startSaving(async () => {
      await skipAssignment(a.id)
      router.push('/user/practice/assignments')
    })
  }

  return (
    <div
      data-mobile-fullbleed
      data-no-mobile-header
      className="screen-scroll"
      style={{
        background: 'var(--bg-app)',
        minHeight: '100%',
        overflowY: 'auto',
        paddingBottom: done ? 40 : 130,
      }}
    >
      <header
        style={{
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <Link
          href="/user/practice/assignments"
          aria-label="Back to Assignments"
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
          <IconArrowLeft size={18} sw={1.8} />
        </Link>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            flex: 1,
          }}
        >
          <Avatar name={a.therapistName} size={28} color="var(--accent)" />
          <span
            style={{
              fontSize: 12,
              fontWeight: 700,
              color: 'var(--text-muted)',
            }}
          >
            {a.therapistName}
          </span>
        </div>
      </header>

      <section style={{ padding: '8px 24px 0' }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 11px',
            borderRadius: 999,
            background: cfg.bg,
            color: cfg.fg,
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: cfg.dot,
            }}
          />{' '}
          {cfg.label}
        </span>
        <div
          className="ms-display"
          style={{
            fontSize: 32,
            color: 'var(--text)',
            marginTop: 12,
            lineHeight: 1.05,
          }}
        >
          {a.title}
        </div>
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            color: done ? '#2A7A4A' : 'var(--text-muted)',
            marginTop: 8,
          }}
        >
          {dueLabel}
        </div>

        {(a.description || a.instructions) && (
          <p
            className="ms-serif"
            style={{
              fontSize: 17,
              color: 'var(--text)',
              lineHeight: 1.55,
              marginTop: 22,
            }}
          >
            {a.description || a.instructions}
          </p>
        )}
      </section>

      {done ? (
        <section style={{ padding: '22px 20px 0' }}>
          <Card padding={18} radius={22}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '0.12em',
                color: 'var(--primary)',
                textTransform: 'uppercase',
              }}
            >
              Your response
            </div>
            {a.responseText ? (
              <p
                className="ms-serif"
                style={{
                  fontSize: 16,
                  color: 'var(--text)',
                  lineHeight: 1.6,
                  marginTop: 10,
                }}
              >
                {a.responseText}
              </p>
            ) : (
              <p
                style={{
                  fontSize: 13,
                  color: 'var(--text-muted)',
                  marginTop: 10,
                }}
              >
                No response recorded.
              </p>
            )}
          </Card>
        </section>
      ) : (
        <section style={{ padding: '22px 20px 0' }}>
          {a.type === 'JOURNAL_PROMPT' && (
            <>
              <Card padding={16} radius={20}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: '0.12em',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    marginBottom: 8,
                  }}
                >
                  Your response
                </div>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Start writing…"
                  style={{
                    width: '100%',
                    minHeight: 160,
                    border: 'none',
                    outline: 'none',
                    resize: 'none',
                    background: 'transparent',
                    fontFamily: 'var(--font-serif)',
                    fontSize: 16,
                    lineHeight: 1.6,
                    color: 'var(--text)',
                  }}
                />
              </Card>
              <div
                style={{
                  marginTop: 10,
                  fontSize: 11.5,
                  color: 'var(--text-muted)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <IconPen size={12} sw={1.8} />
                Completing this will also save it to your Journal.
              </div>
            </>
          )}

          {a.type === 'WORKSHEET' && (
            <Card padding={18} radius={20}>
              <FormFieldLite
                label="Trigger"
                value={field1}
                onChange={setField1}
                placeholder="A meeting / email / message…"
              />
              <FormFieldLite
                label="Automatic thought"
                value={field2}
                onChange={setField2}
                placeholder="What ran through your mind?"
                multi
              />
              <div style={{ marginTop: 16 }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: '0.10em',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                  }}
                >
                  Belief intensity · 1 to 5
                </div>
                <div
                  style={{
                    display: 'flex',
                    gap: 8,
                    marginTop: 10,
                  }}
                >
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setScale(n)}
                      style={{
                        flex: 1,
                        padding: '10px 0',
                        borderRadius: 12,
                        background:
                          scale === n
                            ? 'var(--primary)'
                            : 'var(--bg-app)',
                        color:
                          scale === n
                            ? 'var(--on-dark)'
                            : 'var(--text)',
                        fontSize: 14,
                        fontWeight: 800,
                      }}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
              {/* Plus a free-text reflection so the existing
                  completeAssignment validation (responseText required
                  for textual types) is satisfied. */}
              <div style={{ marginTop: 16 }}>
                <FormFieldLite
                  label="Reflection (optional)"
                  value={text}
                  onChange={setText}
                  placeholder="What changed when you wrote this down?"
                  multi
                />
              </div>
            </Card>
          )}

          {a.type === 'READING' && (
            <Card padding={20} radius={20} bg="var(--soft-blue)">
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 14,
                    background: 'rgba(255,255,255,0.7)',
                    color: 'var(--navy)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <IconBook size={22} sw={1.8} />
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 800,
                      color: 'var(--navy)',
                    }}
                  >
                    Open the reading
                  </div>
                  <div
                    style={{
                      fontSize: 12,
                      color: 'var(--text-muted)',
                      marginTop: 2,
                    }}
                  >
                    Reading material is shared by your therapist
                    separately.
                  </div>
                </div>
                <IconArrowRight
                  size={18}
                  sw={2}
                  style={{ color: 'var(--navy)' }}
                />
              </div>
            </Card>
          )}

          {a.type === 'CUSTOM' && (
            <>
              <Card padding={16} radius={20}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: '0.12em',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                    marginBottom: 8,
                  }}
                >
                  Your response
                </div>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="A few sentences, that's all…"
                  style={{
                    width: '100%',
                    minHeight: 130,
                    border: 'none',
                    outline: 'none',
                    resize: 'none',
                    background: 'transparent',
                    fontFamily: 'var(--font-serif)',
                    fontSize: 16,
                    lineHeight: 1.6,
                    color: 'var(--text)',
                  }}
                />
              </Card>
              <Card padding={14} radius={20} style={{ marginTop: 12 }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 800,
                    letterSpacing: '0.10em',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                  }}
                >
                  How are you feeling? · Optional
                </div>
                <div
                  style={{
                    display: 'flex',
                    gap: 8,
                    marginTop: 10,
                  }}
                >
                  {([1, 2, 3, 4, 5] as const).map((i) => {
                    const info = MOOD_INFO[i]
                    const active = mood === i
                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setMood(active ? null : i)}
                        style={{
                          flex: 1,
                          aspectRatio: '1.4',
                          borderRadius: 14,
                          background: active
                            ? info?.tint
                            : 'var(--bg-app)',
                          color: active
                            ? info?.color
                            : 'var(--text-muted)',
                          border: active
                            ? `2px solid ${info?.color}`
                            : '2px solid transparent',
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
              </Card>
            </>
          )}

          {a.type === 'BREATHING' && (
            <BreathingTimer
              elapsed={breathingElapsed}
              running={breathingRunning}
              setRunning={setBreathingRunning}
            />
          )}

          {error && (
            <div
              role="alert"
              style={{
                marginTop: 14,
                padding: '10px 14px',
                borderRadius: 12,
                background: 'rgba(154,52,18,0.10)',
                color: 'var(--accent-deep)',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              {error}
            </div>
          )}
        </section>
      )}

      {!done && (
        <div
          style={{
            position: 'fixed',
            left: 14,
            right: 14,
            bottom: 'calc(env(safe-area-inset-bottom) + 76px)',
            display: 'flex',
            gap: 10,
            zIndex: 12,
          }}
        >
          <button
            type="button"
            onClick={handleSkip}
            disabled={saving}
            style={{
              padding: '14px 18px',
              borderRadius: 999,
              background: 'var(--bg-card)',
              color: 'var(--text-muted)',
              fontSize: 13,
              fontWeight: 800,
              boxShadow: 'var(--shadow-card)',
            }}
          >
            Skip
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            style={{
              flex: 1,
              padding: 14,
              borderRadius: 999,
              background: 'var(--primary)',
              color: 'var(--on-dark)',
              fontSize: 14,
              fontWeight: 800,
              boxShadow: 'var(--shadow-pop)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving
              ? 'Saving…'
              : a.type === 'READING'
              ? 'Mark as read'
              : 'Save & complete'}{' '}
            <IconCheck size={16} sw={2.4} />
          </button>
        </div>
      )}
    </div>
  )
}

function FormFieldLite({
  label,
  value,
  onChange,
  placeholder,
  multi,
}: {
  label: string
  value: string
  onChange: (v: string) => void
  placeholder: string
  multi?: boolean
}) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: '0.10em',
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          marginBottom: 6,
        }}
      >
        {label}
      </div>
      {multi ? (
        <textarea
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            width: '100%',
            minHeight: 60,
            padding: 10,
            borderRadius: 12,
            border: '1px solid var(--border-strong)',
            background: 'var(--bg-app)',
            outline: 'none',
            resize: 'none',
            fontFamily: 'var(--font-body)',
            fontSize: 14,
            color: 'var(--text)',
          }}
        />
      ) : (
        <input
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          style={{
            width: '100%',
            padding: '10px 12px',
            borderRadius: 12,
            border: '1px solid var(--border-strong)',
            background: 'var(--bg-app)',
            outline: 'none',
            fontFamily: 'var(--font-body)',
            fontSize: 14,
            fontWeight: 600,
            color: 'var(--text)',
          }}
        />
      )}
    </div>
  )
}

function BreathingTimer({
  elapsed,
  running,
  setRunning,
}: {
  elapsed: number
  running: boolean
  setRunning: (v: boolean) => void
}) {
  const target = 180 // 3 minutes
  const done = elapsed >= target
  const fmt = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
  return (
    <Card padding={20} radius={22} bg="var(--soft-blue)">
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: '0.12em',
          color: 'var(--navy)',
          textTransform: 'uppercase',
        }}
      >
        Box breathing · 3 min
      </div>
      <div
        className="ms-display"
        style={{
          fontSize: 36,
          color: 'var(--navy)',
          marginTop: 10,
          fontFamily: 'ui-monospace, monospace',
          letterSpacing: '0.04em',
        }}
      >
        {fmt(elapsed)}
      </div>
      <div
        style={{
          height: 6,
          borderRadius: 999,
          background: 'rgba(30,68,92,0.20)',
          marginTop: 14,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${Math.min(100, (elapsed / target) * 100)}%`,
            height: '100%',
            background: 'var(--navy)',
            transition: 'width .3s',
          }}
        />
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
        {!done ? (
          <button
            type="button"
            onClick={() => setRunning(!running)}
            style={{
              flex: 1,
              padding: 14,
              borderRadius: 999,
              background: 'var(--navy)',
              color: 'var(--on-dark)',
              fontSize: 14,
              fontWeight: 800,
            }}
          >
            {running
              ? 'Pause'
              : elapsed === 0
              ? 'Start breathing'
              : 'Resume'}
          </button>
        ) : (
          <div
            style={{
              flex: 1,
              padding: 14,
              borderRadius: 999,
              background: 'var(--navy)',
              color: 'var(--on-dark)',
              fontSize: 14,
              fontWeight: 800,
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
            }}
          >
            Done <IconCheck size={14} sw={2.4} />
          </div>
        )}
      </div>
    </Card>
  )
}
