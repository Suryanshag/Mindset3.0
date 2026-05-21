'use client'

// Phase 3 — Post-session interstitial (2-step flow).
// Ported from app/post-session.jsx but collapsed to two steps to match
// the SessionFollowup schema (postMood, homeworkNote, rebookIntent —
// no therapist-homework step in this sprint).
//
// Step 1: Mood (1-5) + optional one-line note → saves to SessionFollowup
// Step 2: Rebook pick (next week / two weeks / later) → sets rebookIntent
//
// Shown once per session — once the user submits OR skips, the
// SessionFollowup row exists and getPendingPostSession will skip this
// session from now on. Skipping writes a row with postMood=null +
// rebookIntent=null so we don't show the interstitial again.

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MoodFace, MOOD_INFO, Card, Avatar, Blob } from './ui'
import { IconArrowRight } from './icons'
import { saveSessionFollowup } from '@/lib/actions/session-followup'

type MoodValue = 1 | 2 | 3 | 4 | 5
type RebookChoice = 'week' | 'two' | 'later'

type Props = {
  sessionId: string
  doctorName: string
  doctorId: string
  doctorPhoto: string | null
  /** Optional ISO date of the session itself — used for the
   *  "Same time next week" suggestion in step 2. */
  sessionDate: string
}

export default function PostSessionInterstitial({
  sessionId,
  doctorName,
  doctorId,
  doctorPhoto,
  sessionDate,
}: Props) {
  const router = useRouter()
  const [step, setStep] = useState<0 | 1>(0)
  const [mood, setMood] = useState<MoodValue | null>(null)
  const [note, setNote] = useState('')
  const [pick, setPick] = useState<RebookChoice>('week')
  const [saving, startSaving] = useTransition()

  const firstName = doctorName.split(' ').slice(-1)[0] || doctorName

  const sessionDateObj = new Date(sessionDate)
  const sameTimeNextWeek = new Date(sessionDateObj)
  sameTimeNextWeek.setDate(sameTimeNextWeek.getDate() + 7)
  const sameTimeTwoWeeks = new Date(sessionDateObj)
  sameTimeTwoWeeks.setDate(sameTimeTwoWeeks.getDate() + 14)

  const fmtSuggestion = (d: Date) =>
    `${d.toLocaleDateString('en-IN', {
      weekday: 'short',
      day: 'numeric',
      month: 'short',
    })} · ${d.toLocaleTimeString('en-IN', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })}`

  const persistAndContinue = (rebookIntent: boolean | null) => {
    startSaving(async () => {
      const res = await saveSessionFollowup({
        sessionId,
        postMood: mood ?? undefined,
        homeworkNote: note,
        rebookIntent: rebookIntent ?? undefined,
      })
      if ('error' in res) return // best-effort; UI stays put on failure
      // After saving step 2, route to the destination.
      if (rebookIntent === true && pick !== 'later') {
        router.push(`/user/sessions/book?doctorId=${doctorId}`)
      } else {
        router.push('/user')
      }
    })
  }

  const skipAll = () => {
    startSaving(async () => {
      // Idempotent upsert with all nulls — leaves a SessionFollowup
      // row so the interstitial doesn't re-trigger. The user can
      // still navigate to /user/sessions/[id] and add notes later
      // via SessionUserNotes (which is a separate column).
      await saveSessionFollowup({ sessionId })
      router.push('/user')
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
        paddingBottom: 130,
      }}
    >
      {/* Progress dots + Close */}
      <header
        style={{
          padding: '18px 20px 8px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div style={{ display: 'flex', gap: 6 }}>
          {[0, 1].map((i) => (
            <div
              key={i}
              style={{
                width: step === i ? 22 : 6,
                height: 6,
                borderRadius: 4,
                background: step >= i ? 'var(--primary)' : 'var(--border-strong)',
                transition: 'all .3s',
              }}
            />
          ))}
        </div>
        <button
          type="button"
          onClick={skipAll}
          disabled={saving}
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--text-muted)',
          }}
        >
          {saving ? '…' : 'Skip'}
        </button>
      </header>

      <div key={step} style={{ animation: 'fadeUp .5s both' }}>
        {step === 0 && (
          <StepMood
            mood={mood}
            setMood={setMood}
            note={note}
            setNote={setNote}
            doctorName={doctorName}
            doctorPhoto={doctorPhoto}
            onContinue={() => setStep(1)}
          />
        )}
        {step === 1 && (
          <StepBooking
            firstName={firstName}
            pick={pick}
            setPick={setPick}
            options={[
              { id: 'week', label: 'Same time next week', sub: fmtSuggestion(sameTimeNextWeek) },
              { id: 'two', label: 'In two weeks', sub: fmtSuggestion(sameTimeTwoWeeks) },
              { id: 'later', label: "I'll book later", sub: "We won't nudge you" },
            ]}
            saving={saving}
            onDone={() => persistAndContinue(pick !== 'later')}
          />
        )}
      </div>
    </div>
  )
}

