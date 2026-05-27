'use client'

import { useState } from 'react'
import { Video, CheckCircle, Loader2, UserX } from 'lucide-react'
import { formatSessionTime } from '@/lib/format-date'
import StatusBadge from './status-badge'

export interface SessionForCard {
  id: string
  date: string // ISO
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
  paymentStatus: string
  meetLink: string | null
  user: { name: string }
}

interface Props {
  s: SessionForCard
  compact?: boolean
  /** Override label (e.g. "Today · 6:30 PM"). Defaults to formatSessionTime(date). */
  timeLabel?: string
  /** Default 60 min — matches our session duration. */
  durationMin?: number
  /** Called after a successful PATCH so parent can update list state. */
  onStatusChange?: (newStatus: 'COMPLETED' | 'NO_SHOW') => void
  /** Optional onClick for the card body (e.g. open detail). */
  onClick?: () => void
}

// ── Time-rule helpers — copied verbatim from existing calendar page so
// the mobile UI stays in lockstep with desktop and the API guards. ──
function canMarkComplete(s: SessionForCard): boolean {
  if (s.status !== 'CONFIRMED') return false
  if (s.paymentStatus !== 'PAID') return false
  return Date.now() >= new Date(s.date).getTime() + 45 * 60 * 1000
}
function canMarkNoShow(s: SessionForCard): boolean {
  if (s.status !== 'CONFIRMED') return false
  return Date.now() >= new Date(s.date).getTime() + 15 * 60 * 1000
}
function inJoinWindow(s: SessionForCard, durationMin: number): boolean {
  if (s.status !== 'CONFIRMED') return false
  const start = new Date(s.date).getTime()
  // Open from 15 min before start through end + 15 min (matches lib/session-window).
  return Date.now() >= start - 15 * 60 * 1000
      && Date.now() <= start + (durationMin + 15) * 60 * 1000
}

const initials = (name: string) => {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

export default function MobileSessionCard({
  s,
  compact,
  timeLabel,
  durationMin = 60,
  onStatusChange,
  onClick,
}: Props) {
  const [busy, setBusy] = useState<'complete' | 'noshow' | null>(null)

  async function patch(status: 'COMPLETED' | 'NO_SHOW') {
    if (status === 'NO_SHOW') {
      const ok = window.confirm(
        'Mark this session as no-show? The patient will not be refunded, and this cannot be undone.'
      )
      if (!ok) return
    }
    setBusy(status === 'COMPLETED' ? 'complete' : 'noshow')
    try {
      const res = await fetch(`/api/doctor/sessions/${s.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const data = await res.json()
      if (data.success) {
        onStatusChange?.(status)
      } else {
        alert(data.error || `Failed to mark ${status.toLowerCase()}`)
      }
    } finally {
      setBusy(null)
    }
  }

  const showJoin = inJoinWindow(s, durationMin) && !!s.meetLink
  const showComplete = canMarkComplete(s)
  const showNoShow = canMarkNoShow(s) && !canMarkComplete(s) // hide once complete is offered, to keep one primary action
  const avatarSize = compact ? 36 : 42

  return (
    <div
      onClick={onClick}
      className="flex items-center gap-3 rounded-[18px]"
      style={{
        background: 'var(--bg-card)',
        padding: compact ? 12 : 14,
        boxShadow: 'var(--shadow-card)',
        cursor: onClick ? 'pointer' : 'default',
      }}
    >
      <div
        className="flex items-center justify-center rounded-full font-extrabold text-[12px] shrink-0"
        style={{
          width: avatarSize,
          height: avatarSize,
          background: 'var(--primary)',
          color: 'var(--on-dark, var(--cream))',
        }}
      >
        {initials(s.user.name ?? 'P')}
      </div>

      <div className="flex-1 min-w-0">
        <div className="text-[14px] font-extrabold truncate" style={{ color: 'var(--text)' }}>
          {s.user.name ?? 'Patient'}
        </div>
        <div className="inline-flex items-center gap-2 mt-1 text-[11.5px]" style={{ color: 'var(--text-muted)' }}>
          <span>{timeLabel ?? formatSessionTime(s.date)}</span>
          <span>·</span>
          <span>{durationMin} min</span>
        </div>
        <div className="mt-1.5">
          <StatusBadge status={s.status} />
        </div>
      </div>

      {/* Action buttons — render all applicable independently so the
          doctor can mark no-show even while the join window is open.
          Visual priority via stack order: Join → Mark complete → No-show.
          At most 2 ever apply at once (showNoShow blocks once
          showComplete kicks in at 45min). */}
      <div className="flex flex-col items-end gap-1.5 shrink-0">
        {showJoin && (
          <a
            href={s.meetLink!}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className="inline-flex items-center gap-1.5 rounded-full text-[12px] font-extrabold"
            style={{
              padding: '8px 14px',
              background: 'var(--accent)',
              color: 'var(--on-dark, var(--cream))',
            }}
          >
            <Video size={12} strokeWidth={2.2} />
            Join
          </a>
        )}
        {showComplete && (
          <button
            onClick={(e) => { e.stopPropagation(); patch('COMPLETED') }}
            disabled={busy !== null}
            className="inline-flex items-center gap-1.5 rounded-full text-[12px] font-extrabold disabled:opacity-50"
            style={{ padding: '8px 14px', background: '#2A7A4A', color: 'var(--on-dark, var(--cream))' }}
          >
            {busy === 'complete'
              ? <Loader2 size={12} className="animate-spin" />
              : <CheckCircle size={12} strokeWidth={2.2} />}
            {busy === 'complete' ? 'Marking…' : 'Mark complete'}
          </button>
        )}
        {showNoShow && (
          <button
            onClick={(e) => { e.stopPropagation(); patch('NO_SHOW') }}
            disabled={busy !== null}
            className="inline-flex items-center gap-1.5 rounded-full text-[12px] font-extrabold disabled:opacity-50"
            style={{
              padding: '8px 14px',
              background: 'transparent',
              color: 'var(--text-muted)',
              border: '1.5px solid var(--border-strong)',
            }}
          >
            {busy === 'noshow'
              ? <Loader2 size={12} className="animate-spin" />
              : <UserX size={12} strokeWidth={2.2} />}
            {busy === 'noshow' ? 'Marking…' : 'No-show'}
          </button>
        )}
      </div>
    </div>
  )
}
