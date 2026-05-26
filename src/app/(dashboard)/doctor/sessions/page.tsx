'use client'

import { Suspense, useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle, Loader2, Video, UserX } from 'lucide-react'
import { formatSessionDateTime } from '@/lib/format-date'
import DoctorSessionsTabControl, {
  type DoctorSessionsTab,
} from '@/components/dashboard/doctor/sessions-tab-control'
import DoctorMobileTopBar from '@/components/dashboard/doctor/mobile-top-bar'
import MobileSessionCard from '@/components/dashboard/doctor/mobile/session-card'

interface Session {
  id: string
  date: string
  meetLink: string | null
  status: string
  paymentStatus: string
  notes: string | null
  user: { id: string; name: string; email: string; phone?: string | null }
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: '#fef9c3', text: '#854d0e' },
  CONFIRMED: { bg: '#dcfce7', text: '#166534' },
  COMPLETED: { bg: '#dbeafe', text: '#1e40af' },
  CANCELLED: { bg: '#fee2e2', text: '#991b1b' },
  NO_SHOW: { bg: '#f3f4f6', text: '#374151' },
}

function canMarkComplete(s: Session): boolean {
  if (s.status !== 'CONFIRMED') return false
  if (s.paymentStatus !== 'PAID') return false
  return Date.now() >= new Date(s.date).getTime() + 45 * 60 * 1000
}

function isActiveButTooEarly(s: Session): boolean {
  if (s.status !== 'CONFIRMED' || s.paymentStatus !== 'PAID') return false
  return !canMarkComplete(s)
}

function canMarkNoShow(s: Session): boolean {
  if (s.status !== 'CONFIRMED') return false
  return Date.now() >= new Date(s.date).getTime() + 15 * 60 * 1000
}

function isValidTab(t: string | null): t is DoctorSessionsTab {
  return t === 'today' || t === 'upcoming' || t === 'past'
}

const MOBILE_EMPTY_COPY: Record<DoctorSessionsTab, [string, string]> = {
  today:    ['No sessions today.',    'Take the morning.'],
  upcoming: ['Nothing booked yet.',   'New bookings show up here.'],
  past:     ['No past sessions yet.', 'Completed ones will appear here.'],
}

// ── Mobile counts fetch — runs once on mount and on tab transitions so
// the pill control can show the count badges. Lightweight; reuses the
// existing per-view endpoint. ──
function useTabCounts(): Record<DoctorSessionsTab, number> {
  const [counts, setCounts] = useState<Record<DoctorSessionsTab, number>>({ today: 0, upcoming: 0, past: 0 })

  useEffect(() => {
    let active = true
    Promise.all([
      fetch('/api/doctor/sessions?view=today').then((r) => r.json()),
      fetch('/api/doctor/sessions?view=upcoming').then((r) => r.json()),
      fetch('/api/doctor/sessions?view=past').then((r) => r.json()),
    ]).then(([t, u, p]) => {
      if (!active) return
      setCounts({
        today: t.success ? t.data.length : 0,
        upcoming: u.success ? u.data.length : 0,
        past: p.success ? p.data.length : 0,
      })
    }).catch(() => {})
    return () => { active = false }
  }, [])

  return counts
}

function SessionsListInner() {
  const searchParams = useSearchParams()
  const tab: DoctorSessionsTab = isValidTab(searchParams.get('tab'))
    ? (searchParams.get('tab') as DoctorSessionsTab)
    : 'upcoming'

  return (
    <>
      {/* ═══ Mobile ═══ */}
      <div className="lg:hidden">
        <DoctorMobileTopBar title="Sessions" />
        <MobilePillTabs active={tab} />
        <MobileSessionsList key={`mobile-${tab}`} tab={tab} />
      </div>

      {/* ═══ Desktop (unchanged) ═══ */}
      <div className="hidden lg:block p-4 lg:p-8 max-w-3xl mx-auto">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Sessions</h1>
        <DoctorSessionsTabControl />
        <DesktopSessionsList key={`desktop-${tab}`} tab={tab} />
      </div>
    </>
  )
}

