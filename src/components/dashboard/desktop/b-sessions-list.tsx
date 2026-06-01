'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import { BCap, BCard, BChip } from './b-atoms'
import BPageHeader from './b-page-header'

// Phase 3b — Sessions list (Direction B port).
// Single client component. Data is fetched server-side by the page and
// handed in already-shaped. Filters live in local state — no route
// changes, no URL params (preserves the "don't change routes" rule).

type SessionStatus = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'

export type SessionItem = {
  id: string
  /** ISO string — the client parses to Date. Server components stay
   *  serializable. */
  date: string
  status: SessionStatus
  doctorName: string
  doctorDesignation: string | null
  /** 1-indexed ordinal in the user's session history. */
  ordinal: number
}

export type Props = {
  sessions: SessionItem[]
  /** Total + upcoming counts for the header sub-line. Computed server-side
   *  so we don't re-derive on every filter toggle. */
  totalCount: number
  upcomingCount: number
  /** Optional name of the user's primary therapist (most recent). Drives
   *  the footer copy. */
  primaryTherapist: string | null
  /** Cumulative session minutes, used for the footer's "About X hours"
   *  summary. We assume 60min per completed session by default; if you
   *  later track actual durations, pass them here. */
  totalMinutes: number
}

type Filter = 'all' | 'upcoming' | 'past' | 'cancelled'

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'past', label: 'Past' },
  { key: 'cancelled', label: 'Cancelled' },
]

const SESSION_DURATION_MIN = 60

export default function BSessionsList({
  sessions,
  totalCount,
  upcomingCount,
  primaryTherapist,
  totalMinutes,
}: Props) {
  const [filter, setFilter] = useState<Filter>('all')

  const now = useMemo(() => new Date(), [])

  // Pinned upcoming session = the earliest future PENDING/CONFIRMED one.
  // `sessions` is sorted desc by date; we walk it to find the next-up.
  const pinned = useMemo(() => {
    const upcoming = sessions
      .filter((s) => new Date(s.date) >= now && (s.status === 'PENDING' || s.status === 'CONFIRMED'))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    return upcoming[0] ?? null
  }, [sessions, now])

  const past = useMemo(() => {
    return sessions.filter((s) => {
      const isPast = new Date(s.date) < now
      const isOver = s.status === 'COMPLETED' || s.status === 'NO_SHOW'
      const isCancelled = s.status === 'CANCELLED'
      return isPast || isOver || isCancelled
    })
  }, [sessions, now])

  const filteredPast = useMemo(() => {
    if (filter === 'upcoming') return []
    if (filter === 'cancelled') return past.filter((s) => s.status === 'CANCELLED')
    if (filter === 'past') return past.filter((s) => s.status !== 'CANCELLED')
    return past
  }, [past, filter])

  const showPinned = filter === 'all' || filter === 'upcoming'

  const subLabel = `${totalCount} booked · ${upcomingCount} upcoming · IST`

  return (
    <>
      <BPageHeader title="Sessions" sub={subLabel} ctas={['search', 'book']} />

      {/* Filter strip */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {FILTERS.map((f) => {
          const on = filter === f.key
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
              {f.label}
            </button>
          )
        })}
        <div style={{ flex: 1 }} />
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--text-faint)' }}>
          SORT · MOST RECENT
        </span>
      </div>

      {/* Pinned upcoming */}
      {showPinned && pinned && <PinnedUpcoming session={pinned} />}
      {showPinned && !pinned && filter === 'upcoming' && (
        <NoUpcoming />
      )}

      {/* Past ledger */}
      {filteredPast.length > 0 && (
        <BCard padding={0} style={{ overflow: 'hidden' }}>
          <div
            style={{
              padding: '12px 18px',
              borderBottom: '1px solid var(--border)',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'baseline',
            }}
          >
            <BCap>
              {filter === 'cancelled' ? 'Cancelled' : 'Past'} · {filteredPast.length}{' '}
              {filteredPast.length === 1 ? 'session' : 'sessions'}
            </BCap>
          </div>
          {filteredPast.map((s, i) => (
            <PastRow key={s.id} session={s} first={i === 0} />
          ))}
        </BCard>
      )}

      {/* Empty filter result (e.g. cancelled with no rows) */}
      {filteredPast.length === 0 && !showPinned && (
        <EmptyFilter filter={filter} />
      )}

      {/* Footer summary */}
      {totalCount > 0 && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginTop: 4 }}>
          <span
            style={{
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              fontSize: 14,
              color: 'var(--text-muted)',
            }}
          >
            {composeFooterCopy(totalMinutes, totalCount, primaryTherapist)}
          </span>
        </div>
      )}
    </>
  )
}

// ─── Pinned upcoming card ─────────────────────────────────────────────

