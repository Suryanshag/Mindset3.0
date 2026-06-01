'use client'

import type { CSSProperties, ReactNode } from 'react'

// Phase 3a — Shared visual atoms ported from the Direction B design.
// These are the building blocks every B sub-page composes from:
//   • BCap — uppercase Barlow caption ("Your therapist", "Next session")
//   • BCard — white card with a subtle border + optional accent stripe
//   • BChip — small uppercase pill (JOURNAL / BREATHING / COMPLETED…)
//   • BFooter — generic page footer (rendered once by DesktopContent)
// Kept token-driven so any future palette tweak ripples through.

export function BCap({
  children,
  style,
}: {
  children: ReactNode
  style?: CSSProperties
}) {
  return (
    <div
      style={{
        fontSize: 10.5,
        letterSpacing: '0.10em',
        textTransform: 'uppercase',
        fontWeight: 500,
        color: 'var(--text-faint)',
        fontFamily: 'var(--font-heading)',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

export function BCard({
  children,
  style,
  accent,
  padding = 18,
}: {
  children: ReactNode
  style?: CSSProperties
  /** Optional left-edge accent colour (use a token, e.g. 'var(--accent)'). */
  accent?: string
  padding?: number
}) {
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        borderRadius: 14,
        border: '1px solid var(--border)',
        padding,
        ...(accent ? { borderLeft: `3px solid ${accent}` } : {}),
        ...style,
      }}
    >
      {children}
    </div>
  )
}

/**
 * Small kind-coloured chip. The "kind" maps to a (bg, fg) pair derived
 * from the design's recurring tones — journal/breath/workshop/primary/
 * neutral/accent. Pass `bg`/`fg` directly to bypass the map.
 */
export function BChip({
  children,
  kind = 'neutral',
  bg,
  fg,
}: {
  children: ReactNode
  kind?: 'journal' | 'breath' | 'workshop' | 'primary' | 'neutral' | 'accent'
  bg?: string
  fg?: string
}) {
  const tone = TONE_BY_KIND[kind]
  return (
    <span
      style={{
        fontFamily: 'var(--font-heading)',
        fontSize: 10,
        padding: '3px 8px',
        borderRadius: 999,
        background: bg ?? tone.bg,
        color: fg ?? tone.fg,
        letterSpacing: '0.08em',
        display: 'inline-block',
        textTransform: 'uppercase',
      }}
    >
      {children}
    </span>
  )
}

const TONE_BY_KIND: Record<
  'journal' | 'breath' | 'workshop' | 'primary' | 'neutral' | 'accent',
  { bg: string; fg: string }
> = {
  journal: { bg: 'var(--accent-tint)', fg: 'var(--accent-deep)' },
  breath: { bg: 'var(--purple-tint)', fg: '#5A4C7A' },
  workshop: { bg: 'var(--tan-tint)', fg: '#7A4A1F' },
  primary: { bg: 'var(--primary-tint)', fg: 'var(--primary)' },
  neutral: { bg: 'rgba(0,0,0,0.04)', fg: 'var(--text-muted)' },
  accent: { bg: 'var(--accent-tint)', fg: 'var(--accent-deep)' },
}

/**
 * Page footer — rendered once by DesktopContent (so every sub-page
 * inherits it without each page-level component having to remember it).
 * Two halves: the brand/time-zone line, and a small crisis pointer.
 */
export function BFooter() {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'baseline',
        paddingTop: 16,
        marginTop: 18,
        borderTop: '1px solid var(--border)',
        fontSize: 11.5,
        color: 'var(--text-faint)',
      }}
    >
      <span>Mindset · India · all times IST</span>
      <span>
        <span
          aria-hidden="true"
          style={{
            width: 6,
            height: 6,
            display: 'inline-block',
            borderRadius: '50%',
            background: 'var(--accent-deep)',
            marginRight: 6,
            verticalAlign: 'middle',
          }}
        />
        Feeling unsafe?{' '}
        <a
          href="/user/sos"
          style={{ color: 'var(--text-faint)', textDecoration: 'underline', textUnderlineOffset: 2 }}
        >
          iCall · Vandrevala · KIRAN 1800‑599‑0019
        </a>
      </span>
    </div>
  )
}
