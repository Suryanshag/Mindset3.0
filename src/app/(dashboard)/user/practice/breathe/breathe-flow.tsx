'use client'

// Phase 4 — Breathing exercise flow. Ported from app/breathe.jsx.
// Three states: pre (pick rhythm + length) → during (animated breath
// circle + phase cues) → post (mood + optional note).
//
// FRONTEND-ONLY. No API calls, no server actions, no DB writes. Pure
// client-side timer. Per brief: no tracking of completion in DB.
//
// MobileHeader stays visible throughout for SOS access (per kickoff).
// Page does NOT opt out of the shell header.

import { useEffect, useRef, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { MoodFace, MOOD_INFO } from '@/components/mobile/ui'
import {
  IconArrowLeft,
  IconArrowRight,
  IconCheck,
} from '@/components/mobile/icons'

type ExerciseKey = 'box' | '4-7-8' | 'coherent'
type LengthId = '2' | '5' | '10'

const EXERCISES: Record<
  ExerciseKey,
  { label: string; sub: string; phases: [string, number][] }
> = {
  box: {
    label: 'Box · 4·4·4·4',
    sub: 'Even, grounding.',
    phases: [
      ['Breathe in…', 4],
      ['Hold.', 4],
      ['Breathe out…', 4],
      ['Hold.', 4],
    ],
  },
  '4-7-8': {
    label: '4-7-8 · Calming',
    sub: 'Slow exhale, gentler nervous system.',
    phases: [
      ['Breathe in…', 4],
      ['Hold.', 7],
      ['Breathe out…', 8],
    ],
  },
  coherent: {
    label: 'Coherent · 5·5',
    sub: 'Synced rhythm for steady focus.',
    phases: [
      ['Breathe in…', 5],
      ['Breathe out…', 5],
    ],
  },
}

const LENGTHS: { id: LengthId; s: number }[] = [
  { id: '2', s: 120 },
  { id: '5', s: 300 },
  { id: '10', s: 600 },
]

type Step = 'pre' | 'during' | 'post'

export default function BreatheFlow() {
  const router = useRouter()
  const [step, setStep] = useState<Step>('pre')
  const [ex, setEx] = useState<ExerciseKey>('box')
  const [len, setLen] = useState<LengthId>('5')
  const [audio, setAudio] = useState(true)

  const totalSec = LENGTHS.find((l) => l.id === len)?.s ?? 300

  return (
    <div data-mobile-fullbleed style={{ minHeight: '100%' }}>
      {step === 'pre' && (
        <BreathePre
          ex={ex}
          setEx={setEx}
          len={len}
          setLen={setLen}
          audio={audio}
          setAudio={setAudio}
          onBegin={() => setStep('during')}
          onBack={() => router.push('/user/practice')}
        />
      )}
      {step === 'during' && (
        <BreatheDuring
          exKey={ex}
          totalSec={totalSec}
          onEnd={() => setStep('post')}
        />
      )}
      {step === 'post' && (
        <BreathePost
          onDone={() => router.push('/user/practice')}
        />
      )}
    </div>
  )
}

// ─── Pre ────────────────────────────────────────────────────────────
function BreathePre({
  ex,
  setEx,
  len,
  setLen,
  audio,
  setAudio,
  onBegin,
  onBack,
}: {
  ex: ExerciseKey
  setEx: (e: ExerciseKey) => void
  len: LengthId
  setLen: (l: LengthId) => void
  audio: boolean
  setAudio: (v: boolean) => void
  onBegin: () => void
  onBack: () => void
}) {
  return (
    <div
      className="screen-scroll"
      style={{
        background: 'var(--soft-blue)',
        minHeight: '100%',
        overflowY: 'auto',
        paddingBottom: 110,
      }}
    >
      <header style={{ padding: '14px 16px' }}>
        <button
          type="button"
          onClick={onBack}
          aria-label="Back to Practice"
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.55)',
            color: 'var(--navy)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <IconArrowLeft size={18} sw={1.8} />
        </button>
      </header>

      <section
        style={{
          padding: '6px 24px 0',
          animation: 'fadeUp .8s both',
        }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'var(--navy)',
          }}
        >
          Take a breath.
        </div>
        <h1
          className="ms-display"
          style={{
            fontSize: 32,
            marginTop: 8,
            lineHeight: 1.05,
            color: 'var(--navy)',
          }}
        >
          Pick a rhythm.
        </h1>
      </section>

      <section
        style={{
          padding: '22px 20px 0',
          display: 'grid',
          gap: 12,
        }}
      >
        {(Object.entries(EXERCISES) as [ExerciseKey, typeof EXERCISES[ExerciseKey]][]).map(
          ([k, e], i) => (
            <ExerciseCard
              key={k}
              active={ex === k}
              title={e.label}
              sub={e.sub}
              onClick={() => setEx(k)}
              delay={i * 70}
            />
          )
        )}
      </section>

      <section style={{ padding: '22px 20px 0' }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--navy)',
            marginBottom: 10,
          }}
        >
          Length
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {LENGTHS.map((L) => {
            const active = len === L.id
            return (
              <button
                key={L.id}
                type="button"
                onClick={() => setLen(L.id)}
                style={{
                  flex: 1,
                  padding: '12px 0',
                  borderRadius: 14,
                  fontSize: 13,
                  fontWeight: 800,
                  background: active
                    ? 'var(--navy)'
                    : 'rgba(255,255,255,0.55)',
                  color: active
                    ? 'var(--on-dark)'
                    : 'var(--navy)',
                  border: active
                    ? 'none'
                    : '1px solid rgba(30,68,92,0.16)',
                }}
              >
                {L.id} min
              </button>
            )
          })}
        </div>
      </section>

      <section style={{ padding: '22px 20px 0' }}>
        <div
          style={{
            background: 'rgba(255,255,255,0.55)',
            borderRadius: 18,
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}
        >
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontSize: 14,
                fontWeight: 700,
                color: 'var(--navy)',
              }}
            >
              Audio cues
            </div>
            <div
              style={{
                fontSize: 12,
                color: 'var(--navy)',
                opacity: 0.7,
                marginTop: 2,
              }}
            >
              Soft chime on phase change.
            </div>
          </div>
          <button
            type="button"
            onClick={() => setAudio(!audio)}
            aria-label="Toggle audio cues"
            aria-pressed={audio}
            style={{
              width: 44,
              height: 26,
              borderRadius: 999,
              background: audio
                ? 'var(--navy)'
                : 'rgba(30,68,92,0.20)',
              position: 'relative',
              transition: 'background .2s',
              border: 'none',
            }}
          >
            <span
              style={{
                position: 'absolute',
                top: 3,
                left: audio ? 21 : 3,
                width: 20,
                height: 20,
                borderRadius: '50%',
                background: '#fff',
                transition: 'left .2s',
                boxShadow: '0 1px 3px rgba(0,0,0,0.20)',
              }}
            />
          </button>
        </div>
      </section>

      <section style={{ padding: '28px 20px 0' }}>
        <button
          type="button"
          onClick={onBegin}
          style={{
            width: '100%',
            padding: 16,
            borderRadius: 999,
            background: 'var(--navy)',
            color: 'var(--on-dark)',
            fontSize: 15,
            fontWeight: 800,
            boxShadow: 'var(--shadow-pop)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
          }}
        >
          Begin <IconArrowRight size={16} sw={2.2} />
        </button>
      </section>
    </div>
  )
}

