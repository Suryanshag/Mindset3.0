'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

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

  return (
    <div>
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
                      {new Date(s.date).toLocaleDateString('en-IN', {
                        weekday: 'short',
                        year: 'numeric',
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
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
  )
}
