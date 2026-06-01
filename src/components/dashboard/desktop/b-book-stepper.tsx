'use client'

import { Fragment } from 'react'

// Phase 3c — Three-step progress widget for the booking flow.
// at = 0 (Therapist) | 1 (Time) | 2 (Confirm).

const STEPS = ['Therapist', 'Time', 'Confirm'] as const

export default function BBookStepper({ at }: { at: 0 | 1 | 2 }) {
  return (
    <div className="flex items-center gap-3">
      {STEPS.map((s, i) => {
        const on = i === at
        const done = i < at
        return (
          <Fragment key={s}>
            <div className="flex items-center gap-2">
              <div
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  background: done ? 'var(--primary)' : on ? 'var(--ink)' : 'transparent',
                  border: done || on ? 'none' : '1px solid var(--border)',
                  color: done || on ? '#fff' : 'var(--text-faint)',
                  display: 'grid',
                  placeItems: 'center',
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  fontWeight: 500,
                }}
              >
                {done ? '✓' : i + 1}
              </div>
              <span
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 13,
                  color: on ? 'var(--text)' : 'var(--text-muted)',
                  fontWeight: on ? 500 : 400,
                }}
              >
                {s}
              </span>
            </div>
            {i < 2 && (
              <div
                style={{
                  width: 60,
                  height: 1,
                  background: done ? 'var(--primary)' : 'var(--border)',
                }}
              />
            )}
          </Fragment>
        )
      })}
      <div style={{ flex: 1 }} />
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10.5,
          color: 'var(--text-faint)',
        }}
      >
        SAVED AS DRAFT · YOU CAN COME BACK
      </span>
    </div>
  )
}