function ExerciseCard({
  active,
  title,
  sub,
  onClick,
  delay,
}: {
  active: boolean
  title: string
  sub: string
  onClick: () => void
  delay: number
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: '100%',
        textAlign: 'left',
        padding: '14px 16px',
        borderRadius: 18,
        background: active
          ? 'rgba(255,255,255,0.85)'
          : 'rgba(255,255,255,0.55)',
        borderLeft: active
          ? '4px solid var(--navy)'
          : '4px solid transparent',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        animation: `slideIn .55s ${delay}ms both`,
        transition: 'background .2s, border-color .2s',
      }}
    >
      <div style={{ flex: 1 }}>
        <div
          className="ms-display"
          style={{ fontSize: 18, color: 'var(--navy)' }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 12.5,
            color: 'var(--navy)',
            opacity: 0.75,
            marginTop: 4,
          }}
        >
          {sub}
        </div>
      </div>
      {active && (
        <IconCheck
          size={18}
          sw={2.4}
          style={{ color: 'var(--navy)' }}
        />
      )}
    </button>
  )
}

// ─── During ─────────────────────────────────────────────────────────
function BreatheDuring({
  exKey,
  totalSec,
  onEnd,
}: {
  exKey: ExerciseKey
  totalSec: number
  onEnd: () => void
}) {
  const ex = EXERCISES[exKey]
  const loopSec = ex.phases.reduce((s, [, sec]) => s + sec, 0)

  const [elapsed, setElapsed] = useState(0)
  const onEndRef = useRef(onEnd)
  onEndRef.current = onEnd

  useEffect(() => {
    const id = setInterval(() => {
      setElapsed((e) => {
        const nx = e + 1
        if (nx >= totalSec) {
          clearInterval(id)
          setTimeout(() => onEndRef.current(), 600)
          return totalSec
        }
        return nx
      })
    }, 1000)
    return () => clearInterval(id)
  }, [totalSec])

  // Current phase based on the loop position within elapsed.
  const inLoop = elapsed % loopSec
  let acc = 0
  let phase = ex.phases[0]
  for (const p of ex.phases) {
    if (inLoop < acc + p[1]) {
      phase = p
      break
    }
    acc += p[1]
  }

  const fmt = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  const animName = `breathe-${exKey.replace(/\W/g, '')}`
  const kf = (() => {
    if (exKey === 'box') {
      return `@keyframes ${animName} {
        0% { transform: scale(.6); }
        25% { transform: scale(1); }
        50% { transform: scale(1); }
        75% { transform: scale(.6); }
        100% { transform: scale(.6); }
      }`
    }
    if (exKey === '4-7-8') {
      return `@keyframes ${animName} {
        0% { transform: scale(.6); }
        21% { transform: scale(1); }
        58% { transform: scale(1); }
        100% { transform: scale(.6); }
      }`
    }
    return `@keyframes ${animName} {
      0% { transform: scale(.6); }
      50% { transform: scale(1); }
      100% { transform: scale(.6); }
    }`
  })()

  return (
    <div
      style={{
        background: 'var(--soft-blue)',
        minHeight: '100%',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
      }}
    >
      <style>{kf}</style>

      <header
        style={{
          padding: '14px 20px',
          display: 'flex',
          justifyContent: 'flex-end',
        }}
      >
        <button
          type="button"
          onClick={onEnd}
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--navy)',
            opacity: 0.7,
            padding: '8px 12px',
          }}
        >
          End early
        </button>
      </header>

      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 24,
        }}
      >
        <div
          style={{
            fontFamily: 'ui-monospace, monospace',
            fontSize: 12,
            color: 'var(--navy)',
            opacity: 0.6,
          }}
        >
          {fmt(elapsed)} / {fmt(totalSec)}
        </div>

        <div
          style={{
            width: 260,
            height: 260,
            borderRadius: '50%',
            background: 'rgba(255,255,255,0.55)',
            marginTop: 22,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            animation: `${animName} ${loopSec}s ease-in-out infinite`,
            willChange: 'transform',
          }}
        >
          <div
            style={{
              width: 200,
              height: 200,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.85)',
            }}
          />
        </div>

        <div
          key={phase[0]}
          className="ms-serif"
          style={{
            fontSize: 24,
            color: 'var(--navy)',
            marginTop: 32,
            animation: 'fadeUp .4s',
          }}
        >
          {phase[0]}
        </div>
      </div>
    </div>
  )
}

