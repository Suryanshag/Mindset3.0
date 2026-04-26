'use client'

import { useState, useEffect, useRef } from 'react'
import { format, isPast } from 'date-fns'
import { uploadToCloudinary } from '@/lib/cloudinary-upload'

interface Assignment {
  id: string
  title: string
  description: string
  fileUrl: string | null
  submissionUrl: string | null
  status: string
  dueDate: string | null
  createdAt: string
  doctor: {
    designation: string
    user: { name: string }
  }
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: '#FEF3C7', text: '#92400E' },
  SUBMITTED: { bg: '#DBEAFE', text: '#1E40AF' },
  REVIEWED: { bg: '#D1FAE5', text: '#065F46' },
}

const TABS = ['All', 'Pending', 'Submitted', 'Reviewed'] as const

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([])
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState<string>('All')
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [uploading, setUploading] = useState<string | null>(null)
  const fileRefs = useRef<Record<string, HTMLInputElement | null>>({})

  useEffect(() => {
    fetch('/api/user/assignments')
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setAssignments(res.data)
      })
      .finally(() => setLoading(false))
  }, [])

  const filtered =
    tab === 'All'
      ? assignments
      : assignments.filter((a) => a.status === tab.toUpperCase())

  async function handleUpload(assignmentId: string, file: File) {
    setUploading(assignmentId)
    try {
      const url = await uploadToCloudinary(file)
      const res = await fetch(`/api/user/assignments/${assignmentId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submissionUrl: url }),
      })
      const data = await res.json()
      if (data.success) {
        setAssignments((prev) =>
          prev.map((a) =>
            a.id === assignmentId
              ? { ...a, submissionUrl: url, status: 'SUBMITTED' }
              : a
          )
        )
      }
    } catch (err) {
      console.error('Upload failed:', err)
    } finally {
      setUploading(null)
    }
  }

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--navy)' }}>
          Assignments
        </h1>
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
              <div className="h-5 w-48 bg-gray-200 rounded mb-3" />
              <div className="h-3 w-full bg-gray-200 rounded mb-2" />
              <div className="h-3 w-2/3 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--navy)' }}>
        Assignments
      </h1>

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 rounded-lg p-1 w-fit">
        {TABS.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className="px-4 py-2 rounded-md text-sm font-semibold transition-colors"
            style={{
              background: tab === t ? '#fff' : 'transparent',
              color: tab === t ? 'var(--navy)' : '#6B7280',
              boxShadow: tab === t ? '0 1px 2px rgba(0,0,0,0.05)' : 'none',
            }}
          >
            {t}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-500">
          No {tab === 'All' ? '' : tab.toLowerCase() + ' '}assignments found.
        </div>
      ) : (
        <div className="space-y-4">
          {filtered.map((a) => {
            const colors = STATUS_COLORS[a.status] ?? STATUS_COLORS.PENDING
            const isOverdue = a.dueDate && a.status === 'PENDING' && isPast(new Date(a.dueDate))
            const isExpanded = expanded.has(a.id)
            const desc = a.description ?? ''

            return (
              <div
                key={a.id}
                className="bg-white rounded-xl border border-gray-100 shadow-sm p-5"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div>
                    <h3 className="font-bold text-sm" style={{ color: 'var(--navy)' }}>
                      {a.title}
                    </h3>
                    <p className="text-xs text-gray-500">
                      by {a.doctor.user.name} &middot; {a.doctor.designation}
                    </p>
                  </div>
                  <span
                    className="text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
                    style={{ background: colors.bg, color: colors.text }}
                  >
                    {a.status}
                  </span>
                </div>

                {/* Description */}
                <p className="text-sm text-gray-600 mb-2">
                  {isExpanded || desc.length <= 200 ? desc : desc.slice(0, 200) + '...'}
                  {desc.length > 200 && (
                    <button
                      onClick={() => {
                        const next = new Set(expanded)
                        if (isExpanded) { next.delete(a.id) } else { next.add(a.id) }
                        setExpanded(next)
                      }}
                      className="ml-1 text-xs font-semibold"
                      style={{ color: 'var(--coral)' }}
                    >
                      {isExpanded ? 'Show less' : 'Read more'}
                    </button>
                  )}
                </p>

                {/* Due date */}
                {a.dueDate && (
                  <p
                    className="text-xs mb-3"
                    style={{ color: isOverdue ? '#DC2626' : '#6B7280' }}
                  >
                    Due: {format(new Date(a.dueDate), 'dd MMM yyyy')}
                    {isOverdue && ' (Overdue)'}
                  </p>
                )}

                <div className="flex flex-wrap gap-2">
                  {/* Download assignment file */}
                  {a.fileUrl && (
                    <a
                      href={a.fileUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg border"
                      style={{ borderColor: 'var(--teal)', color: 'var(--teal)' }}
                    >
                      Download Assignment
                    </a>
                  )}

                  {/* Upload response */}
                  {a.status === 'PENDING' && (
                    <>
                      <input
                        ref={(el) => { fileRefs.current[a.id] = el }}
                        type="file"
                        accept=".pdf,.doc,.docx,.jpg,.png"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) handleUpload(a.id, file)
                        }}
                      />
                      <button
                        onClick={() => fileRefs.current[a.id]?.click()}
                        disabled={uploading === a.id}
                        className="text-xs font-semibold px-3 py-1.5 rounded-lg text-white disabled:opacity-50"
                        style={{ background: 'var(--teal)' }}
                      >
                        {uploading === a.id ? 'Uploading...' : 'Upload Response'}
                      </button>
                    </>
                  )}

                  {/* View submission */}
                  {a.submissionUrl && (
                    <a
                      href={a.submissionUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600"
                    >
                      View Submission
                    </a>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