function MobilePillTabs({ active }: { active: DoctorSessionsTab }) {
  const router = useRouter()
  const counts = useTabCounts()
  const tabs: { key: DoctorSessionsTab; label: string }[] = [
    { key: 'today', label: 'Today' },
    { key: 'upcoming', label: 'Upcoming' },
    { key: 'past', label: 'Past' },
  ]
  return (
    <div className="px-4 pt-1.5">
      <div
        className="flex rounded-full p-1"
        style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}
      >
        {tabs.map((t) => {
          const isActive = active === t.key
          return (
            <button
              key={t.key}
              onClick={() => router.replace(`/doctor/sessions?tab=${t.key}`, { scroll: false })}
              className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full text-[12.5px] font-extrabold transition-colors"
              style={{
                padding: '9px 0',
                background: isActive ? 'var(--primary)' : 'transparent',
                color: isActive ? 'var(--on-dark, var(--cream))' : 'var(--text-muted)',
              }}
            >
              {t.label}
              <span
                className="rounded-full text-[10px]"
                style={{
                  padding: '2px 6px',
                  background: isActive ? 'rgba(255,248,235,0.20)' : 'var(--bg-app)',
                  color: isActive ? 'var(--on-dark, var(--cream))' : 'var(--text-muted)',
                }}
              >
                {counts[t.key]}
              </span>
            </button>
          )
        })}
      </div>
    </div>
  )
}

function MobileSessionsList({ tab }: { tab: DoctorSessionsTab }) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    fetch(`/api/doctor/sessions?view=${tab}`)
      .then((r) => r.json())
      .then((res) => { if (active) setSessions(res.success ? res.data : []) })
      .catch(() => { if (active) setSessions([]) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [tab])

  function handleStatusChange(id: string, newStatus: 'COMPLETED' | 'NO_SHOW') {
    setSessions((prev) => prev.map((s) => s.id === id ? { ...s, status: newStatus } : s))
  }

  const [emptyTitle, emptySub] = MOBILE_EMPTY_COPY[tab]

  return (
    <section className="px-4 pt-3.5">
      {loading ? (
        <div className="grid gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-[88px] rounded-[16px] animate-pulse"
              style={{ background: 'var(--bg-card)' }}
            />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div
          className="text-center rounded-[18px]"
          style={{
            background: 'var(--bg-card)',
            boxShadow: 'var(--shadow-card)',
            padding: '40px 24px',
          }}
        >
          <div className="ms-display text-[18px]" style={{ color: 'var(--text)' }}>{emptyTitle}</div>
          <p
            className="ms-serif italic mt-2 text-[13.5px]"
            style={{ color: 'var(--text-muted)' }}
          >
            {emptySub}
          </p>
        </div>
      ) : (
        <div className="grid gap-2">
          {sessions.map((s) => (
            <MobileSessionCard
              key={s.id}
              s={{
                id: s.id,
                date: s.date,
                status: s.status as 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW',
                paymentStatus: s.paymentStatus,
                meetLink: s.meetLink,
                user: { name: s.user.name },
              }}
              onStatusChange={(newStatus) => handleStatusChange(s.id, newStatus)}
            />
          ))}
        </div>
      )}
    </section>
  )
}

