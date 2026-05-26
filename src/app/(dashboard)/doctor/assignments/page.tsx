'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { Plus } from 'lucide-react'
import DoctorMobileTopBar from '@/components/dashboard/doctor/mobile-top-bar'
import AssignmentRow from '@/components/dashboard/doctor/mobile/assignment-row'
import CreateAssignmentSheet from '@/components/dashboard/doctor/mobile/create-assignment-sheet'

interface Assignment {
  id: string
  title: string
  description: string
  fileUrl: string | null
  submissionUrl: string | null
  status: string
  type?: string | null
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

type MobileFilter = 'ALL' | 'SUBMITTED' | 'REVIEWED' | 'PENDING'

const MOBILE_FILTERS: { key: MobileFilter; label: string }[] = [
  { key: 'ALL',       label: 'All' },
  { key: 'SUBMITTED', label: 'Pending review' },
  { key: 'REVIEWED',  label: 'Reviewed' },
  { key: 'PENDING',   label: 'Pending patient' },
]

export default function DoctorAssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<'all' | 'SUBMITTED' | 'REVIEWED'>('all')
  const [reviewingId, setReviewingId] = useState<string | null>(null)
  const [reviewNote, setReviewNote] = useState('')
  const [saving, setSaving] = useState(false)

  // Mobile state
  const [mobileFilter, setMobileFilter] = useState<MobileFilter>('SUBMITTED')
  const [sheetOpen, setSheetOpen] = useState(false)

  useEffect(() => {
    fetch('/api/doctor/assignments')
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setAssignments(res.data)
      })
      .finally(() => setLoading(false))
  }, [])

  const filtered = tab === 'all' ? assignments : assignments.filter((a) => a.status === tab)

  const mobileCounts = useMemo(() => ({
    ALL: assignments.length,
    SUBMITTED: assignments.filter((a) => a.status === 'SUBMITTED').length,
    REVIEWED: assignments.filter((a) => a.status === 'REVIEWED').length,
    PENDING: assignments.filter((a) => a.status === 'PENDING').length,
  }), [assignments])

  const mobileFiltered = useMemo(() => (
    mobileFilter === 'ALL'
      ? assignments
      : assignments.filter((a) => a.status === mobileFilter)
  ), [assignments, mobileFilter])

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

  if (loading) {
    return (
      <>
        <div className="lg:hidden">
          <DoctorMobileTopBar title="Assignments" />
          <div className="px-4 pt-2 grid gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-[88px] rounded-2xl animate-pulse" style={{ background: 'var(--bg-card)' }} />
            ))}
          </div>
        </div>
        <div className="hidden lg:block p-8 text-gray-500">Loading assignments...</div>
      </>
    )
  }

  return (
    <>
      {/* ═══ Mobile ═══ */}
      <div className="lg:hidden relative">
        <DoctorMobileTopBar title="Assignments" />

        {/* Filter chips — horizontal scroll if needed */}
        <div className="px-4 pt-1.5 flex gap-1.5 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
          {MOBILE_FILTERS.map(({ key, label }) => {
            const active = mobileFilter === key
            const count = mobileCounts[key]
            return (
              <button
                key={key}
                onClick={() => setMobileFilter(key)}
                className="rounded-full text-[12.5px] font-extrabold whitespace-nowrap"
                style={{
                  padding: '8px 14px',
                  background: active ? 'var(--primary)' : 'var(--bg-card)',
                  color: active ? 'var(--on-dark, var(--cream))' : 'var(--text-muted)',
                  boxShadow: active ? 'none' : 'var(--shadow-card)',
                }}
              >
                {label} <span style={{ opacity: 0.7, marginLeft: 4 }}>{count}</span>
              </button>
            )
          })}
        </div>

        <section className="px-4 pt-3.5">
          {mobileFiltered.length === 0 ? (
            <div
              className="text-center rounded-[18px]"
              style={{
                background: 'var(--bg-card)',
                boxShadow: 'var(--shadow-card)',
                padding: '40px 24px',
              }}
            >
              <div className="ms-display text-[18px]" style={{ color: 'var(--text)' }}>No assignments yet.</div>
              <p className="ms-serif italic mt-2 text-[13.5px]" style={{ color: 'var(--text-muted)' }}>
                Create one with the + button.
              </p>
            </div>
          ) : (
            <div className="grid gap-2">
              {mobileFiltered.map((a) => (
                <AssignmentRow
                  key={a.id}
                  assignment={{
                    id: a.id,
                    title: a.title,
                    status: a.status,
                    type: a.type,
                    dueDate: a.dueDate,
                    user: { name: a.user.name },
                  }}
                  onClick={() => { window.location.href = `/doctor/assignments/${a.id}` }}
                />
              ))}
            </div>
          )}
        </section>

        {/* FAB — fixed so it floats above the page; bottom-24 keeps it
            clear of the bottom-nav (which is fixed at bottom with safe-area). */}
        <button
          onClick={() => setSheetOpen(true)}
          aria-label="Create assignment"
          className="fixed right-5 z-40 w-14 h-14 rounded-full flex items-center justify-center"
          style={{
            bottom: 'calc(env(safe-area-inset-bottom) + 88px)',
            background: 'var(--accent)',
            color: 'var(--on-dark, var(--cream))',
            boxShadow: '0 12px 28px rgba(201,120,100,0.30), 0 2px 6px rgba(0,0,0,0.10)',
          }}
        >
          <Plus size={22} strokeWidth={2.4} />
        </button>

        {sheetOpen && (
          <CreateAssignmentSheet
            open={sheetOpen}
            onClose={() => setSheetOpen(false)}
            onCreated={(a) => {
              // Optimistic prepend; server response shape matches Assignment.
              setAssignments((prev) => [a as unknown as Assignment, ...prev])
              setSheetOpen(false)
            }}
          />
        )}
      </div>

      {/* ═══ Desktop (unchanged) ═══ */}
      <div className="hidden lg:block">
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
    </>
  )
}
