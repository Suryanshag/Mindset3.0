'use client'

// Phase 7 — Mobile Notifications screen. Ports app/notifications.jsx
// (119 LOC). Grouped Today / This week / Earlier; unread rows have a
// colored 4px left bar, read rows fade to 0.7 opacity.
//
// Coexists with the existing Sprint Pre-Launch H2 logic: the server
// page captures the snapshot before marking unread-on-load as read, so
// hasUnread reflects "was anything unread when you opened this page?"
// The Mark-all-read button stays useful for the case where new
// notifications arrive while the user is on the page and they tap the
// button without re-navigating. Optimistic UI: local state flips
// instantly, server action fires in startTransition.

import { useRouter } from 'next/navigation'
import { useState, useTransition } from 'react'
import {
  IconArrowLeft,
  IconCalendar,
  IconChat,
  IconClipboard,
  IconPen,
  IconPlay,
  IconBook,
  IconPackage,
  IconBell,
} from './icons'
import {
  markNotificationRead,
  markAllNotificationsRead,
} from '@/lib/actions/notifications'

type Notification = {
  id: string
  kind: string
  title: string
  body: string
  link: string | null
  createdAt: string
  readAt: string | null
}

type MobileNotificationsProps = {
  notifications: Notification[]
  /** True if any of the loaded notifications were unread when the page
   *  rendered (Sprint H2 server snapshot, BEFORE the auto-mark mutation). */
  hasUnreadOnLoad: boolean
}

type IconKind = {
  Icon: React.ComponentType<{ size?: number; sw?: number }>
  bg: string
  fg: string
}

// Map NotificationKind enum → design icon + tint pair. Falls back to
// SYSTEM styling if a new kind ships without a mapping here.
const KIND_STYLE: Record<string, IconKind> = {
  SESSION_REMINDER: {
    Icon: IconCalendar,
    bg: 'var(--primary-tint)',
    fg: 'var(--primary)',
  },
  SESSION_CANCELLED: {
    Icon: IconCalendar,
    bg: 'var(--accent-tint)',
    fg: 'var(--accent)',
  },
  WORKSHOP: {
    Icon: IconPlay,
    bg: 'var(--amber-soft)',
    fg: '#8A5A1F',
  },
  WORKSHOP_REGISTRATION_CONFIRMED: {
    Icon: IconPlay,
    bg: 'var(--amber-soft)',
    fg: '#8A5A1F',
  },
  ORDER: {
    Icon: IconPackage,
    bg: 'var(--soft-blue)',
    fg: 'var(--navy)',
  },
  REVIEW_PROMPT: {
    Icon: IconPen,
    bg: 'var(--accent-tint)',
    fg: 'var(--accent)',
  },
  REFUND_PROCESSED: {
    Icon: IconBook,
    bg: 'var(--soft-blue)',
    fg: 'var(--navy)',
  },
  ASSIGNMENT_NEW: {
    Icon: IconClipboard,
    bg: 'var(--primary-tint)',
    fg: 'var(--primary)',
  },
  ASSIGNMENT_COMPLETED: {
    Icon: IconClipboard,
    bg: 'var(--accent-tint)',
    fg: 'var(--accent)',
  },
  SYSTEM: {
    Icon: IconChat,
    bg: 'var(--primary-tint)',
    fg: 'var(--primary)',
  },
}

const FALLBACK_STYLE: IconKind = {
  Icon: IconChat,
  bg: 'var(--primary-tint)',
  fg: 'var(--primary)',
}

function istDateKey(d: Date): string {
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' })
}

function bucket(iso: string): 'today' | 'week' | 'earlier' {
  const now = new Date()
  const d = new Date(iso)
  const todayKey = istDateKey(now)
  const sevenDaysAgoKey = istDateKey(
    new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  )
  const dKey = istDateKey(d)
  if (dKey === todayKey) return 'today'
  if (dKey > sevenDaysAgoKey) return 'week'
  return 'earlier'
}

function ago(iso: string): string {
  const diffMs = Date.now() - new Date(iso).getTime()
  const diffHr = diffMs / (1000 * 60 * 60)
  if (diffHr < 1) {
    const m = Math.max(1, Math.floor(diffMs / (1000 * 60)))
    return `${m}m`
  }
  if (diffHr < 24) return `${Math.floor(diffHr)}h`
  const diffD = Math.floor(diffHr / 24)
  if (diffD === 1) return 'Yesterday'
  if (diffD < 7) return `${diffD}d`
  if (diffD < 30) return `${Math.floor(diffD / 7)}w`
  return `${Math.floor(diffD / 30)}mo`
}

