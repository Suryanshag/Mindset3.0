'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Assignment {
  id: string
  title: string
  description: string
  fileUrl: string | null
  submissionUrl: string | null
  status: string
  reviewNote: string | null
  dueDate: string | null
  createdAt: string
  user: { id: string; name: string; email: string }
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: '#fef9c3', text: '#854d0e' },
  SUBMITTED: { bg: '#fed7aa', text: '#9a3412' },
  REVIEWED: { bg: '#d1fae5', text: '#065f46' },
}

export default function DoctorAssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'all' | 'SUBMITTED' | 'REVIEWED'>('all')
  const [reviewingId, setReviewingId] = useState<string | null>(null)
  const [reviewNote, setReviewNote] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch('/api/doctor/assignments')
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setAssignments(res.data)
      })
      .finally(() => setLoading(false))
  }, [])

  const filtered = tab === 'all' ? assignments : assignments.filter((a) => a.status === tab)

  async function markReviewed(id: string) {
    setSaving(true)
    try {
      const res = await fetch(`/api/doctor/assignments/${id}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewNote }),
      })
      const data = await res.json()
      if (data.success) {
        setAssignments((prev) =>
          prev.map((a) => (a.id === id ? { ...a, status: 'REVIEWED', reviewNote } : a))
        )
        setReviewingId(null)
        setReviewNote('')
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-8 text-gray-500">Loading assignments...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Assignments</h1>
        <Link
          href="/doctor/assignments/create"
          className="px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ background: 'var(--coral)' }}
        >
          Create New
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-3 mb-6">
        {([['all', 'All'], ['SUBMITTED', 'Pending Review'], ['REVIEWED', 'Reviewed']] as const).map(
          ([key, label]) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === key ? 'text-white' : 'bg-white text-gray-700 border border-gray-200'
              }`}
              style={tab === key ? { background: 'var(--coral)' } : undefined}
            >
              {label}
            </button>
          )
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="text-gray-500">No assignments found.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((a) => {
            const colors = STATUS_COLORS[a.status] ?? { bg: '#f3f4f6', text: '#374151' }
            return (
              <div key={a.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-gray-900">{a.title}</p>
                    <p className="text-sm text-gray-500">
                      Patient: {a.user.name}
                      {a.dueDate && <> &middot; Due: {new Date(a.dueDate).toLocaleDateString('en-IN')}</>}
                    </p>
                  </div>
                  <span
                    className="text-xs px-2 py-1 rounded-full font-medium"
                    style={{ background: colors.bg, color: colors.text }}
                  >
                    {a.status}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-3 line-clamp-2">{a.description}</p>
                <div className="flex flex-wrap gap-3">
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
                  {a.status === 'SUBMITTED' && reviewingId !== a.id && (
                    <button
                      onClick={() => {
                        setReviewingId(a.id)
                        setReviewNote('')
                      }}
                      className="text-xs px-3 py-1 rounded-full bg-green-100 text-green-800 font-medium"
                    >
                      Mark as Reviewed
                    </button>
                  )}
                </div>
                {reviewingId === a.id && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <textarea
                      value={reviewNote}
                      onChange={(e) => setReviewNote(e.target.value)}
                      placeholder="Add a review note (optional)..."
                      rows={2}
                      className="w-full text-sm px-3 py-2 border rounded-lg text-gray-900 mb-2"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => markReviewed(a.id)}
                        disabled={saving}
                        className="text-xs px-3 py-1 rounded bg-green-600 text-white font-medium"
                      >
                        {saving ? 'Saving...' : 'Confirm Review'}
                      </button>
                      <button
                        onClick={() => setReviewingId(null)}
                        className="text-xs px-3 py-1 rounded bg-gray-200 text-gray-700"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
                {a.reviewNote && a.status === 'REVIEWED' && (
                  <p className="mt-2 text-sm text-gray-600 italic">Review: {a.reviewNote}</p>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
