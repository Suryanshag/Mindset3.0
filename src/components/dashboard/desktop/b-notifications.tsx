'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { BCap, BCard, BChip } from './b-atoms'
import BPageHeader from './b-page-header'

// Phase 3i — Notifications inbox (Direction B port).
// Server pre-marks all unread as read at page-load time (see the page
// component) so the "mark all as read" link in the design is implicit
// here. Filter chips are local state.

type Notification = {
  id: string
  kind: string
  title: string
  body: string
  link: string | null
  /** ISO. */
  createdAt: string
  /** ISO or null. */
  readAt: string | null
}

type Filter = 'all' | 'from-therapist' | 'reminders' | 'orders' | 'system'

type Props = {
  notifications: Notification[]
  hasUnread: boolean
}

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'from-therapist', label: 'From your therapist' },
  { key: 'reminders', label: 'Reminders' },
  { key: 'orders', label: 'Orders' },
  { key: 'system', label: 'System' },
]

/** Maps each NotificationKind to its filter bucket. */
function bucket(kind: string): Filter[] {
  if (
    kind === 'ASSIGNMENT_NEW' ||
    kind === 'ASSIGNMENT_COMPLETED' ||
    kind === 'ASSIGNMENT_SUBMITTED' ||
    kind === 'SESSION_BOOKED' ||
    kind === 'SESSION_CANCELLED' ||
    kind === 'REVIEW_PROMPT'
  )
    return ['from-therapist']
  if (kind === 'SESSION_REMINDER') return ['reminders']
  if (kind === 'ORDER' || kind === 'REFUND_PROCESSED') return ['orders']
  if (
    kind === 'WORKSHOP' ||
    kind === 'WORKSHOP_REGISTRATION_CONFIRMED' ||
    kind === 'SYSTEM' ||
    kind === 'EARNING_PAID' ||
    kind === 'SESSION_CANCELLED_BY_USER'
  )
    return ['system']
  return ['system']
}

function chipFor(kind: string): { kind: 'journal' | 'workshop' | 'primary' | 'accent' | 'neutral'; tag: string } {
  switch (kind) {
    case 'ASSIGNMENT_NEW':
      return { kind: 'journal', tag: 'NEW ASSIGNMENT' }
    case 'ASSIGNMENT_COMPLETED':
    case 'ASSIGNMENT_SUBMITTED':
      return { kind: 'journal', tag: 'ASSIGNMENT' }
    case 'SESSION_BOOKED':
    case 'SESSION_CANCELLED':
    case 'SESSION_REMINDER':
    case 'SESSION_CANCELLED_BY_USER':
      return { kind: 'primary', tag: 'SESSION' }
    case 'REVIEW_PROMPT':
      return { kind: 'accent', tag: 'REVIEW' }
    case 'WORKSHOP':
    case 'WORKSHOP_REGISTRATION_CONFIRMED':
      return { kind: 'workshop', tag: 'WORKSHOP' }
    case 'ORDER':
    case 'REFUND_PROCESSED':
      return { kind: 'workshop', tag: 'ORDER' }
    case 'EARNING_PAID':
      return { kind: 'primary', tag: 'EARNING' }
    case 'SYSTEM':
    default:
      return { kind: 'neutral', tag: 'SYSTEM' }
  }
}

function dayLabel(date: Date): string {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const d = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  const diffDays = Math.round((today.getTime() - d.getTime()) / 86400000)

  if (diffDays === 0)
    return `TODAY · ${date.toLocaleDateString('en-IN', { weekday: 'short' }).toUpperCase()}`
  if (diffDays === 1)
    return `YESTERDAY · ${date.toLocaleDateString('en-IN', { weekday: 'short' }).toUpperCase()}`
  if (diffDays < 7)
    return `${date.toLocaleDateString('en-IN', { weekday: 'short' }).toUpperCase()} · ${date.getDate()} ${date.toLocaleDateString('en-IN', { month: 'short' }).toUpperCase()}`
  return 'EARLIER'
}

