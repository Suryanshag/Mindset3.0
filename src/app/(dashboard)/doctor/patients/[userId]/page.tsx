'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { format } from 'date-fns'
import { formatSessionDateTime } from '@/lib/format-date'
import DoctorMobileTopBar from '@/components/dashboard/doctor/mobile-top-bar'
import MobileSessionCard from '@/components/dashboard/doctor/mobile/session-card'
import AssignmentRow from '@/components/dashboard/doctor/mobile/assignment-row'
import CreateAssignmentSheet from '@/components/dashboard/doctor/mobile/create-assignment-sheet'
import { Plus } from 'lucide-react'

interface PatientData {
  patient: {
    id: string
    name: string
    email: string
    phone: string | null
    createdAt: string
  }
  sessions: {
    id: string
    date: string
    meetLink: string | null
    status: string
    paymentStatus: string
    notes: string | null
    createdAt: string
  }[]
  assignments: {
    id: string
    title: string
    description: string
    fileUrl: string | null
    submissionUrl: string | null
    status: string
    reviewNote: string | null
    dueDate: string | null
    createdAt: string
  }[]
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: '#fef9c3', text: '#854d0e' },
  CONFIRMED: { bg: '#dcfce7', text: '#166534' },
  COMPLETED: { bg: '#dbeafe', text: '#1e40af' },
  CANCELLED: { bg: '#fee2e2', text: '#991b1b' },
  SUBMITTED: { bg: '#fed7aa', text: '#9a3412' },
  REVIEWED: { bg: '#d1fae5', text: '#065f46' },
}

