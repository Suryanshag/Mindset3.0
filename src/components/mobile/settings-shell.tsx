'use client'

// Phase 6 — Mobile SettingsShell. Ported from app/flows.jsx
// SettingsShell (lines 427-437). Reusable header + scroll container used
// by /user/profile/{notifications,privacy,language,help,delete}.

import Link from 'next/link'
import type { ReactNode } from 'react'
import { IconArrowLeft } from './icons'

type SettingsShellProps = {
  title: string
  /** Where the back button navigates. Defaults to /user/profile (settings hub). */
  backHref?: string
  children: ReactNode
  /** Extra padding-bottom past the default 110 (e.g. screens with sticky bottom CTAs). */
  bottomPad?: number
}

export default function SettingsShell({
  title,
  backHref = '/user/profile',
  children,
  bottomPad = 110,
}: SettingsShellProps) {
  return (
    <div
      className="screen-scroll"
      style={{
        background: 'var(--bg-app)',
        minHeight: '100%',
        overflowY: 'auto',
        paddingBottom: bottomPad,
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
          href={backHref}
          aria-label="Back"
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: 'var(--bg-card)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-card)',
            color: 'var(--text)',
          }}
        >
          <IconArrowLeft size={18} sw={1.8} />
        </Link>
        <div className="ms-display" style={{ fontSize: 22, flex: 1 }}>
          {title}
        </div>
      </header>
      <div style={{ padding: '8px 20px 0' }}>{children}</div>
    </div>
  )
}

// Shared row primitive — used by Settings hub + sub-screens. Mirrors the
// design's Row component (flows.jsx ~line 475) but as a typed Link/button.
type SettingsRowProps = {
  icon?: ReactNode
  label: string
  sub?: string
  href?: string
  onClick?: () => void
  last?: boolean
  trailing?: ReactNode
  danger?: boolean
}

export function SettingsRow({
  icon,
  label,
  sub,
  href,
  onClick,
  last,
  trailing,
  danger,
}: SettingsRowProps) {
  const content = (
    <>
      {icon && (
        <span
          style={{
            width: 38,
            height: 38,
            borderRadius: 12,
            background: 'var(--bg-app)',
            color: danger ? '#B23B2E' : 'var(--text)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexShrink: 0,
          }}
        >
          {icon}
        </span>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: danger ? '#B23B2E' : 'var(--text)',
          }}
        >
          {label}
        </div>
        {sub && (
          <div
            style={{
              fontSize: 12,
              color: 'var(--text-muted)',
              marginTop: 2,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {sub}
          </div>
        )}
      </div>
      {trailing}
    </>
  )

  const rowStyle = {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
    padding: '14px 16px',
    width: '100%',
    background: 'transparent',
    borderBottom: last ? 'none' : '1px solid var(--border)',
    textAlign: 'left' as const,
    color: 'var(--text)',
  }

  if (href) {
    return (
      <Link href={href} style={rowStyle}>
        {content}
      </Link>
    )
  }
  return (
    <button onClick={onClick} style={rowStyle} type="button">
      {content}
    </button>
  )
}
