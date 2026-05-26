'use client'

// Phase 3 — Mobile Sessions surface ported from app/sessions.jsx.
// Three tabs: Upcoming / Find / Past. Tab state is local (no URL sync)
// so back-button returns the user to wherever they came from, not to a
// previous tab in the same screen.
//
// SessionLive is explicitly NOT ported (brief non-goal — existing Meet
// link workflow stays). Slot picker on therapist detail is also skipped
// — the "Book a session" CTA navigates to /user/sessions/book?doctorId=X
// (the existing Razorpay-integrated booking page).

import { useState } from 'react'
import Link from 'next/link'
import { Card, Avatar, Chip, Blob } from './ui'
import {
  IconArrowRight,
  IconCalendar,
  IconChevR,
  IconPlus,
  IconSearch,
  IconVideo,
} from './icons'

type SessionItem = {
  id: string
  date: string // ISO
  status: 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
  meetLink: string | null
  doctor: {
    photo: string | null
    designation: string
    user: { name: string }
  }
}

type DoctorItem = {
  id: string
  photo: string | null
  designation: string
  type: 'COUNSELOR' | 'PSYCHOLOGIST'
  specialization: string
  experience: number
  sessionPrice: number
  user: { name: string }
}

type MobileSessionsProps = {
  upcoming: SessionItem[]
  past: SessionItem[]
  doctors: DoctorItem[]
  /** Optional pre-filled tab (matches the desktop ?tab= query for
   *  shared deep-links). 'find' / 'upcoming' / 'past'. */
  initialTab?: 'upcoming' | 'find' | 'past'
}

type Tab = 'upcoming' | 'find' | 'past'

const SESSION_DURATION_MIN = 60
const FIFTEEN_MIN_MS = 15 * 60 * 1000

// Match the joinWindowState 4-state model, kept inline so the mobile
// surface doesn't import the server-side helper (it's a string,
// computed on the server in case render time drift matters — but we
// also recompute here for live "Join in 3h" countdown labels).
function joinState(dateIso: string, status: string): 'cancelled' | 'open' | 'too_early' | 'ended' {
  if (status === 'CANCELLED') return 'cancelled'
  if (status === 'NO_SHOW') return 'ended'
  const start = new Date(dateIso).getTime()
  const end = start + SESSION_DURATION_MIN * 60 * 1000
  const now = Date.now()
  if (now < start - FIFTEEN_MIN_MS) return 'too_early'
  if (now > end + FIFTEEN_MIN_MS) return 'ended'
  if (status === 'CONFIRMED') return 'open'
  return now < start ? 'too_early' : 'ended'
}