function PinnedUpcoming({ session }: { session: SessionItem }) {
  const date = new Date(session.date)
  const now = new Date()
  const days = Math.round((date.getTime() - now.getTime()) / 86400000)
  const inLabel =
    days <= 0 ? 'today' :
    days === 1 ? 'tomorrow' :
    `in ${days} days`

  const dayLetter = date
    .toLocaleDateString('en-IN', { weekday: 'short' })
    .toUpperCase()
  const dayNum = date.getDate().toString().padStart(2, '0')
  const monthTime = `${date
    .toLocaleDateString('en-IN', { month: 'short' })
    .toUpperCase()} · ${date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}`

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        borderRadius: 14,
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-card)',
        padding: 18,
        display: 'grid',
        gridTemplateColumns: '88px 1fr auto',
        gap: 18,
        alignItems: 'center',
      }}
    >
      <div
        style={{
          background: 'var(--primary)',
          color: '#fff',
          borderRadius: 12,
          padding: '10px 0',
          textAlign: 'center',
        }}
      >
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: 10.5, opacity: 0.7, letterSpacing: '0.12em' }}>
          {dayLetter}
        </div>
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: 32, lineHeight: 1, marginTop: 2, fontWeight: 500 }}>
          {dayNum}
        </div>
        <div style={{ fontFamily: 'var(--font-heading)', fontSize: 10.5, opacity: 0.7, letterSpacing: '0.08em', marginTop: 2 }}>
          {monthTime}
        </div>
      </div>
      <div>
        <BCap>
          Session {session.ordinal} · upcoming · {inLabel}
        </BCap>
        <div
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 19,
            fontWeight: 500,
            color: 'var(--text)',
            marginTop: 4,
          }}
        >
          With {session.doctorName} · 50 min
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
          Join opens 15 minutes before
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6, alignItems: 'flex-end' }}>
        <Link
          href={`/user/sessions/${session.id}`}
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 13,
            padding: '9px 16px',
            borderRadius: 999,
            background: 'var(--primary)',
            color: '#fff',
            fontWeight: 500,
          }}
        >
          View details
        </Link>
        <Link
          href="/user/sessions/book"
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 12,
            padding: '7px 14px',
            borderRadius: 999,
            background: 'transparent',
            color: 'var(--text-muted)',
            border: '1px solid var(--border)',
          }}
        >
          Reschedule
        </Link>
      </div>
    </div>
  )
}

// ─── Past row ─────────────────────────────────────────────────────────

function PastRow({ session, first }: { session: SessionItem; first: boolean }) {
  const date = new Date(session.date)
  const dateLabel = `${date.toLocaleDateString('en-IN', { weekday: 'short' })} · ${date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} · ${date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true }).toLowerCase()}`
  const isCancelled = session.status === 'CANCELLED'
  const isNoShow = session.status === 'NO_SHOW'

  return (
    <Link
      href={`/user/sessions/${session.id}`}
      style={{
        display: 'grid',
        gridTemplateColumns: '52px 200px 1fr 110px 24px',
        gap: 14,
        padding: '14px 18px',
        alignItems: 'center',
        borderTop: first ? 'none' : '1px solid var(--border)',
      }}
    >
      <span style={{
        fontFamily: 'var(--font-mono)',
        fontSize: 11,
        color: isCancelled ? 'var(--text-faint)' : 'var(--text-muted)',
      }}>
        {String(session.ordinal).padStart(2, '0')}
      </span>
      <div style={{
        fontFamily: 'var(--font-heading)',
        fontSize: 13,
        color: isCancelled ? 'var(--text-faint)' : 'var(--text)',
      }}>
        {dateLabel}
      </div>
      <div style={{
        fontFamily: 'var(--font-serif)',
        fontSize: 14,
        color: isCancelled ? 'var(--text-faint)' : 'var(--text)',
      }}>
        {isCancelled ? (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-faint)' }}>
            cancelled
          </span>
        ) : (
          `with ${session.doctorName}`
        )}
      </div>
      <BChip kind={isCancelled || isNoShow ? 'neutral' : 'primary'}>
        {isCancelled ? 'CANCELLED' : isNoShow ? 'NO-SHOW' : 'COMPLETED'}
      </BChip>
      <span style={{ color: 'var(--text-muted)' }}>›</span>
    </Link>
  )
}

// ─── Empty states ─────────────────────────────────────────────────────

function NoUpcoming() {
  return (
    <BCard style={{ textAlign: 'center', padding: '40px 24px' }}>
      <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
        No upcoming sessions.
      </p>
      <Link
        href="/user/sessions/book"
        style={{
          fontFamily: 'var(--font-heading)',
          display: 'inline-block',
          marginTop: 12,
          fontSize: 13,
          padding: '9px 18px',
          borderRadius: 999,
          background: 'var(--primary)',
          color: '#fff',
          fontWeight: 500,
        }}
      >
        Find a therapist
      </Link>
    </BCard>
  )
}

function EmptyFilter({ filter }: { filter: Filter }) {
  const copy =
    filter === 'cancelled'
      ? 'No cancelled sessions — keeping the rhythm.'
      : 'Nothing to show in this filter.'
  return (
    <BCard style={{ textAlign: 'center', padding: '32px 24px' }}>
      <p
        style={{
          fontFamily: 'var(--font-serif)',
          fontStyle: 'italic',
          fontSize: 13.5,
          color: 'var(--text-faint)',
        }}
      >
        {copy}
      </p>
    </BCard>
  )
}

// ─── Footer copy ──────────────────────────────────────────────────────

function composeFooterCopy(
  totalMinutes: number,
  totalCount: number,
  primaryTherapist: string | null,
): string {
  void SESSION_DURATION_MIN
  const hours = Math.floor(totalMinutes / 60)
  const mins = totalMinutes % 60
  const timeBit =
    hours === 0
      ? `${mins} minutes`
      : mins === 0
        ? `${hours} ${hours === 1 ? 'hour' : 'hours'}`
        : `${hours} hours, ${mins} minutes`
  const sessionBit = `${totalCount} ${totalCount === 1 ? 'session' : 'sessions'}`
  const tail = primaryTherapist ? ` With ${primaryTherapist}.` : ''
  return `About ${timeBit} across ${sessionBit}.${tail}`
}
