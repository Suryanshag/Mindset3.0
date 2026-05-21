'use client'

// Phase 2 mobile header — ported from app/home.jsx §HomeHeader.
// Left: date + greeting + first-name in primary tint.
// Right: bell (with unread dot when count > 0) + persistent SOS button.
//
// Server-rendered content (date, name) is passed in via props from the
// page; the bell/SOS interactions are Link navigations (no JS handlers
// needed since SosButton + bell both navigate to dedicated routes).

import Link from 'next/link'
import { IconBell } from './icons'
import SosButton from './sos-button'

type MobileHeaderProps = {
  /** User's display name. The header renders the first word as the
   *  styled accent (matches the design's <span style="color: --primary">).
   *  Pass the full name; we extract the first word. */
  name: string
  /** Unread notification count; 0 hides the accent dot. */
  unreadCount?: number
  /** Show the bell (default true). Empty state hides it because there's
   *  nothing to notify on yet. */
  showBell?: boolean
  /** Show the SOS button (default true). The SOS page itself sets false. */
  showSos?: boolean
}

function todayLabel(): string {
  // en-IN format: "Sunday, 17 May" — matches the design.
  return new Date().toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

function greeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function MobileHeader({
  name,
  unreadCount = 0,
  showBell = true,
  showSos = true,
}: MobileHeaderProps) {
  const firstName = name.split(' ')[0] ?? name
  return (
    <header
      style={{
        padding: '18px 20px 6px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
      }}
    >
      <div>
        <div
          style={{
            fontSize: 13,
            color: 'var(--text-muted)',
            fontWeight: 600,
          }}
        >
          {todayLabel()}
        </div>
        <div
          className="ms-display"
          style={{ fontSize: 30, marginTop: 2, color: 'var(--text)' }}
        >
          {greeting()},{' '}
          <span style={{ color: 'var(--primary)' }}>{firstName}</span>
        </div>
      </div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {showBell && (
          <Link
            href="/user/notifications"
            aria-label={
              unreadCount > 0
                ? `Notifications, ${unreadCount} unread`
                : 'Notifications'
            }
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: 'var(--bg-card)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: 'var(--shadow-card)',
              color: 'var(--text)',
              position: 'relative',
            }}
          >
            <IconBell size={20} sw={1.7} />
            {unreadCount > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: 11,
                  right: 13,
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: 'var(--accent)',
                }}
                aria-hidden="true"
              />
            )}
          </Link>
        )}
        <SosButton show={showSos} />
      </div>
    </header>
  )
}
