'use client'

import { useEffect, useState } from 'react'
import { useParams } from 'next/navigation'
import { Check, Loader2 } from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import DoctorMobileTopBar from '@/components/dashboard/doctor/mobile-top-bar'
import {
  ASSIGNMENT_TYPE_CFG,
  ASSIGNMENT_STATUS_CFG,
} from '@/components/dashboard/doctor/mobile/assignment-row'

interface Assignment {
  id: string
  title: string
  description: string
  type?: string | null
  submissionUrl: string | null
  status: 'PENDING' | 'SUBMITTED' | 'REVIEWED' | string
  reviewNote: string | null
  dueDate: string | null
  createdAt: string
  updatedAt: string
  user: { id: string; name: string }
  /** Response text — comes through assignment.responses but the list endpoint
   *  doesn't include it; we keep this optional so the page works either way. */
  responseText?: string | null
}

export default function DoctorAssignmentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [assignment, setAssignment] = useState<Assignment | null>(null)
  const [loading, setLoading] = useState(true)
  const [reviewNote, setReviewNote] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    // No single-assignment GET endpoint exists; pull the list and filter.
    // Doctor's full assignment list is small enough that this is fine.
    fetch('/api/doctor/assignments')
      .then((r) => r.json())
      .then((res) => {
        if (!res.success) return
        const found: Assignment | undefined = res.data.find((a: Assignment) => a.id === id)
        if (found) {
          setAssignment(found)
          setReviewNote(found.reviewNote ?? '')
        }
      })
      .finally(() => setLoading(false))
  }, [id])

  async function markReviewed() {
    if (!assignment) return
    setSaving(true)
    try {
      const res = await fetch(`/api/doctor/assignments/${assignment.id}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewNote }),
      })
      const data = await res.json()
      if (data.success) {
        setAssignment({ ...assignment, status: 'REVIEWED', reviewNote, updatedAt: new Date().toISOString() })
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-8 text-gray-500">Loading…</div>
  if (!assignment) return <div className="p-8 text-gray-500">Assignment not found.</div>

  const typeKey = assignment.type ?? 'CUSTOM'
  const tcfg = ASSIGNMENT_TYPE_CFG[typeKey] ?? { label: typeKey, bg: 'var(--primary-tint)', fg: 'var(--primary)' }
  const submitted = assignment.status !== 'PENDING'
  const reviewed = assignment.status === 'REVIEWED'

  return (
    <>
      {/* ═══ Mobile ═══ */}
      <div className="lg:hidden pb-32">
        <DoctorMobileTopBar showBack title={assignment.user.name} kicker="Assignment" />

        {/* Metadata card */}
        <section className="px-4 pt-1">
          <div
            className="rounded-[18px] p-4"
            style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}
          >
            <span
              className="inline-flex items-center gap-1.5 rounded-full font-extrabold uppercase"
              style={{
                background: tcfg.bg,
                color: tcfg.fg,
                padding: '3px 9px',
                fontSize: 10.5,
                letterSpacing: '0.08em',
              }}
            >
              <span className="w-[5px] h-[5px] rounded-full" style={{ background: tcfg.fg }} />
              {tcfg.label}
            </span>
            <div
              className="ms-display text-[22px] mt-2 leading-[1.15]"
              style={{ color: 'var(--text)' }}
            >
              {assignment.title}
            </div>
            <div className="text-[12px] mt-1.5" style={{ color: 'var(--text-muted)' }}>
              {assignment.dueDate
                ? `Due ${format(new Date(assignment.dueDate), 'd MMM yyyy')}`
                : 'No due date'}
            </div>
            {assignment.description && (
              <p
                className="ms-serif text-[13.5px] leading-[1.55] mt-2.5"
                style={{ color: 'var(--text)' }}
              >
                {assignment.description}
              </p>
            )}
          </div>
        </section>

        {/* Submission */}
        <section className="px-4 pt-3.5">
          <div className="flex items-center gap-2 mb-2.5">
            <div
              className="text-[11px] font-extrabold uppercase"
              style={{ letterSpacing: '0.14em', color: 'var(--text-muted)' }}
            >
              Submission
            </div>
            {submitted && (
              <span
                className="rounded-full text-[10px] font-extrabold uppercase"
                style={{
                  padding: '2px 8px',
                  background: 'var(--bg-app)',
                  color: 'var(--text-muted)',
                  letterSpacing: '0.08em',
                }}
              >
                {formatDistanceToNow(new Date(assignment.updatedAt), { addSuffix: true })}
              </span>
            )}
          </div>
          {submitted ? (
            <div
              className="rounded-[18px] p-4"
              style={{ background: '#FFF8EB' }}
            >
              {assignment.submissionUrl ? (
                <a
                  href={assignment.submissionUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-[13px] font-extrabold"
                  style={{ color: 'var(--primary)' }}
                >
                  View attached file →
                </a>
              ) : (
                <p
                  className="ms-serif italic text-[14px] leading-[1.55]"
                  style={{ color: 'var(--text)' }}
                >
                  Patient marked this complete.
                </p>
              )}
            </div>
          ) : (
            <div
              className="text-center rounded-[16px] p-4 text-[13px]"
              style={{
                background: 'var(--bg-card)',
                boxShadow: 'var(--shadow-card)',
                color: 'var(--text-muted)',
              }}
            >
              Patient hasn’t submitted yet.
            </div>
          )}
        </section>

        {/* Review note section — for SUBMITTED only */}
        {assignment.status === 'SUBMITTED' && (
          <section className="px-4 pt-3.5">
            <div
              className="text-[11px] font-extrabold uppercase mb-2"
              style={{ letterSpacing: '0.14em', color: 'var(--text-muted)' }}
            >
              Review note
            </div>
            <div
              className="rounded-[18px] p-3"
              style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}
            >
              <textarea
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                placeholder="A line or two — what to bring up in the next session."
                className="w-full outline-none resize-none ms-serif text-[14.5px] leading-[1.55] bg-transparent"
                style={{ minHeight: 90, color: 'var(--text)' }}
              />
            </div>
          </section>
        )}

        {/* Reviewed badge */}
        {reviewed && (
          <section className="px-4 pt-3.5">
            <div
              className="rounded-[16px] p-3.5"
              style={{ background: 'var(--primary-tint)' }}
            >
              <div
                className="inline-flex items-center gap-1.5 text-[11.5px] font-extrabold uppercase"
                style={{ letterSpacing: '0.10em', color: 'var(--primary)' }}
              >
                <Check size={12} strokeWidth={2.6} /> Reviewed {formatDistanceToNow(new Date(assignment.updatedAt), { addSuffix: true })}
              </div>
              {assignment.reviewNote && (
                <p
                  className="ms-serif italic text-[14px] leading-[1.55] mt-2"
                  style={{ color: 'var(--text)' }}
                >
                  “{assignment.reviewNote}”
                </p>
              )}
            </div>
          </section>
        )}

        {/* Sticky Mark Reviewed — only for SUBMITTED */}
        {assignment.status === 'SUBMITTED' && (
          <div
            className="fixed left-0 right-0 z-30 px-4"
            style={{ bottom: 'calc(env(safe-area-inset-bottom) + 88px)' }}
          >
            <button
              onClick={markReviewed}
              disabled={saving}
              className="w-full inline-flex items-center justify-center gap-2 rounded-full text-[15px] font-extrabold disabled:opacity-60"
              style={{
                padding: 16,
                background: 'var(--accent)',
                color: 'var(--on-dark, var(--cream))',
                boxShadow: '0 8px 32px rgba(45, 90, 79, 0.18)',
              }}
            >
              {saving
                ? <Loader2 size={16} className="animate-spin" />
                : <Check size={16} strokeWidth={2.4} />}
              {saving ? 'Saving…' : 'Mark as reviewed'}
            </button>
          </div>
        )}
      </div>

      {/* ═══ Desktop (simple fallback — main review UI lives on the list page) ═══ */}
      <div className="hidden lg:block max-w-3xl mx-auto p-8">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">{assignment.title}</h1>
        <p className="text-sm text-gray-500 mb-6">
          Patient: {assignment.user.name}
          {assignment.dueDate && <> · Due: {new Date(assignment.dueDate).toLocaleDateString('en-IN')}</>}
        </p>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-4">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Type</div>
          <span
            className="inline-flex items-center text-xs px-2.5 py-1 rounded-full font-medium"
            style={{ background: tcfg.bg, color: tcfg.fg }}
          >
            {tcfg.label}
          </span>
          {assignment.description && (
            <p className="text-sm text-gray-700 mt-4 whitespace-pre-wrap">{assignment.description}</p>
          )}
        </div>

        <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100 mb-4">
          <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Status</div>
          <span
            className="inline-flex items-center text-xs px-2.5 py-1 rounded-full font-medium"
            style={{
              background: ASSIGNMENT_STATUS_CFG[assignment.status]?.bg ?? 'var(--bg-app)',
              color: ASSIGNMENT_STATUS_CFG[assignment.status]?.fg ?? 'var(--text-muted)',
            }}
          >
            {ASSIGNMENT_STATUS_CFG[assignment.status]?.label ?? assignment.status}
          </span>
          {assignment.submissionUrl && (
            <a
              href={assignment.submissionUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm font-medium block mt-3"
              style={{ color: 'var(--coral)' }}
            >
              View submission →
            </a>
          )}
        </div>

        {assignment.status === 'SUBMITTED' && (
          <div className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Review note</div>
            <textarea
              value={reviewNote}
              onChange={(e) => setReviewNote(e.target.value)}
              rows={3}
              className="w-full px-3 py-2 border rounded-lg text-gray-900"
              placeholder="A line or two — what to bring up in the next session."
            />
            <button
              onClick={markReviewed}
              disabled={saving}
              className="mt-3 px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-60"
              style={{ background: 'var(--coral)' }}
            >
              {saving ? 'Saving...' : 'Mark as reviewed'}
            </button>
          </div>
        )}

        {assignment.status === 'REVIEWED' && assignment.reviewNote && (
          <p className="text-sm text-gray-600 italic mt-4">Review: {assignment.reviewNote}</p>
        )}
      </div>
    </>
  )
}
