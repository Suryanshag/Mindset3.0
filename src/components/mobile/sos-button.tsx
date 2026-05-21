'use client'

// Persistent SOS affordance — 36×36 soft-pink circle with a centered
// heart-plus glyph. Ported from app/sos-button.jsx (29 LOC, verbatim).
//
// Currently injected via the mobile header on every authenticated /user
// route. Hidden on /user/sos itself (the SOS triage page is the
// destination, no need to show the affordance there).

import Link from 'next/link'

type SosButtonProps = {
  /** When false, renders nothing. Used by the SOS page itself to hide. */
  show?: boolean
  /** Override the default navigation target (rare — most callers don't). */
  href?: string
}

export default function SosButton({ show = true, href = '/user/sos' }: SosButtonProps) {
  if (!show) return null
  return (
    <Link
      href={href}
      aria-label="SOS · Get help now"
      style={{
        width: 36,
        height: 36,
        borderRadius: '50%',
        background: 'var(--soft-pink)',
        color: 'var(--accent-deep)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: 'var(--shadow-card)',
        flexShrink: 0,
      }}
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z" />
        <path d="M12 10v4" />
        <path d="M10 12h4" />
      </svg>
    </Link>
  )
}
