'use client'

import { useState, useEffect } from 'react'
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
import { ChevronLeft, ChevronRight, CheckCircle, Loader2 } from 'lucide-react'

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

export default function DoctorCalendarPage() {
  const [sessions, setSessions] = useState<Session[]>([])
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

  useEffect(() => {
    fetch('/api/doctor/sessions?view=all')
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setSessions(res.data)
      })
      .finally(() => setLoading(false))
  }, [])

  const monthStart = startOfMonth(currentMonth)
  const monthEnd = endOfMonth(currentMonth)
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const startPadding = getDay(monthStart) // 0=Sun

  const selectedSessions = selectedDate
    ? sessions.filter((s) => isSameDay(new Date(s.date), selectedDate))
    : []

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
    if (!meetLinkText.startsWith('https://meet.google.com/')) {
      setMeetLinkError('Must be a valid Google Meet link (https://meet.google.com/...)')
      return
    }
    setSavingMeetLink(true)
    try {
      const res = await fetch(`/api/doctor/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ meetLink: meetLinkText }),
      })
      const data = await res.json()
      if (data.success) {
        setSessions((prev) => prev.map((s) => (s.id === sessionId ? { ...s, meetLink: meetLinkText } : s)))
        setEditingMeetLink(null)
        setMeetLinkText('')
      }
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

  if (loading) return <div className="p-8 text-gray-500">Loading calendar...</div>

  return (
    <div>
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
              const today = isToday(day)
              const selected = selectedDate && isSameDay(day, selectedDate)
              return (
                <button
                  key={day.toISOString()}
                  onClick={() => setSelectedDate(day)}
                  className={`p-2 rounded-lg text-sm relative transition-colors ${
                    selected ? 'ring-2 ring-blue-500' : ''
                  } ${today ? 'bg-blue-50 font-bold' : 'hover:bg-gray-50'}`}
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
                return (
                  <div key={s.id} className="p-3 rounded-lg bg-gray-50">
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
                        <p className="text-xs text-amber-700 font-medium mb-1.5">No Meet link yet</p>
                        <button
                          onClick={() => {
                            setEditingMeetLink(s.id)
                            setMeetLinkText('')
                            setMeetLinkError('')
                          }}
                          className="text-xs px-2.5 py-1 rounded-lg bg-amber-500 text-white font-medium hover:bg-amber-600 transition-colors"
                        >
                          Add Meet Link
                        </button>
                      </div>
                    )}
                    {editingMeetLink === s.id && (
                      <div className="mb-2">
                        <input
                          type="url"
                          value={meetLinkText}
                          onChange={(e) => setMeetLinkText(e.target.value)}
                          placeholder="https://meet.google.com/..."
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
  )
}