function relativeTime(iso: string): string {
  const then = new Date(iso)
  const now = Date.now()
  const diffMs = now - then.getTime()
  const mins = Math.floor(diffMs / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins} min`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours} hr`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days} ${days === 1 ? 'day' : 'days'}`
  return then.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
}

export default function BNotifications({ notifications, hasUnread }: Props) {
  const [filter, setFilter] = useState<Filter>('all')

  const counts = useMemo(() => {
    const map = new Map<Filter, number>()
    map.set('all', notifications.length)
    for (const n of notifications) {
      for (const b of bucket(n.kind)) {
        map.set(b, (map.get(b) ?? 0) + 1)
      }
    }
    return map
  }, [notifications])

  const filtered = useMemo(() => {
    if (filter === 'all') return notifications
    return notifications.filter((n) => bucket(n.kind).includes(filter))
  }, [notifications, filter])

  // Group by day label.
  const grouped = useMemo(() => {
    const buckets = new Map<string, Notification[]>()
    for (const n of filtered) {
      const label = dayLabel(new Date(n.createdAt))
      if (!buckets.has(label)) buckets.set(label, [])
      buckets.get(label)!.push(n)
    }
    return Array.from(buckets.entries())
  }, [filtered])

  const newCount = notifications.filter((n) => hasUnread && !n.readAt).length
  const sub = `${notifications.length} total${newCount > 0 ? ` · ${newCount} new on this visit` : ' · nothing urgent'}`

  return (
    <>
      <BPageHeader
        title="Notifications."
        breadcrumb={[
          { label: 'HOME', href: '/user' },
          { label: 'NOTIFICATIONS' },
        ]}
        back="/user"
        sub={sub}
        ctas={['search']}
      />

      {/* Filter chips */}
      <div className="flex items-center gap-2 flex-wrap">
        {FILTERS.map((f) => {
          const on = filter === f.key
          const count = counts.get(f.key) ?? 0
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 12,
                padding: '6px 12px',
                borderRadius: 999,
                background: on ? 'var(--ink)' : 'transparent',
                color: on ? '#fff' : 'var(--text-muted)',
                border: on ? 'none' : '1px solid var(--border)',
              }}
            >
              {f.label}{' '}
              <span style={{ opacity: 0.65, fontFamily: 'var(--font-mono)', fontSize: 10 }}>
                · {count}
              </span>
            </button>
          )
        })}
        <div style={{ flex: 1 }} />
        <span
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 12,
            color: 'var(--text-faint)',
          }}
        >
          All marked as read
        </span>
      </div>

      {/* Groups */}
      {grouped.length === 0 ? (
        <BCard style={{ textAlign: 'center', padding: '48px 24px' }}>
          <p
            style={{
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              fontSize: 14,
              color: 'var(--text-muted)',
            }}
          >
            Nothing to show in this filter.
          </p>
        </BCard>
      ) : (
        grouped.map(([label, group]) => (
          <div key={label}>
            <p
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10.5,
                color: 'var(--text-faint)',
                letterSpacing: '0.08em',
                marginBottom: 8,
              }}
            >
              {label}
            </p>
            <BCard padding={0} style={{ overflow: 'hidden' }}>
              {group.map((n, i) => (
                <Row key={n.id} notification={n} first={i === 0} />
              ))}
            </BCard>
          </div>
        ))
      )}

      <p
        style={{
          fontFamily: 'var(--font-serif)',
          fontStyle: 'italic',
          fontSize: 13,
          color: 'var(--text-faint)',
          textAlign: 'center',
          padding: '6px 0',
        }}
      >
        We never send push notifications about your therapy. Only what you ask for.
      </p>
    </>
  )
}

function Row({
  notification,
  first,
}: {
  notification: Notification
  first: boolean
}) {
  const { kind, tag } = chipFor(notification.kind)
  const wasUnread = !notification.readAt
  const content = (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '10px 140px 1fr 90px 24px',
        gap: 16,
        padding: '14px 18px',
        alignItems: 'center',
        borderTop: first ? 'none' : '1px solid var(--border)',
        background: wasUnread ? 'rgba(45,90,79,0.025)' : 'transparent',
      }}
    >
      <span
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: wasUnread ? 'var(--primary)' : 'transparent',
        }}
        aria-hidden="true"
      />
      <BChip kind={kind}>{tag}</BChip>
      <div>
        <div style={{ fontSize: 13.5, color: 'var(--text)', lineHeight: 1.45 }}>
          {notification.title}
        </div>
        {notification.body && (
          <div
            style={{
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              fontSize: 12.5,
              color: 'var(--text-muted)',
              marginTop: 4,
              lineHeight: 1.5,
              display: '-webkit-box',
              WebkitLineClamp: 1,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {notification.body}
          </div>
        )}
      </div>
      <span
        style={{
          fontFamily: 'var(--font-mono)',
          fontSize: 10.5,
          color: 'var(--text-faint)',
          textAlign: 'right',
        }}
      >
        {relativeTime(notification.createdAt)}
      </span>
      <span style={{ color: 'var(--text-muted)' }}>
        {notification.link ? '›' : ''}
      </span>
    </div>
  )

  if (notification.link) {
    return <Link href={notification.link}>{content}</Link>
  }
  return content
}