export default function MobileNotifications({
  notifications: initial,
  hasUnreadOnLoad,
}: MobileNotificationsProps) {
  const router = useRouter()
  const [items, setItems] = useState<Notification[]>(initial)
  const [, startTransition] = useTransition()
  const anyUnread = items.some((n) => !n.readAt)

  // Show the button when the snapshot saw any unread OR (rare race)
  // local state still has unread rows. Hidden once everything is read,
  // matching design.
  const showMarkAll = hasUnreadOnLoad || anyUnread

  function handleTap(n: Notification) {
    // Optimistic: flip readAt in local state first; server action
    // fires in background. Navigation happens immediately too.
    const wasUnread = !n.readAt
    if (wasUnread) {
      setItems((arr) =>
        arr.map((x) =>
          x.id === n.id ? { ...x, readAt: new Date().toISOString() } : x
        )
      )
      startTransition(() => {
        markNotificationRead(n.id).catch(() => {
          // On failure, leave the optimistic state alone — the server
          // already marked it on the next /user/notifications visit
          // via Sprint H2 auto-mark. Surfacing an error here would be
          // noisier than the cost of a one-render inconsistency.
        })
      })
    }
    if (n.link) router.push(n.link)
  }

  function handleMarkAll() {
    // Optimistic flip of every unread row. Server-side updateMany is
    // a no-op if everything is already read.
    const now = new Date().toISOString()
    setItems((arr) =>
      arr.map((x) => (x.readAt ? x : { ...x, readAt: now }))
    )
    startTransition(() => {
      markAllNotificationsRead().catch(() => {})
    })
  }

  const today = items.filter((n) => bucket(n.createdAt) === 'today')
  const week = items.filter((n) => bucket(n.createdAt) === 'week')
  const earlier = items.filter((n) => bucket(n.createdAt) === 'earlier')

  return (
    <div
      className="screen-scroll"
      style={{
        background: 'var(--bg-app)',
        minHeight: '100%',
        overflowY: 'auto',
        paddingBottom: 110,
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
        <button
          type="button"
          onClick={() => router.back()}
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
        </button>
        <div className="ms-display" style={{ fontSize: 22, flex: 1 }}>
          Notifications
        </div>
        {items.length > 0 && showMarkAll && (
          <button
            type="button"
            onClick={handleMarkAll}
            style={{
              fontSize: 12,
              fontWeight: 800,
              color: 'var(--primary)',
            }}
          >
            Mark all read
          </button>
        )}
      </header>

      {items.length === 0 ? (
        <Empty />
      ) : (
        <div style={{ padding: '4px 16px 0' }}>
          {today.length > 0 && (
            <Group title="Today" items={today} onTap={handleTap} />
          )}
          {week.length > 0 && (
            <Group title="This week" items={week} onTap={handleTap} />
          )}
          {earlier.length > 0 && (
            <Group title="Earlier" items={earlier} onTap={handleTap} />
          )}
        </div>
      )}
    </div>
  )
}

function Group({
  title,
  items,
  onTap,
}: {
  title: string
  items: Notification[]
  onTap: (n: Notification) => void
}) {
  return (
    <section>
      <div
        style={{
          fontSize: 11,
          fontWeight: 800,
          letterSpacing: '0.14em',
          color: 'var(--text-muted)',
          textTransform: 'uppercase',
          margin: '18px 8px 8px',
        }}
      >
        {title}
      </div>
      <div style={{ display: 'grid', gap: 6 }}>
        {items.map((n, i) => (
          <Row key={n.id} n={n} onClick={() => onTap(n)} delay={i * 50} />
        ))}
      </div>
    </section>
  )
}

function Row({
  n,
  onClick,
  delay,
}: {
  n: Notification
  onClick: () => void
  delay: number
}) {
  const style = KIND_STYLE[n.kind] ?? FALLBACK_STYLE
  const Icon = style.Icon
  const unread = !n.readAt
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        width: '100%',
        textAlign: 'left',
        background: 'var(--bg-card)',
        borderRadius: 16,
        padding: '12px 14px',
        boxShadow: 'var(--shadow-card)',
        borderLeft: unread ? `4px solid ${style.fg}` : '4px solid transparent',
        opacity: unread ? 1 : 0.7,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        animation: `slideIn .45s ${delay}ms both`,
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 12,
          background: style.bg,
          color: style.fg,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <Icon size={16} sw={1.8} />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: 'var(--text)',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {n.title}
        </div>
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
          {n.body}
        </div>
      </div>
      <div style={{ fontSize: 11, color: 'var(--text-faint)', flexShrink: 0 }}>
        {ago(n.createdAt)}
      </div>
    </button>
  )
}

function Empty() {
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '60px 24px',
        textAlign: 'center',
      }}
    >
      <div
        style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: 'var(--bg-card)',
          color: 'var(--text-muted)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <IconBell size={28} sw={1.6} />
      </div>
      <div
        className="ms-display"
        style={{ fontSize: 20, marginTop: 16, color: 'var(--text)' }}
      >
        You&rsquo;re all caught up
      </div>
      <div
        style={{
          fontSize: 13,
          color: 'var(--text-muted)',
          marginTop: 6,
        }}
      >
        New nudges will land here.
      </div>
    </div>
  )
}