export default function PatientDetailPage() {
  const { userId } = useParams<{ userId: string }>()
  const [data, setData] = useState<PatientData | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'sessions' | 'assignments'>('sessions')
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set())
  const [sheetOpen, setSheetOpen] = useState(false)

  useEffect(() => {
    fetch(`/api/doctor/patients/${userId}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setData(res.data)
      })
      .finally(() => setLoading(false))
  }, [userId])

  function toggleNotes(id: string) {
    setExpandedNotes((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  async function updateSessionStatus(sessionId: string, status: string) {
    const res = await fetch(`/api/doctor/sessions/${sessionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    const result = await res.json()
    if (result.success && data) {
      setData({
        ...data,
        sessions: data.sessions.map((s) =>
          s.id === sessionId ? { ...s, status } : s
        ),
      })
    }
  }

  if (loading) return <div className="p-8 text-gray-500">Loading patient...</div>
  if (!data) return <div className="p-8 text-gray-500">Patient not found.</div>

  const { patient, sessions, assignments } = data
  const joinedKicker = `Since ${format(new Date(patient.createdAt), 'MMM yyyy')}`

  return (
    <>
      {/* ═══ Mobile ═══ */}
      <div className="lg:hidden">
        <DoctorMobileTopBar showBack title={patient.name} kicker={joinedKicker} />

        {/* Tab pills */}
        <div className="px-4 pt-1.5">
          <div
            className="flex rounded-full p-1"
            style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}
          >
            {([
              ['sessions', 'Sessions', sessions.length],
              ['assignments', 'Assignments', assignments.length],
            ] as const).map(([k, l, n]) => {
              const active = tab === k
              return (
                <button
                  key={k}
                  onClick={() => setTab(k)}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full text-[12.5px] font-extrabold transition-colors"
                  style={{
                    padding: '9px 0',
                    background: active ? 'var(--primary)' : 'transparent',
                    color: active ? 'var(--on-dark, var(--cream))' : 'var(--text-muted)',
                  }}
                >
                  {l}
                  <span
                    className="rounded-full text-[10px]"
                    style={{
                      padding: '2px 6px',
                      background: active ? 'rgba(255,248,235,0.20)' : 'var(--bg-app)',
                      color: active ? 'var(--on-dark, var(--cream))' : 'var(--text-muted)',
                    }}
                  >
                    {n}
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Sessions tab */}
        {tab === 'sessions' && (
          <section className="px-4 pt-3.5 grid gap-2">
            {sessions.length === 0 ? (
              <EmptyTab title="No sessions yet." sub="Booked sessions will appear here." />
            ) : (
              sessions.map((s) => {
                const isOpen = expandedNotes.has(s.id)
                return (
                  <div key={s.id} className="grid gap-2">
                    <MobileSessionCard
                      s={{
                        id: s.id,
                        date: s.date,
                        status: s.status as 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW',
                        paymentStatus: s.paymentStatus,
                        meetLink: s.meetLink,
                        user: { name: patient.name },
                      }}
                      onClick={() => toggleNotes(s.id)}
                      onStatusChange={(newStatus) => {
                        // MobileSessionCard already PATCHed; just sync local state.
                        setData((prev) => prev ? {
                          ...prev,
                          sessions: prev.sessions.map((sess) =>
                            sess.id === s.id ? { ...sess, status: newStatus } : sess
                          ),
                        } : prev)
                      }}
                    />
                    {isOpen && s.notes && (
                      <div
                        className="rounded-2xl px-3.5 py-3"
                        style={{ background: 'var(--bg-app)' }}
                      >
                        <div
                          className="text-[10.5px] font-extrabold uppercase mb-1.5"
                          style={{ letterSpacing: '0.14em', color: 'var(--text-muted)' }}
                        >
                          Your notes
                        </div>
                        <p
                          className="ms-serif italic text-[13.5px] leading-[1.55]"
                          style={{ color: 'var(--text)' }}
                        >
                          “{s.notes}”
                        </p>
                      </div>
                    )}
                    {isOpen && !s.notes && (
                      <div
                        className="rounded-2xl px-3.5 py-3 text-[12px]"
                        style={{ background: 'var(--bg-app)', color: 'var(--text-muted)' }}
                      >
                        No notes yet. Add them from Calendar.
                      </div>
                    )}
                  </div>
                )
              })
            )}
          </section>
        )}

        {/* Assignments tab */}
        {tab === 'assignments' && (
          <section className="px-4 pt-3.5 grid gap-2">
            {assignments.length === 0 && (
              <EmptyTab title="No assignments yet." sub="Tap the button below to start." />
            )}
            {assignments.map((a) => (
              <AssignmentRow
                key={a.id}
                assignment={{
                  id: a.id,
                  title: a.title,
                  status: a.status,
                  dueDate: a.dueDate,
                  type: 'type' in a ? (a as { type?: string | null }).type ?? 'CUSTOM' : 'CUSTOM',
                  secondaryLine: a.dueDate
                    ? `Due ${format(new Date(a.dueDate), 'd MMM')}`
                    : 'No due date',
                }}
                onClick={() => { /* detail wiring */ }}
              />
            ))}
            <button
              onClick={() => setSheetOpen(true)}
              className="inline-flex items-center justify-center gap-2 rounded-full text-[13px] font-extrabold mt-1"
              style={{
                padding: 14,
                background: 'transparent',
                color: 'var(--accent)',
                border: '1.5px dashed var(--accent-tint)',
              }}
            >
              <Plus size={14} strokeWidth={2.2} /> Assign new work
            </button>
          </section>
        )}

        {/* Privacy footer — deliberate trust signal */}
        <p
          className="text-center text-[10.5px] mt-4 px-6"
          style={{ color: 'var(--text-faint)' }}
        >
          Patient privacy: you see only sessions and assignment responses.
        </p>

        {sheetOpen && (
          <CreateAssignmentSheet
            open={sheetOpen}
            onClose={() => setSheetOpen(false)}
            patientPreset={{ id: patient.id, name: patient.name }}
            onCreated={(newAssignment) => {
              // Sheet's response shape is narrower than the patient-detail
              // shape — fill missing fields with defaults so the row renders.
              setData({
                ...data,
                assignments: [
                  {
                    id: newAssignment.id,
                    title: newAssignment.title,
                    description: '',
                    fileUrl: null,
                    submissionUrl: null,
                    status: newAssignment.status,
                    reviewNote: null,
                    dueDate: newAssignment.dueDate ?? null,
                    createdAt: new Date().toISOString(),
                  },
                  ...assignments,
                ],
              })
              setSheetOpen(false)
            }}
          />
        )}
      </div>

      {/* ═══ Desktop (unchanged) ═══ */}
      <div className="hidden lg:block">
      {/* Patient Header */}
      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{patient.name}</h1>
        <div className="flex flex-wrap gap-4 text-sm text-gray-600">
          <p>{patient.email}</p>
          {patient.phone && <p>{patient.phone}</p>}
          <p>Joined: {new Date(patient.createdAt).toLocaleDateString('en-IN')}</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        {(['sessions', 'assignments'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t ? 'text-white' : 'bg-white text-gray-700 border border-gray-200'
            }`}
            style={tab === t ? { background: 'var(--coral)' } : undefined}
          >
            {t === 'sessions' ? `Sessions (${sessions.length})` : `Assignments (${assignments.length})`}
          </button>
        ))}
      </div>

      {tab === 'sessions' && (
        <div className="space-y-3">
          {sessions.length === 0 ? (
            <p className="text-gray-500">No sessions found.</p>
          ) : (
            sessions.map((s) => {
              const colors = STATUS_COLORS[s.status] ?? { bg: '#f3f4f6', text: '#374151' }
              return (
                <div key={s.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-gray-900">
                      {formatSessionDateTime(s.date)}
                    </p>
                    <span
                      className="text-xs px-2 py-1 rounded-full font-medium"
                      style={{ background: colors.bg, color: colors.text }}
                    >
                      {s.status}
                    </span>
                  </div>
                  {s.notes && (
                    <div className="mb-2">
                      <button
                        onClick={() => toggleNotes(s.id)}
                        className="text-xs text-blue-600 hover:underline"
                      >
                        {expandedNotes.has(s.id) ? 'Hide notes' : 'Show notes'}
                      </button>
                      {expandedNotes.has(s.id) && (
                        <p className="text-sm text-gray-600 mt-1 whitespace-pre-wrap">{s.notes}</p>
                      )}
                    </div>
                  )}
                  <div className="flex gap-2">
                    {s.status === 'PENDING' && (
                      <button
                        onClick={() => updateSessionStatus(s.id, 'CONFIRMED')}
                        className="text-xs px-3 py-1 rounded-full bg-green-100 text-green-800 font-medium"
                      >
                        Confirm
                      </button>
                    )}
                    {s.status === 'CONFIRMED' && (
                      <button
                        onClick={() => updateSessionStatus(s.id, 'COMPLETED')}
                        className="text-xs px-3 py-1 rounded-full bg-blue-100 text-blue-800 font-medium"
                      >
                        Mark Completed
                      </button>
                    )}
                    {(s.status === 'PENDING' || s.status === 'CONFIRMED') && (
                      <button
                        onClick={() => updateSessionStatus(s.id, 'CANCELLED')}
                        className="text-xs px-3 py-1 rounded-full bg-red-100 text-red-800 font-medium"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              )
            })
          )}
        </div>
      )}

      {tab === 'assignments' && (
        <div>
          <Link
            href={`/doctor/assignments/create?userId=${patient.id}`}
            className="inline-block mb-4 px-4 py-2 rounded-lg text-sm font-medium text-white"
            style={{ background: 'var(--coral)' }}
          >
            Create New Assignment
          </Link>
          <div className="space-y-3">
            {assignments.length === 0 ? (
              <p className="text-gray-500">No assignments found.</p>
            ) : (
              assignments.map((a) => {
                const colors = STATUS_COLORS[a.status] ?? { bg: '#f3f4f6', text: '#374151' }
                return (
                  <div key={a.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between mb-2">
                      <p className="font-medium text-gray-900">{a.title}</p>
                      <span
                        className="text-xs px-2 py-1 rounded-full font-medium"
                        style={{ background: colors.bg, color: colors.text }}
                      >
                        {a.status}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">{a.description}</p>
                    {a.dueDate && (
                      <p className="text-xs text-gray-500">Due: {new Date(a.dueDate).toLocaleDateString('en-IN')}</p>
                    )}
                    <div className="flex gap-2 mt-2">
                      {a.fileUrl && (
                        <a href={a.fileUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                          View File
                        </a>
                      )}
                      {a.submissionUrl && (
                        <a href={a.submissionUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-blue-600 hover:underline">
                          View Submission
                        </a>
                      )}
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
      </div>
    </>
  )
}

function EmptyTab({ title, sub }: { title: string; sub: string }) {
  return (
    <div
      className="text-center rounded-[18px]"
      style={{
        background: 'var(--bg-card)',
        boxShadow: 'var(--shadow-card)',
        padding: '32px 20px',
      }}
    >
      <div className="ms-display text-[17px]" style={{ color: 'var(--text)' }}>{title}</div>
      <p className="ms-serif italic mt-1.5 text-[13px]" style={{ color: 'var(--text-muted)' }}>{sub}</p>
    </div>
  )
}