function DesktopSessionsList({ tab }: { tab: DoctorSessionsTab }) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [completingId, setCompletingId] = useState<string | null>(null)
  const [markingNoShowId, setMarkingNoShowId] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    fetch(`/api/doctor/sessions?view=${tab}`)
      .then((r) => r.json())
      .then((res) => { if (active) setSessions(res.success ? res.data : []) })
      .catch(() => { if (active) setSessions([]) })
      .finally(() => { if (active) setLoading(false) })
    return () => { active = false }
  }, [tab])

  async function handleMarkComplete(sessionId: string) {
    setCompletingId(sessionId)
    try {
      const res = await fetch(`/api/doctor/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'COMPLETED' }),
      })
      const data = await res.json()
      if (data.success) {
        setSessions((prev) =>
          prev.map((s) => (s.id === sessionId ? { ...s, status: 'COMPLETED' } : s))
        )
      }
    } finally {
      setCompletingId(null)
    }
  }

  async function handleMarkNoShow(sessionId: string) {
    const confirmed = window.confirm(
      'Mark this session as no-show? The patient will not be refunded, and this cannot be undone.'
    )
    if (!confirmed) return

    setMarkingNoShowId(sessionId)
    try {
      const res = await fetch(`/api/doctor/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'NO_SHOW' }),
      })
      const data = await res.json()
      if (data.success) {
        setSessions((prev) =>
          prev.map((s) => (s.id === sessionId ? { ...s, status: 'NO_SHOW' } : s))
        )
      } else {
        alert(data.error || 'Failed to mark no-show')
      }
    } finally {
      setMarkingNoShowId(null)
    }
  }

  const emptyCopy =
    tab === 'today'
      ? 'No sessions today'
      : tab === 'past'
        ? 'No past sessions'
        : 'No upcoming sessions'

  return (
    <div>
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div
              key={i}
              className="h-24 rounded-xl bg-gray-100 animate-pulse"
            />
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <div className="flex flex-col items-center py-16 text-gray-500 text-sm">
          {emptyCopy}
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map((s) => {
            const colors = STATUS_COLORS[s.status] ?? { bg: '#f3f4f6', text: '#374151' }
            const isPast = tab === 'past'
            return (
              <div
                key={s.id}
                className="p-4 rounded-xl bg-white border border-gray-100 lg:hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 text-sm truncate">
                      {s.user.name}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {formatSessionDateTime(s.date)}
                    </p>
                  </div>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-medium shrink-0"
                    style={{ background: colors.bg, color: colors.text }}
                  >
                    {s.status}
                  </span>
                </div>

                {!isPast && s.status === 'CONFIRMED' && s.meetLink && (
                  <a
                    href={s.meetLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full font-medium text-white mt-1"
                    style={{ background: 'var(--coral)' }}
                  >
                    <Video size={12} />
                    Join
                  </a>
                )}

                {!isPast && s.status === 'CONFIRMED' && !s.meetLink && (
                  <p className="text-xs text-amber-700 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-200 mt-1">
                    Needs a Meet link — add it from{' '}
                    <a href="/doctor/calendar" className="underline font-medium">
                      Calendar
                    </a>
                  </p>
                )}

                {!isPast && canMarkComplete(s) && (
                  <button
                    onClick={() => handleMarkComplete(s.id)}
                    disabled={completingId === s.id}
                    className="w-full sm:w-auto mt-2 inline-flex items-center justify-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                  >
                    {completingId === s.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCircle className="w-3.5 h-3.5" />
                    )}
                    {completingId === s.id ? 'Marking...' : 'Mark as Completed'}
                  </button>
                )}

                {!isPast && canMarkNoShow(s) && (
                  <button
                    onClick={() => handleMarkNoShow(s.id)}
                    disabled={markingNoShowId === s.id}
                    className="w-full sm:w-auto mt-2 sm:ml-2 inline-flex items-center justify-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-gray-600 text-white font-medium hover:bg-gray-700 transition-colors disabled:opacity-50"
                  >
                    {markingNoShowId === s.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <UserX className="w-3.5 h-3.5" />
                    )}
                    {markingNoShowId === s.id ? 'Marking...' : 'Mark No-Show'}
                  </button>
                )}

                {!isPast && isActiveButTooEarly(s) && (
                  <p className="text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg mt-2 border border-amber-100">
                    Available to mark complete 45 min after session starts
                  </p>
                )}

                {s.notes && (
                  <p className="text-xs text-gray-600 italic mt-2 line-clamp-2">
                    {s.notes}
                  </p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

export default function DoctorSessionsPage() {
  return (
    <Suspense fallback={<div className="text-gray-500 text-sm">Loading…</div>}>
      <SessionsListInner />
    </Suspense>
  )
}