function formatJoinIn(dateIso: string): string {
  const ms = new Date(dateIso).getTime() - Date.now()
  if (ms <= 0) return 'Join now'
  const minutes = Math.floor(ms / 60000)
  if (minutes < 60) return `Join in ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `Join in ${hours}h`
  const days = Math.floor(hours / 24)
  return `Join in ${days}d`
}

function formatDate(dateIso: string, opts?: Intl.DateTimeFormatOptions): string {
  return new Date(dateIso).toLocaleDateString('en-IN', opts)
}

export default function MobileSessions({
  upcoming,
  past,
  doctors,
  initialTab = 'upcoming',
}: MobileSessionsProps) {
  const [tab, setTab] = useState<Tab>(initialTab)
  const tabs: { id: Tab; label: string }[] = [
    { id: 'upcoming', label: 'Upcoming' },
    { id: 'find', label: 'Find a therapist' },
    { id: 'past', label: 'Past' },
  ]

  return (
    <div
      data-mobile-fullbleed
      className="screen-scroll"
      style={{
        background: 'var(--bg-app)',
        minHeight: '100%',
        overflowY: 'auto',
        paddingBottom: 110,
      }}
    >
      <header style={{ padding: '18px 20px 8px' }}>
        <div className="ms-display" style={{ fontSize: 32, color: 'var(--text)' }}>
          Therapy
        </div>
        <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}>
          Care, on your own time.
        </div>
      </header>

      {/* Tab pill */}
      <div style={{ padding: '10px 20px 0' }}>
        <div
          style={{
            display: 'flex',
            background: 'var(--bg-card)',
            borderRadius: 999,
            padding: 4,
            boxShadow: 'var(--shadow-card)',
          }}
        >
          {tabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              style={{
                flex: 1,
                padding: '10px 0',
                borderRadius: 999,
                fontSize: 13,
                fontWeight: 700,
                background: tab === t.id ? 'var(--primary)' : 'transparent',
                color: tab === t.id ? 'var(--on-dark)' : 'var(--text-muted)',
              }}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === 'upcoming' && <UpcomingTab sessions={upcoming} />}
      {tab === 'find' && <FindTab doctors={doctors} />}
      {tab === 'past' && <PastTab sessions={past} />}
    </div>
  )
}

// ───── Upcoming tab ─────────────────────────────────────────────────
function UpcomingTab({ sessions }: { sessions: SessionItem[] }) {
  if (sessions.length === 0) {
    return (
      <div style={{ padding: 20 }}>
        <Card padding={28} style={{ textAlign: 'center' }}>
          <p
            className="ms-serif"
            style={{
              fontSize: 16,
              color: 'var(--text-muted)',
              margin: 0,
              lineHeight: 1.55,
            }}
          >
            No upcoming sessions. Book one when you’re ready.
          </p>
          <Link
            href="/user/sessions/book"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 8,
              marginTop: 18,
              background: 'var(--primary)',
              color: 'var(--on-dark)',
              padding: '12px 20px',
              borderRadius: 999,
              fontSize: 14,
              fontWeight: 800,
            }}
          >
            Find a therapist <IconArrowRight size={14} sw={2.2} />
          </Link>
        </Card>
      </div>
    )
  }

  const featured = sessions[0]
  const rest = sessions.slice(1)
  const featuredState = joinState(featured.date, featured.status)

  return (
    <div style={{ padding: 20 }}>
      {/* Featured next session — primary background, join CTA if open */}
      <Card padding={0} style={{ overflow: 'hidden', marginBottom: 14 }}>
        <div
          style={{
            background: 'var(--primary)',
            color: 'var(--on-dark)',
            padding: '14px 18px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Blob
            fill="rgba(255,248,235,0.08)"
            style={{
              position: 'absolute',
              right: -30,
              top: -30,
              width: 140,
              height: 140,
            }}
          />
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <Avatar
              name={featured.doctor.user.name}
              size={48}
              color="var(--accent)"
              ring="rgba(255,248,235,0.25)"
              src={featured.doctor.photo ?? undefined}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: 'var(--on-dark-muted)',
                }}
              >
                {formatDate(featured.date, {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'short',
                })}{' '}
                ·{' '}
                {formatDate(featured.date, {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                })}
              </div>
              <div style={{ fontSize: 17, fontWeight: 700, marginTop: 2 }}>
                {featured.doctor.user.name}
              </div>
            </div>
            {featuredState === 'open' && featured.meetLink ? (
              <a
                href={featured.meetLink}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  background: 'var(--on-dark)',
                  color: 'var(--primary)',
                  padding: '9px 14px',
                  borderRadius: 999,
                  fontSize: 13,
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <IconVideo size={14} sw={2} /> Join
              </a>
            ) : featuredState === 'too_early' ? (
              <span
                style={{
                  background: 'rgba(255,248,235,0.18)',
                  color: 'var(--on-dark)',
                  padding: '7px 12px',
                  borderRadius: 999,
                  fontSize: 12,
                  fontWeight: 700,
                  whiteSpace: 'nowrap',
                }}
              >
                {formatJoinIn(featured.date)}
              </span>
            ) : null}
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            padding: 12,
            gap: 8,
            fontSize: 12,
            color: 'var(--text-muted)',
            alignItems: 'center',
          }}
        >
          <span
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 4,
            }}
          >
            <IconCalendar size={14} sw={1.7} /> {SESSION_DURATION_MIN} min ·{' '}
            {featured.doctor.designation}
          </span>
          <Link
            href={`/user/sessions/${featured.id}`}
            style={{
              marginLeft: 'auto',
              fontSize: 13,
              color: 'var(--primary)',
              fontWeight: 700,
            }}
          >
            Details
          </Link>
        </div>
      </Card>

      {rest.length > 0 && (
        <>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              color: 'var(--text-muted)',
              margin: '20px 4px 12px',
            }}
          >
            Next up
          </div>
          {rest.map((s) => (
            <UpcomingRow key={s.id} s={s} />
          ))}
        </>
      )}

      <Link
        href="/user/sessions/book"
        style={{
          width: '100%',
          marginTop: 18,
          padding: 16,
          background: 'var(--bg-card)',
          borderRadius: 22,
          boxShadow: 'var(--shadow-card)',
          color: 'var(--primary)',
          fontSize: 14,
          fontWeight: 700,
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 8,
          border: '1.5px dashed var(--primary-tint)',
        }}
      >
        <IconPlus size={16} sw={2} /> Book another session
      </Link>
    </div>
  )
}

function UpcomingRow({ s }: { s: SessionItem }) {
  const day = formatDate(s.date, { weekday: 'short' })
  const dayN = formatDate(s.date, { day: 'numeric' })
  const time = formatDate(s.date, {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
  return (
    <Link
      href={`/user/sessions/${s.id}`}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: 12,
        background: 'var(--bg-card)',
        borderRadius: 18,
        marginBottom: 10,
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <div
        style={{
          width: 46,
          textAlign: 'center',
          background: 'var(--bg-app)',
          borderRadius: 12,
          padding: '6px 4px',
        }}
      >
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
          }}
        >
          {day}
        </div>
        <div
          className="ms-display"
          style={{ fontSize: 20, color: 'var(--text)' }}
        >
          {dayN}
        </div>
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: 'var(--text)',
          }}
        >
          {s.doctor.user.name}
        </div>
        <div
          style={{
            fontSize: 12,
            color: 'var(--text-muted)',
            marginTop: 2,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
          }}
        >
          <IconVideo size={12} sw={1.8} /> Video · {time}
        </div>
      </div>
      <IconChevR size={18} sw={1.7} style={{ color: 'var(--text-muted)' }} />
    </Link>
  )
}

// ───── Find tab ─────────────────────────────────────────────────────
function FindTab({ doctors }: { doctors: DoctorItem[] }) {
  // Filter chips are derived from the union of doctor specializations.
  // "All" is always available. We don't wire search yet — the chip-based
  // filter handles 5-10 therapist catalogs well; adding a fuzzy search
  // is a Phase 4 polish item if we exceed that.
  const allSpecs = Array.from(new Set(doctors.map((d) => d.specialization)))
  const filters = ['All', ...allSpecs.slice(0, 5)]
  const [filter, setFilter] = useState('All')
  const visible =
    filter === 'All'
      ? doctors
      : doctors.filter((d) => d.specialization === filter)

  return (
    <div style={{ padding: '16px 20px 0' }}>
      {/* Search field — non-functional placeholder for now */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          background: 'var(--bg-card)',
          borderRadius: 999,
          padding: '12px 16px',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <IconSearch size={18} sw={1.7} style={{ color: 'var(--text-muted)' }} />
        <input
          placeholder="Search therapists, specialties…"
          style={{
            flex: 1,
            border: 'none',
            background: 'transparent',
            fontSize: 14,
            outline: 'none',
            color: 'var(--text)',
            fontFamily: 'inherit',
          }}
        />
      </div>

      <div
        style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          margin: '14px -20px 4px',
          padding: '0 20px 4px',
        }}
        className="screen-scroll"
      >
        {filters.map((f) => (
          <Chip
            key={f}
            active={filter === f}
            onClick={() => setFilter(f)}
          >
            {f}
          </Chip>
        ))}
      </div>

      <div style={{ marginTop: 14 }}>
        {visible.length === 0 ? (
          <Card padding={24} style={{ textAlign: 'center' }}>
            <p
              style={{
                fontSize: 13,
                color: 'var(--text-muted)',
                margin: 0,
              }}
            >
              No therapists match this filter. Try “All” to see everyone.
            </p>
          </Card>
        ) : (
          visible.map((d) => <TherapistCard key={d.id} d={d} />)
        )}
      </div>
    </div>
  )
}

function TherapistCard({ d }: { d: DoctorItem }) {
  return (
    <Link
      href={`/user/sessions/book/${d.id}`}
      style={{ display: 'block', marginBottom: 12 }}
    >
      <Card padding={0} style={{ overflow: 'hidden' }}>
        <div style={{ display: 'flex', gap: 14, padding: 16 }}>
          <Avatar
            name={d.user.name}
            size={64}
            color="var(--accent)"
            src={d.photo ?? undefined}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                display: 'flex',
                alignItems: 'flex-start',
                gap: 6,
              }}
            >
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 16,
                    fontWeight: 700,
                    color: 'var(--text)',
                  }}
                >
                  {d.user.name}
                </div>
                <div
                  style={{
                    fontSize: 12,
                    color: 'var(--text-muted)',
                    marginTop: 2,
                  }}
                >
                  {d.type === 'COUNSELOR' ? 'Counsellor' : 'Psychologist'} ·{' '}
                  {d.experience} yr{d.experience === 1 ? '' : 's'}
                </div>
              </div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  background: 'var(--primary-tint)',
                  color: 'var(--primary)',
                  padding: '4px 8px',
                  borderRadius: 6,
                  whiteSpace: 'nowrap',
                }}
              >
                ₹{Math.round(d.sessionPrice)}
              </div>
            </div>
            <div
              style={{
                marginTop: 8,
                fontSize: 12,
                color: 'var(--text)',
              }}
            >
              {d.specialization}
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                marginTop: 10,
                fontSize: 11,
                color: 'var(--text-muted)',
              }}
            >
              <span
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: '#4ade80',
                  }}
                />{' '}
                Booking open
              </span>
            </div>
          </div>
        </div>
      </Card>
    </Link>
  )
}

// ───── Past tab ─────────────────────────────────────────────────────
function PastTab({ sessions }: { sessions: SessionItem[] }) {
  if (sessions.length === 0) {
    return (
      <div style={{ padding: 20 }}>
        <p
          style={{
            fontSize: 13,
            color: 'var(--text-muted)',
            textAlign: 'center',
            padding: '40px 20px',
          }}
        >
          Your past sessions will appear here.
        </p>
      </div>
    )
  }

  return (
    <div style={{ padding: 20 }}>
      {sessions.map((s) => (
        <Link
          key={s.id}
          href={`/user/sessions/${s.id}`}
          style={{ display: 'block', marginBottom: 10 }}
        >
          <Card
            padding={14}
            style={{
              display: 'flex',
              gap: 12,
              alignItems: 'center',
            }}
          >
            <Avatar
              name={s.doctor.user.name}
              size={42}
              color="var(--accent)"
              src={s.doctor.photo ?? undefined}
            />
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 14,
                  fontWeight: 700,
                  color: 'var(--text)',
                }}
              >
                {s.doctor.user.name}
              </div>
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--text-muted)',
                  marginTop: 2,
                }}
              >
                {s.status === 'CANCELLED'
                  ? 'Cancelled'
                  : s.status === 'NO_SHOW'
                    ? 'Marked no-show'
                    : s.doctor.designation}
              </div>
            </div>
            <div
              style={{
                fontSize: 12,
                color: 'var(--text-muted)',
                fontWeight: 600,
              }}
            >
              {formatDate(s.date, { day: 'numeric', month: 'short' })}
            </div>
          </Card>
        </Link>
      ))}
    </div>
  )
}
