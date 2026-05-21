'use client'

// Mood check-in bottom sheet. Opened from the MoodHero on HomePartial /
// HomeEngaged. 5-face scale, optional one-line note, save via the
// existing logMoodCheckIn server action.

import { useState, useTransition } from 'react'
import { MoodFace, MOOD_INFO } from './ui'
import { IconCloseSmall } from './icons'
import { logMoodCheckIn } from '@/lib/actions/mood'

type MoodValue = 1 | 2 | 3 | 4 | 5

type MoodSheetProps = {
  open: boolean
  onClose: () => void
  /** Pre-selected mood when opening from a face-tap on MoodHero. */
  initialMood?: MoodValue
}

export default function MoodSheet({ open, onClose, initialMood }: MoodSheetProps) {
  const [selected, setSelected] = useState<MoodValue | null>(initialMood ?? null)
  const [note, setNote] = useState('')
  const [saving, startSaving] = useTransition()

  if (!open) return null

  const selectedInfo = selected ? MOOD_INFO[selected] : null

  const handleSave = () => {
    if (!selected || saving) return
    startSaving(async () => {
      const res = await logMoodCheckIn(selected, note)
      if (!('error' in res)) {
        onClose()
        setNote('')
      }
    })
  }

  return (
    <>
      <div
        onClick={onClose}
        aria-hidden="true"
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.45)',
          zIndex: 60,
          animation: 'fadeUp .25s ease-out both',
        }}
      />
      <div
        role="dialog"
        aria-labelledby="mood-sheet-title"
        aria-modal="true"
        style={{
          position: 'fixed',
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 61,
          background: 'var(--bg-card)',
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          padding: '12px 20px 32px',
          paddingBottom: 'calc(env(safe-area-inset-bottom) + 32px)',
          boxShadow: 'var(--shadow-pop)',
          animation: 'fadeUp .3s ease-out both',
          maxHeight: '85vh',
          overflowY: 'auto',
        }}
        className="screen-scroll"
      >
        {/* Drag handle + close affordance */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'center',
            marginBottom: 8,
          }}
        >
          <div
            style={{
              width: 40,
              height: 4,
              borderRadius: 2,
              background: 'var(--border-strong)',
            }}
            aria-hidden="true"
          />
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-start',
            marginBottom: 18,
          }}
        >
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '0.14em',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
              }}
            >
              Daily check-in
            </div>
            <h2
              id="mood-sheet-title"
              className="ms-display"
              style={{
                fontSize: 26,
                color: 'var(--text)',
                marginTop: 4,
                marginBottom: 0,
              }}
            >
              How are you feeling?
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            style={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              background: 'var(--bg-app)',
              color: 'var(--text-muted)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconCloseSmall size={16} sw={1.9} />
          </button>
        </div>

        <div
          style={{
            display: 'flex',
            gap: 10,
            marginBottom: 16,
          }}
        >
          {([1, 2, 3, 4, 5] as MoodValue[]).map((m) => {
            const active = selected === m
            const info = MOOD_INFO[m]
            return (
              <button
                key={m}
                type="button"
                onClick={() => setSelected(m)}
                aria-label={info?.label ?? `Mood ${m}`}
                style={{
                  flex: 1,
                  aspectRatio: '1',
                  borderRadius: 18,
                  background: active ? info?.color : 'var(--bg-app)',
                  color: active ? 'var(--on-dark)' : 'var(--text)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: active
                    ? `1px solid ${info?.color}`
                    : '1px solid var(--border-strong)',
                  transform: active ? 'scale(1.06)' : 'scale(1)',
                  transition: 'transform .15s ease',
                }}
              >
                <MoodFace mood={m} size={28} />
              </button>
            )
          })}
        </div>

        {selectedInfo && (
          <div
            style={{
              textAlign: 'center',
              fontSize: 14,
              fontWeight: 700,
              color: selectedInfo.color,
              marginBottom: 14,
            }}
          >
            {selectedInfo.label}
          </div>
        )}

        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Optional — one line about how this feels"
          maxLength={200}
          style={{
            width: '100%',
            padding: '12px 14px',
            borderRadius: 14,
            background: 'var(--bg-app)',
            border: '1px solid var(--border)',
            fontSize: 14,
            color: 'var(--text)',
            outline: 'none',
            marginBottom: 18,
          }}
        />

        <button
          type="button"
          onClick={handleSave}
          disabled={!selected || saving}
          style={{
            width: '100%',
            padding: '14px 20px',
            borderRadius: 999,
            background: selected ? 'var(--primary)' : 'var(--border-strong)',
            color: 'var(--on-dark)',
            fontSize: 15,
            fontWeight: 800,
            opacity: saving ? 0.7 : 1,
          }}
        >
          {saving ? 'Saving…' : 'Save check-in'}
        </button>
      </div>
    </>
  )
}