// ─── Step 1 — Mood + note ───────────────────────────────────────────
function StepMood({
  mood,
  setMood,
  note,
  setNote,
  doctorName,
  doctorPhoto,
  onContinue,
}: {
  mood: MoodValue | null
  setMood: (m: MoodValue) => void
  note: string
  setNote: (n: string) => void
  doctorName: string
  doctorPhoto: string | null
  onContinue: () => void
}) {
  return (
    <>
      {/* Therapist context — small avatar + name so the user knows
          which session this is about. */}
      <section
        style={{
          padding: '4px 24px 0',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
        }}
      >
        <Avatar
          name={doctorName}
          size={32}
          color="var(--accent)"
          src={doctorPhoto ?? undefined}
        />
        <span
          style={{
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.10em',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
          }}
        >
          After your session with {doctorName}
        </span>
      </section>

      <section style={{ padding: '20px 24px 0' }}>
        <h1
          className="ms-display"
          style={{
            fontSize: 38,
            marginTop: 8,
            lineHeight: 1.0,
            color: 'var(--text)',
            marginBottom: 0,
          }}
        >
          How did
          <br />
          that feel?
        </h1>
      </section>

      <section style={{ padding: '28px 20px 0' }}>
        <div style={{ display: 'flex', gap: 10 }}>
          {([1, 2, 3, 4, 5] as MoodValue[]).map((i) => {
            const active = mood === i
            const info = MOOD_INFO[i]
            return (
              <button
                key={i}
                type="button"
                onClick={() => setMood(i)}
                aria-label={info?.label ?? `Mood ${i}`}
                style={{
                  flex: 1,
                  aspectRatio: '1',
                  borderRadius: 20,
                  background: active ? info?.tint : 'var(--bg-card)',
                  color: active ? info?.color : 'var(--text-muted)',
                  border: active
                    ? `2px solid ${info?.color}`
                    : '2px solid transparent',
                  boxShadow: active ? 'none' : 'var(--shadow-card)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: active ? 'scale(1.06)' : 'scale(1)',
                  transition: 'transform .15s ease, background .2s ease',
                }}
              >
                <MoodFace mood={i} size={32} />
              </button>
            )
          })}
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 8,
            fontSize: 11,
            color: 'var(--text-muted)',
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
          }}
        >
          <span>Heavy</span>
          <span>Okay</span>
          <span>Lighter</span>
        </div>
      </section>

      <section style={{ padding: '24px 20px 0' }}>
        <Card padding={14}>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Anything you want to remember? Optional."
            maxLength={500}
            style={{
              width: '100%',
              minHeight: 96,
              border: 'none',
              outline: 'none',
              resize: 'none',
              background: 'transparent',
              fontFamily: 'var(--font-serif)',
              fontSize: 16,
              lineHeight: 1.55,
              color: 'var(--text)',
            }}
          />
        </Card>
      </section>

      <section style={{ padding: '28px 20px 0', textAlign: 'center' }}>
        <button
          type="button"
          onClick={onContinue}
          disabled={mood === null}
          style={{
            width: '100%',
            padding: 16,
            borderRadius: 999,
            background:
              mood === null ? 'var(--border-strong)' : 'var(--primary)',
            color: 'var(--on-dark)',
            fontSize: 15,
            fontWeight: 800,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            boxShadow:
              mood === null ? 'none' : 'var(--shadow-pop)',
            opacity: mood === null ? 0.7 : 1,
          }}
        >
          Continue <IconArrowRight size={16} sw={2.2} />
        </button>
      </section>
    </>
  )
}