// ─── Post ───────────────────────────────────────────────────────────
function BreathePost({ onDone }: { onDone: () => void }) {
  const [mood, setMood] = useState<1 | 2 | 3 | 4 | 5 | null>(null)
  const [note, setNote] = useState('')

  // "Save to journal" routes to the composer with the note pre-filled.
  // We use URL search params instead of adding a server action so the
  // breathe flow stays purely frontend per brief.
  const saveToJournalHref =
    note.trim().length > 0
      ? `/user/practice/journal/new?body=${encodeURIComponent(note.trim())}`
      : '/user/practice/journal/new'

  return (
    <div
      className="screen-scroll"
      style={{
        background: 'var(--soft-blue)',
        minHeight: '100%',
        overflowY: 'auto',
        paddingBottom: 110,
      }}
    >
      <section
        style={{ padding: '28px 24px 0', animation: 'fadeUp .8s both' }}
      >
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.14em',
            textTransform: 'uppercase',
            color: 'var(--navy)',
          }}
        >
          How do you feel now?
        </div>
        <h2
          className="ms-display"
          style={{
            fontSize: 28,
            marginTop: 8,
            lineHeight: 1.05,
            color: 'var(--navy)',
          }}
        >
          Notice the shift.
        </h2>
      </section>

      <section style={{ padding: '22px 20px 0' }}>
        <div style={{ display: 'flex', gap: 10 }}>
          {([1, 2, 3, 4, 5] as const).map((i) => {
            const info = MOOD_INFO[i]
            const active = mood === i
            return (
              <button
                key={i}
                type="button"
                onClick={() => setMood(active ? null : i)}
                aria-label={info?.label ?? `Mood ${i}`}
                style={{
                  flex: 1,
                  aspectRatio: '1',
                  borderRadius: 18,
                  background: active
                    ? 'rgba(255,255,255,0.85)'
                    : 'rgba(255,255,255,0.45)',
                  color: active ? info?.color : 'var(--navy)',
                  border: active
                    ? `2px solid ${info?.color ?? 'var(--navy)'}`
                    : '2px solid transparent',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transform: active ? 'scale(1.05)' : 'scale(1)',
                  transition: 'transform .15s',
                }}
              >
                <MoodFace mood={i} size={28} />
              </button>
            )
          })}
        </div>
      </section>

      <section style={{ padding: '22px 20px 0' }}>
        <div
          style={{
            background: 'rgba(255,255,255,0.55)',
            borderRadius: 18,
            padding: 14,
          }}
        >
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Note this moment. Optional."
            style={{
              width: '100%',
              minHeight: 80,
              border: 'none',
              outline: 'none',
              resize: 'none',
              background: 'transparent',
              fontFamily: 'var(--font-serif)',
              fontSize: 15,
              lineHeight: 1.55,
              color: 'var(--navy)',
            }}
          />
        </div>
      </section>

      <section
        style={{
          padding: '28px 20px 0',
          display: 'flex',
          gap: 10,
        }}
      >
        <button
          type="button"
          onClick={onDone}
          style={{
            flex: 1,
            padding: 16,
            borderRadius: 999,
            background: 'transparent',
            color: 'var(--navy)',
            border: '1.5px solid rgba(30,68,92,0.35)',
            fontSize: 14,
            fontWeight: 800,
          }}
        >
          Done
        </button>
        <Link
          href={saveToJournalHref}
          style={{
            flex: 1,
            padding: 16,
            borderRadius: 999,
            background: 'var(--navy)',
            color: 'var(--on-dark)',
            fontSize: 14,
            fontWeight: 800,
            boxShadow: 'var(--shadow-pop)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          Save to journal
        </Link>
      </section>
    </div>
  )
}
