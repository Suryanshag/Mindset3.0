'use client'

import { useState, useEffect, useRef } from 'react'
import { useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { formatSessionTime } from '@/lib/format-date'
import {
  startOfMonth,
  endOfMonth,
  eachDayOfInterval,
  format,
  isSameDay,
  isToday,
  getDay,
  addMonths,
  subMonths,
} from 'date-fns'
import { ChevronLeft, ChevronRight, CheckCircle, Loader2, X, UserX } from 'lucide-react'
import DoctorMobileTopBar from '@/components/dashboard/doctor/mobile-top-bar'
import DaySheet from '@/components/dashboard/doctor/mobile/day-sheet'
import { STATUS_CFG as MOBILE_STATUS_CFG } from '@/components/dashboard/doctor/mobile/status-badge'
import { startOfDayIST, startOfNextDayIST } from '@/lib/format-date'

interface Leave {
  id: string
  startDate: string
  endDate: string
}

function dayIsOnLeave(d: Date, leaves: Leave[]): boolean {
  const dayStart = startOfDayIST(d)
  return leaves.some((l) => {
    const ls = startOfDayIST(l.startDate)
    const le = startOfNextDayIST(l.endDate)
    return dayStart >= ls && dayStart < le
  })
}

const MEET_TIP_STORAGE_KEY = 'mindset.meetLinkTip.dismissed'

const ALLOWED_MEET_HOSTS = ['meet.google.com', 'zoom.us', 'whereby.com']

function validateMeetUrl(url: string): string | null {
  if (!url.startsWith('https://')) return 'Link must start with https://'
  if (!ALLOWED_MEET_HOSTS.some((h) => url.includes(h))) {
    return 'Must be a Google Meet, Zoom, or Whereby link'
  }
  return null
}

interface Session {
  id: string
  date: string
  meetLink: string | null
  status: string
  paymentStatus: string
  notes: string | null
  user: { id: string; name: string; email: string }
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
  const sessionStart = new Date(s.date)
  const fortyFiveMinAfter = new Date(sessionStart.getTime() + 45 * 60 * 1000)
  return new Date() >= fortyFiveMinAfter
}

function isActiveButTooEarly(s: Session): boolean {
  if (s.status !== 'CONFIRMED' || s.paymentStatus !== 'PAID') return false
  return !canMarkComplete(s)
}

function canMarkNoShow(s: Session): boolean {
  if (s.status !== 'CONFIRMED') return false
  const start = new Date(s.date).getTime()
  return Date.now() >= start + 15 * 60 * 1000
}

export default function DoctorCalendarPage() {
  const searchParams = useSearchParams()
  const highlightId = searchParams.get('highlight')

  const [sessions, setSessions] = useState<Session[]>([])
  const [leaves, setLeaves] = useState<Leave[]>([])
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [editingNotes, setEditingNotes] = useState<string | null>(null)
  const [notesText, setNotesText] = useState('')
  const [savingNotes, setSavingNotes] = useState(false)
  const [editingMeetLink, setEditingMeetLink] = useState<string | null>(null)
  const [meetLinkText, setMeetLinkText] = useState('')
  const [savingMeetLink, setSavingMeetLink] = useState(false)
  const [meetLinkError, setMeetLinkError] = useState('')
  const [completingId, setCompletingId] = useState<string | null>(null)
  const [markingNoShowId, setMarkingNoShowId] = useState<string | null>(null)
  const [tipDismissed, setTipDismissed] = useState(true) // default true until we read storage
  const highlightAppliedRef = useRef(false)
  const highlightedSessionRef = useRef<HTMLDivElement | null>(null)

  useEffect(() => {
    fetch('/api/doctor/sessions?view=all')
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setSessions(res.data)
      })
      .finally(() => setLoading(false))
  }, [])

  // Leaves drive the coral on-leave dot on the mobile month grid.
  useEffect(() => {
    fetch('/api/doctor/leaves')
      .then((r) => r.json())
      .then((res) => { if (res.success) setLeaves(res.data) })
      .catch(() => {})
  }, [])

  // Read tip-dismissed flag once on mount.
  useEffect(() => {
    try {
      setTipDismissed(localStorage.getItem(MEET_TIP_STORAGE_KEY) === '1')
    } catch {
      // localStorage unavailable — keep dismissed (default true) so tip
      // doesn't show indefinitely in privacy modes.
    }
  }, [])

  // Highlight from email link: select the session's date and auto-open
  // the Add Meet Link editor for that session.
  useEffect(() => {
    if (!highlightId || highlightAppliedRef.current) return
    const target = sessions.find((s) => s.id === highlightId)
    if (!target) return
    highlightAppliedRef.current = true
    const d = new Date(target.date)
    setSelectedDate(d)
    setCurrentMonth(d)
    if (!target.meetLink) {
      setEditingMeetLink(target.id)
      setMeetLinkText('')
      setMeetLinkError('')
    }
  }, [highlightId, sessions])

  // After the highlighted session renders, scroll it into view once.
  useEffect(() => {
    if (highlightedSessionRef.current && highlightAppliedRef.current) {
      highlightedSessionRef.current.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [selectedDate, sessions, editingMeetLink])

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const startPadding = getDay(monthStart) // 0=Sun

  // CONFIRMED sessions missing a Meet link surface to top within their day.
  const selectedSessions = selectedDate
    ? sessions
        .filter((s) => isSameDay(new Date(s.date), selectedDate))
        .slice()
        .sort((a, b) => {
          const aPending = a.status === 'CONFIRMED' && !a.meetLink ? 0 : 1
          const bPending = b.status === 'CONFIRMED' && !b.meetLink ? 0 : 1
          return aPending - bPending
        })
    : []

  function dismissTip() {
    try {
      localStorage.setItem(MEET_TIP_STORAGE_KEY, '1')
    } catch {
      // ignore
    }
    setTipDismissed(true)
  }

  async function saveNotes(sessionId: string) {
    setSavingNotes(true)
    try {
      const res = await fetch(`/api/doctor/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: notesText }),
      })
      const data = await res.json()
      if (data.success) {
        setSessions((prev) => prev.map((s) => (s.id === sessionId ? { ...s, notes: notesText } : s)))
        setEditingNotes(null)
      }
    } finally {
      setSavingNotes(false)
    }
  }

  async function saveMeetLink(sessionId: string) {
    setMeetLinkError('')
    const validationError = validateMeetUrl(meetLinkText.trim())
    if (validationError) {
      setMeetLinkError(validationError)
      return
    }
    setSavingMeetLink(true)
    try {
      const trimmed = meetLinkText.trim()
      const res = await fetch(`/api/doctor/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetLink: trimmed }),
      })
      const data = await res.json()
      if (data.success) {
        setSessions((prev) => prev.map((s) => (s.id === sessionId ? { ...s, meetLink: trimmed } : s)))
        setEditingMeetLink(null)
        setMeetLinkText('')
        toast.success('Link added. The user can now see it on their dashboard.')
      } else {
        toast.error(data.error ?? 'Failed to save link')
      }
    } catch {
      toast.error('Failed to save link')
    } finally {
      setSavingMeetLink(false)
    }
  }

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
        toast.error(data.error || 'Failed to mark no-show')
      }
    } finally {
      setMarkingNoShowId(null)
    }
  }

  // ── Mobile helpers (used by mobile day-sheet) ──
  async function mobileSaveNotes(sessionId: string, notes: string): Promise<boolean> {
    try {
      const res = await fetch(`/api/doctor/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      })
      const data = await res.json()
      if (data.success) {
        setSessions((prev) => prev.map((s) => (s.id === sessionId ? { ...s, notes } : s)))
        return true
      }
      return false
    } catch { return false }
  }
  async function mobileMarkStatus(sessionId: string, status: 'COMPLETED' | 'NO_SHOW'): Promise<boolean> {
    try {
      const res = await fetch(`/api/doctor/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const data = await res.json()
      if (data.success) {
        setSessions((prev) => prev.map((s) => (s.id === sessionId ? { ...s, status } : s)))
        return true
      }
      toast.error(data.error || `Failed to mark ${status.toLowerCase()}`)
      return false
    } catch { return false }
  }

  if (loading) return <div className="p-8 text-gray-500">Loading calendar...</div>

  return (
    <>
      {/* ═══ Mobile Layout (Sprint 2A) ═══ */}
      <div className="lg:hidden">
        <DoctorMobileTopBar title="Calendar" />

        <div className="px-4 mt-1">
          <div className="flex items-center mb-2.5">
            <button
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              aria-label="Previous month"
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}
            >
              <ChevronLeft size={14} strokeWidth={2} />
            </button>
            <div className="ms-display text-[22px] mx-auto" style={{ color: 'var(--text)' }}>
              {format(currentMonth, 'MMMM yyyy')}
            </div>
            <button
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              aria-label="Next month"
              className="w-8 h-8 rounded-full flex items-center justify-center"
              style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}
            >
              <ChevronRight size={14} strokeWidth={2} />
            </button>
          </div>
        </div>

        <div className="px-2">
          <div className="grid grid-cols-7 gap-0.5 px-2 pb-1.5">
            {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((d, i) => (
              <div
                key={i}
                className="text-center text-[10.5px] font-extrabold uppercase py-1"
                style={{ letterSpacing: '0.10em', color: 'var(--text-muted)' }}
              >
                {d}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1 px-2">
            {Array.from({ length: startPadding }).map((_, i) => (
              <div key={`m-pad-${i}`} className="aspect-square" />
            ))}
            {days.map((day) => {
              const daySessions = sessions.filter((s) => isSameDay(new Date(s.date), day))
              const onLeave = dayIsOnLeave(day, leaves)
              const today = isToday(day)
              return (
                <button
                  key={`m-${day.toISOString()}`}
                  onClick={() => setSelectedDate(day)}
                  className="aspect-square rounded-[10px] p-1 relative flex flex-col items-stretch"
                  style={{
                    background: 'var(--bg-card)',
                    border: today ? '2px solid var(--navy)' : '1px solid var(--border)',
                  }}
                >
                  <div className="text-[11.5px] font-bold" style={{ color: 'var(--text)' }}>
                    {format(day, 'd')}
                  </div>
                  <div className="flex-1 flex items-end justify-start gap-[2px] flex-wrap">
                    {daySessions.slice(0, 4).map((s) => (
                      <span
                        key={s.id}
                        className="w-[5px] h-[5px] rounded-full"
                        style={{ background: MOBILE_STATUS_CFG[s.status as keyof typeof MOBILE_STATUS_CFG]?.dot ?? 'var(--primary)' }}
                      />
                    ))}
                    {daySessions.length > 4 && (
                      <span
                        className="text-[8px] font-extrabold"
                        style={{ color: 'var(--text-muted)' }}
                      >
                        +{daySessions.length - 4}
                      </span>
                    )}
                  </div>
                  {onLeave && (
                    <span
                      className="absolute top-[3px] right-[3px] w-[5px] h-[5px] rounded-full"
                      style={{ background: 'var(--accent)' }}
                      title="On leave"
                    />
                  )}
                </button>
              )
            })}
          </div>

          {/* Legend */}
          <div
            className="flex flex-wrap gap-2.5 px-3.5 pt-3.5 pb-1 text-[10.5px]"
            style={{ color: 'var(--text-muted)' }}
          >
            {Object.entries(MOBILE_STATUS_CFG).map(([k, c]) => (
              <span key={k} className="inline-flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full" style={{ background: c.dot }} />
                {c.label}
              </span>
            ))}
            <span className="inline-flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent)' }} />
              On leave
            </span>
          </div>
        </div>

        {selectedDate && (
          <DaySheet
            day={selectedDate}
            sessions={sessions
              .filter((s) => isSameDay(new Date(s.date), selectedDate))
              .map((s) => ({
                id: s.id,
                date: s.date,
                meetLink: s.meetLink,
                status: s.status as 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW',
                paymentStatus: s.paymentStatus,
                notes: s.notes,
                user: s.user,
              }))}
            onClose={() => setSelectedDate(null)}
            onSaveNotes={mobileSaveNotes}
            onMarkStatus={mobileMarkStatus}
          />
        )}
      </div>

      {/* ═══ Desktop Layout (unchanged) ═══ */}
      <div className="hidden lg:block">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Calendar</h1>

      <div className="flex gap-6 flex-col lg:flex-row">
        {/* Calendar Grid */}
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 flex-1">
          <div className="flex items-center justify-between mb-4">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1 hover:bg-gray-100 rounded">
              <ChevronLeft size={20} />
            </button>
            <h2 className="text-lg font-semibold text-gray-900">
              {format(currentMonth, 'MMMM yyyy')}
            </h2>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1 hover:bg-gray-100 rounded">
              <ChevronRight size={20} />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="text-center text-xs font-medium text-gray-500 py-2">
                {d}
              </div>
            ))}
            {Array.from({ length: startPadding }).map((_, i) => (
              <div key={`pad-${i}`} />
            ))}
            {days.map((day) => {
              const daySessions = sessions.filter((s) => isSameDay(new Date(s.date), day))
              const hasPendingLink = daySessions.some(
                (s) => s.status === 'CONFIRMED' && !s.meetLink
              )
              const today = isToday(day)
              const selected = selectedDate && isSameDay(day, selectedDate)
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={`p-2 rounded-lg text-sm relative transition-colors ${
                    selected ? 'ring-2 ring-blue-500' : ''
                  } ${
                    hasPendingLink && !selected ? 'ring-1 ring-amber-400' : ''
                  } ${today ? 'bg-blue-50 font-bold' : 'hover:bg-gray-50'}`}
                  title={hasPendingLink ? 'Session needs a Meet link' : undefined}
                >
                  {format(day, 'd')}
                  {daySessions.length > 0 && (
                    <div className="flex gap-0.5 justify-center mt-1">
                      {daySessions.slice(0, 3).map((s) => (
                        <span
                          key={s.id}
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ background: STATUS_COLORS[s.status]?.text ?? '#6b7280' }}
                        />
                      ))}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Side Panel */}
        <div className="w-full lg:w-96 bg-white rounded-xl p-6 shadow-sm border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            {selectedDate ? format(selectedDate, 'EEEE, MMM d') : 'Select a day'}
          </h3>
          {!selectedDate ? (
            <p className="text-gray-500 text-sm">Click on a day to see sessions.</p>
          ) : selectedSessions.length === 0 ? (
            <p className="text-gray-500 text-sm">No sessions on this day.</p>
          ) : (
            <div className="space-y-3">
              {selectedSessions.map((s) => {
                const colors = STATUS_COLORS[s.status] ?? { bg: '#f3f4f6', text: '#374151' }
                const isHighlighted = highlightId === s.id
                return (
                  <div
                    key={s.id}
                    ref={isHighlighted ? highlightedSessionRef : undefined}
                    className={`p-3 rounded-lg bg-gray-50 ${
                      isHighlighted ? 'ring-2 ring-amber-400' : ''
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-gray-900 text-sm">{s.user.name}</p>
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: colors.bg, color: colors.text }}
                      >
                        {s.status}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mb-2">
                      {formatSessionTime(s.date)}
                    </p>

                    {/* Meet link section */}
                    {s.status === 'CONFIRMED' && s.meetLink && (
                      <div className="flex items-center gap-2 mb-2">
                        <a
                          href={s.meetLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs px-3 py-1 rounded-full font-medium text-white inline-block"
                          style={{ background: 'var(--coral)' }}
                        >
                          Join
                        </a>
                        <button
                          onClick={() => {
                            setEditingMeetLink(s.id)
                            setMeetLinkText(s.meetLink ?? '')
                            setMeetLinkError('')
                          }}
                          className="text-xs text-blue-600 hover:underline"
                        >
                          Update Link
                        </button>
                      </div>
                    )}
                    {s.status === 'CONFIRMED' && !s.meetLink && editingMeetLink !== s.id && (
                      <div className="mb-2 p-2 bg-amber-50 rounded-lg border border-amber-200">
                        <p className="text-xs text-amber-700 font-medium mb-1.5">🔗 Needs Meet link</p>
                        <div className="flex items-start gap-2">
                          <button
                            onClick={() => {
                              setEditingMeetLink(s.id)
                              setMeetLinkText('')
                              setMeetLinkError('')
                            }}
                            className="text-xs px-2.5 py-1 rounded-lg bg-amber-500 text-white font-medium hover:bg-amber-600 transition-colors shrink-0"
                          >
                            Add Meet Link
                          </button>
                          {!tipDismissed && (
                            <div className="relative flex-1 max-w-xs text-[11px] text-gray-700 bg-white border border-gray-200 rounded-lg p-2 pr-6 leading-snug">
                              <button
                                type="button"
                                aria-label="Dismiss tip"
                                onClick={dismissTip}
                                className="absolute top-1 right-1 p-0.5 text-gray-400 hover:text-gray-700"
                              >
                                <X size={12} />
                              </button>
                              Open meet.google.com → New meeting → Create for later → Copy URL → Paste here
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                    {editingMeetLink === s.id && (
                      <div className="mb-2">
                        <input
                          type="url"
                          value={meetLinkText}
                          onChange={(e) => setMeetLinkText(e.target.value)}
                          placeholder="https://meet.google.com/... or Zoom/Whereby link"
                          className="w-full text-xs px-2 py-1 border rounded text-gray-900 mb-1"
                        />
                        {meetLinkError && (
                          <p className="text-xs text-red-600 mb-1">{meetLinkError}</p>
                        )}
                        <div className="flex gap-2">
                          <button
                            onClick={() => saveMeetLink(s.id)}
                            disabled={savingMeetLink}
                            className="text-xs px-2 py-1 rounded bg-blue-600 text-white"
                          >
                            {savingMeetLink ? 'Saving...' : 'Save'}
                          </button>
                          <button
                            onClick={() => {
                              setEditingMeetLink(null)
                              setMeetLinkError('')
                            }}
                            className="text-xs px-2 py-1 rounded bg-gray-200 text-gray-700"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Mark as Complete */}
                    {canMarkComplete(s) && (
                      <button
                        onClick={() => handleMarkComplete(s.id)}
                        disabled={completingId === s.id}
                        className="w-full mt-2 flex items-center justify-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
                      >
                        {completingId === s.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <CheckCircle className="w-3.5 h-3.5" />
                        )}
                        {completingId === s.id ? 'Marking...' : 'Mark as Completed'}
                      </button>
                    )}
                    {canMarkNoShow(s) && (
                      <button
                        onClick={() => handleMarkNoShow(s.id)}
                        disabled={markingNoShowId === s.id}
                        className="w-full mt-2 flex items-center justify-center gap-1.5 text-xs px-3 py-2 rounded-lg bg-gray-600 text-white font-medium hover:bg-gray-700 transition-colors disabled:opacity-50"
                      >
                        {markingNoShowId === s.id ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <UserX className="w-3.5 h-3.5" />
                        )}
                        {markingNoShowId === s.id ? 'Marking...' : 'Mark No-Show'}
                      </button>
                    )}
                    {isActiveButTooEarly(s) && (
                      <p className="text-xs text-amber-600 bg-amber-50 px-3 py-2 rounded-lg mt-2 border border-amber-100">
                        Available to mark complete 45 min after session starts
                      </p>
                    )}

                    {/* Notes */}
                    {editingNotes === s.id ? (
                      <div className="mt-2">
                        <textarea
                          value={notesText}
                          onChange={(e) => setNotesText(e.target.value)}
                          rows={3}
                          className="w-full text-xs px-2 py-1 border rounded text-gray-900"
                        />
                        <div className="flex gap-2 mt-1">
                          <button
                            onClick={() => saveNotes(s.id)}
                            disabled={savingNotes}
                            className="text-xs px-2 py-1 rounded bg-blue-600 text-white"
                          >
                            {savingNotes ? 'Saving...' : 'Save'}
                          </button>
                          <button onClick={() => setEditingNotes(null)} className="text-xs px-2 py-1 rounded bg-gray-200 text-gray-700">
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        onClick={() => {
                          setEditingNotes(s.id)
                          setNotesText(s.notes ?? '')
                        }}
                        className="text-xs text-blue-600 hover:underline mt-2"
                      >
                        {s.notes ? 'Edit Notes' : 'Add Notes'}
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
      </div>
    </>
  )
}