// ─── Step 2 — Rebook pick ───────────────────────────────────────────
function StepBooking({
  firstName,
  pick,
  setPick,
  options,
  saving,
  onDone,
}: {
  firstName: string
  pick: RebookChoice
  setPick: (p: RebookChoice) => void
  options: { id: RebookChoice; label: string; sub: string }[]
  saving: boolean
  onDone: () => void
}) {
  const cta = pick === 'later' ? 'Done' : 'Pick a slot'
  return (
    <>
      <section style={{ padding: '14px 24px 0' }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--primary)',
          }}
        >
          Stay close
        </div>
        <h2
          className="ms-display"
          style={{
            fontSize: 34,
            marginTop: 8,
            lineHeight: 1.05,
            color: 'var(--text)',
          }}
        >
          When would you like
          <br />
          to see {firstName} again?
        </h2>
        <p
          className="ms-serif"
          style={{
            fontSize: 14,
            color: 'var(--text-muted)',
            marginTop: 12,
            lineHeight: 1.55,
          }}
        >
          These dates are suggestions. Tap “Pick a slot” to choose a
          real time on the booking page.
        </p>
      </section>

      <section style={{ padding: '24px 20px 0', display: 'grid', gap: 12 }}>
        {options.map((o, i) => (
          <BookingOption
            key={o.id}
            active={pick === o.id}
            label={o.label}
            sub={o.sub}
            onClick={() => setPick(o.id)}
            delay={i * 70}
          />
        ))}
      </section>

      <section style={{ padding: '28px 20px 0' }}>
        <button
          type="button"
          onClick={onDone}
          disabled={saving}
          style={{
            width: '100%',
            padding: 16,
            borderRadius: 999,
            background: 'var(--primary)',
            color: 'var(--on-dark)',
            fontSize: 15,
            fontWeight: 800,
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            boxShadow: 'var(--shadow-pop)',
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? 'Saving…' : cta} <IconArrowRight size={16} sw={2.2} />
        </button>
      </section>
    </>
  )
}

function BookingOption({
  label,
  sub,
  active,
  onClick,
  delay = 0,
}: {
  label: string
  sub: string
  active: boolean
  onClick: () => void
  delay?: number
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: '100%',
        textAlign: 'left',
        padding: '14px 16px',
        background: active ? 'var(--accent-tint)' : 'var(--bg-card)',
        borderRadius: 18,
        boxShadow: 'var(--shadow-card)',
        borderLeft: active
          ? '4px solid var(--accent)'
          : '4px solid transparent',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        animation: `slideIn .55s ${delay}ms both`,
        transition: 'background .2s, border-color .2s',
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 15,
            fontWeight: 800,
            color: 'var(--text)',
          }}
        >
          {label}
        </div>
        <div
          style={{
            fontSize: 12.5,
            color: 'var(--text-muted)',
            marginTop: 4,
          }}
        >
          {sub}
        </div>
      </div>
      <div
        style={{
          width: 22,
          height: 22,
          borderRadius: '50%',
          border: active
            ? '6px solid var(--accent)'
            : '2px solid var(--border-strong)',
          transition: 'all .2s',
          flexShrink: 0,
        }}
      />
    </button>
  )
}
