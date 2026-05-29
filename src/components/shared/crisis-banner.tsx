'use client'

import { useEffect, useState } from 'react'
import { PhoneCall, X } from 'lucide-react'
import { HELPLINES } from '@/lib/safety/helplines'

type Variant = 'callout' | 'inline' | 'compact'

interface CrisisBannerProps {
  /** Visual variant. Defaults to `callout`. */
  variant?: Variant
  /** Allow the user to hide the banner for 7 days via localStorage.
   *  Only honoured for `inline` and `compact`; `callout` is always shown.
   */
  dismissible?: boolean
  /** Extra classes appended to the root element. */
  className?: string
}

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000

function storageKey(variant: Variant) {
  return `crisis-banner-dismissed-${variant}`
}

function readDismissed(variant: Variant): boolean {
  try {
    const raw = window.localStorage.getItem(storageKey(variant))
    if (!raw) return false
    const parsed = JSON.parse(raw) as { dismissedAt?: string }
    if (!parsed?.dismissedAt) return false
    const elapsed = Date.now() - new Date(parsed.dismissedAt).getTime()
    return elapsed >= 0 && elapsed < SEVEN_DAYS_MS
  } catch {
    return false
  }
}

function writeDismissed(variant: Variant) {
  try {
    window.localStorage.setItem(
      storageKey(variant),
      JSON.stringify({ dismissedAt: new Date().toISOString() }),
    )
  } catch {
    // localStorage unavailable (private window, quota) — accept that the
    // banner reappears next visit. Crisis surfaces should err on the side
    // of showing, not hiding.
  }
}

/**
 * Shared crisis-helpline banner. Pulls its data from the single source of
 * truth at `src/lib/safety/helplines.ts` so the four numbers stay in sync
 * across every surface that renders this component.
 *
 * Hydration: dismissed state lives in localStorage, so the server can't
 * know about it. We always render the banner on SSR and then run the
 * dismissal check in `useEffect` — the initial client render matches the
 * server output (avoids the hydration mismatch warning) and the banner
 * disappears in the second render if the user had dismissed it.
 */
export function CrisisBanner({
  variant = 'callout',
  dismissible = false,
  className,
}: CrisisBannerProps) {
  const allowDismiss = dismissible && variant !== 'callout'
  const [hidden, setHidden] = useState(false)

  useEffect(() => {
    if (allowDismiss && readDismissed(variant)) setHidden(true)
  }, [allowDismiss, variant])

  if (hidden) return null

  function dismiss() {
    writeDismissed(variant)
    setHidden(true)
  }

  const icall = HELPLINES[0]
  const vandrevala = HELPLINES[1]

  // ── Callout: full card with all four helplines, always visible ──
  if (variant === 'callout') {
    return (
      <section
        role="region"
        aria-label="Crisis helplines"
        className={`rounded-2xl p-5 lg:p-6 ${className ?? ''}`}
        style={{
          background: 'rgba(249, 101, 83, 0.08)',
          border: '1px solid rgba(249, 101, 83, 0.3)',
          color: 'var(--navy, #1E445C)',
        }}
      >
        <h2
          className="font-medium text-base lg:text-lg"
          style={{ color: 'var(--navy, #1E445C)' }}
        >
          In crisis right now?
        </h2>
        <p className="mt-1 text-sm opacity-80">
          If you&apos;re thinking about hurting yourself or others, please reach out
          immediately — these helplines are free, confidential, and staffed by
          trained listeners.
        </p>
        <ul className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {HELPLINES.map((h) => (
            <li key={h.id}>
              <a
                href={`tel:${h.phone}`}
                className="flex items-start gap-2.5 rounded-lg p-2.5 bg-white transition-colors hover:bg-white/80"
                style={{ border: '1px solid rgba(249, 101, 83, 0.2)' }}
              >
                <PhoneCall
                  size={16}
                  className="shrink-0 mt-0.5"
                  style={{ color: 'var(--coral, #F96553)' }}
                />
                <span className="min-w-0">
                  <span
                    className="block text-sm font-medium"
                    style={{ color: 'var(--navy, #1E445C)' }}
                  >
                    {h.name} · {h.display}
                  </span>
                  <span className="block text-xs opacity-70">
                    {h.hours} · {h.blurb}
                  </span>
                </span>
              </a>
            </li>
          ))}
        </ul>
      </section>
    )
  }

  // ── Inline: single paragraph, two primary numbers, dismissible ──
  if (variant === 'inline') {
    return (
      <p
        className={`text-[13px] leading-relaxed ${className ?? ''}`}
        style={{ color: 'var(--navy, #1E445C)' }}
      >
        If you&apos;re in crisis, please call{' '}
        <a
          href={`tel:${icall.phone}`}
          className="underline"
          style={{ color: 'var(--coral, #F96553)' }}
        >
          {icall.name.replace(' Helpline', '')} at {icall.display}
        </a>{' '}
        ({icall.hours}) or{' '}
        <a
          href={`tel:${vandrevala.phone}`}
          className="underline"
          style={{ color: 'var(--coral, #F96553)' }}
        >
          {vandrevala.name} at {vandrevala.display}
        </a>{' '}
        ({vandrevala.hours}).
        {allowDismiss && (
          <button
            type="button"
            onClick={dismiss}
            aria-label="Hide crisis banner for 7 days"
            className="inline-flex items-center align-middle ml-2 opacity-60 hover:opacity-100"
            style={{ color: 'var(--navy, #1E445C)' }}
          >
            <X size={14} />
          </button>
        )}
      </p>
    )
  }

  // ── Compact: one-line footer style, dismissible ──
  return (
    <p
      className={`text-[12px] flex items-center flex-wrap gap-x-1 ${className ?? ''}`}
      style={{ color: 'var(--navy, #1E445C)' }}
    >
      <PhoneCall
        size={12}
        className="shrink-0"
        style={{ color: 'var(--coral, #F96553)' }}
      />
      <span>Crisis?</span>
      <a
        href={`tel:${icall.phone}`}
        className="underline"
        style={{ color: 'var(--coral, #F96553)' }}
      >
        {icall.name.replace(' Helpline', '')} ({icall.display})
      </a>
      <span>or</span>
      <a
        href={`tel:${vandrevala.phone}`}
        className="underline"
        style={{ color: 'var(--coral, #F96553)' }}
      >
        {vandrevala.name} ({vandrevala.display})
      </a>
      <span className="opacity-70">· {vandrevala.hours} support available.</span>
      {allowDismiss && (
        <button
          type="button"
          onClick={dismiss}
          aria-label="Hide crisis banner for 7 days"
          className="inline-flex items-center ml-auto opacity-60 hover:opacity-100"
          style={{ color: 'var(--navy, #1E445C)' }}
        >
          <X size={12} />
        </button>
      )}
    </p>
  )
}

export default CrisisBanner
