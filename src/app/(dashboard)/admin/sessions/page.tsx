'use client'

import { useState, useEffect } from 'react'

interface SessionRow {
  id: string
  date: string
  status: string
  paymentStatus: string
  meetLink: string | null
  notes: string | null
  user: { id: string; name: string; email: string }
  doctor: { id: string; designation: string; user: { name: string } }
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: '#fef9c3', text: '#854d0e' },
  CONFIRMED: { bg: '#dcfce7', text: '#166534' },
  COMPLETED: { bg: '#dbeafe', text: '#1e40af' },
  CANCELLED: { bg: '#fee2e2', text: '#991b1b' },
  PAID: { bg: '#dcfce7', text: '#166534' },
  FAILED: { bg: '#fee2e2', text: '#991b1b' },
}

export default function AdminSessionsPage() {
  const [sessions, setSessions] = useState<SessionRow[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(1)
  const [statusFilter, setStatusFilter] = useState('all')
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editForm, setEditForm] = useState({ status: '', meetLink: '' })
  const [saving, setSaving] = useState(false)
  const limit = 20

  useEffect(() => {
    fetchSessions()
  }, [page, statusFilter])

  function fetchSessions() {
    setLoading(true)
    const params = new URLSearchParams({ page: String(page), limit: String(limit) })
    if (statusFilter !== 'all') params.set('status', statusFilter)

    fetch(`/api/admin/sessions?${params}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setSessions(res.data.sessions)
          setTotal(res.data.total)
        }
      })
      .finally(() => setLoading(false))
  }

  async function saveEdit(id: string) {
    setSaving(true)
    const body: Record<string, string> = {}
    if (editForm.status) body.status = editForm.status
    if (editForm.meetLink) body.meetLink = editForm.meetLink

    const res = await fetch(`/api/admin/sessions/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })
    const data = await res.json()
    if (data.success) {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === id
            ? { ...s, status: editForm.status || s.status, meetLink: editForm.meetLink || s.meetLink }
            : s
        )
      )
      setEditingId(null)
    }
    setSaving(false)
  }

  const totalPages = Math.ceil(total / limit)

  // CONFIRMED sessions still missing a Meet link (within the current page
  // load — admin can apply the CONFIRMED filter to scan more). Sorted by
  // session date ASC so the most-urgent are first.
  const pendingLink = sessions
    .filter((s) => s.status === 'CONFIRMED' && !s.meetLink)
    .slice()
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Sessions</h1>

      {pendingLink.length > 0 && (
        <div className="mb-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-amber-900">
              🔗 {pendingLink.length} confirmed session{pendingLink.length === 1 ? '' : 's'} need{pendingLink.length === 1 ? 's' : ''} a Meet link
            </p>
            <p className="text-xs text-amber-700">Soonest first</p>
          </div>
          <div className="space-y-1.5">
            {pendingLink.map((s) => (
              <div
                key={`pending-${s.id}`}
                className="flex items-center justify-between gap-3 bg-white rounded-lg px-3 py-2 text-xs"
              >
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-gray-900 truncate">
                    {s.user.name} <span className="text-gray-500 font-normal">with {s.doctor.user.name}</span>
                  </p>
                  <p className="text-gray-500 text-[11px]">
                    {new Date(s.date).toLocaleString('en-IN', {
                      weekday: 'short', day: 'numeric', month: 'short',
                      hour: '2-digit', minute: '2-digit',
                      timeZone: 'Asia/Kolkata',
                    })} IST
                  </p>
                </div>
                <button
                  onClick={() => {
                    setEditingId(s.id)
                    setEditForm({ status: '', meetLink: s.meetLink ?? '' })
                    // Scroll the editing row into view if needed
                    requestAnimationFrame(() => {
                      document.getElementById(`session-row-${s.id}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
                    })
                  }}
                  className="text-xs px-2.5 py-1 rounded-lg bg-amber-500 text-white font-medium hover:bg-amber-600 transition-colors shrink-0"
                >
                  Add link
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-3 mb-6">
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(1) }}
          className="px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
        >
          <option value="all">All Statuses</option>
          <option value="PENDING">Pending</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="COMPLETED">Completed</option>
          <option value="CANCELLED">Cancelled</option>
        </select>
      </div>

      {loading ? (
        <div className="text-gray-500">Loading sessions...</div>
      ) : (
        <>
          {/* Mobile card list */}
          <div className="lg:hidden space-y-3">
            {sessions.length === 0 ? (
              <p className="text-center text-gray-500 py-8">No sessions found.</p>
            ) : sessions.map((s) => {
              const sColors = STATUS_COLORS[s.status] ?? { bg: '#f3f4f6', text: '#374151' }
              const pColors = STATUS_COLORS[s.paymentStatus] ?? { bg: '#f3f4f6', text: '#374151' }
              return (
                <div key={s.id} id={`session-row-${s.id}`} className="bg-white rounded-2xl p-4 shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-gray-100/80">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-900">{s.user.name}</p>
                      <p className="text-sm text-gray-500 mt-0.5">{s.doctor.user.name}</p>
                    </div>
                    <div className="flex gap-1.5 flex-shrink-0">
                      <span className="text-xs px-2 py-1 rounded-lg font-medium" style={{ background: sColors.bg, color: sColors.text }}>
                        {s.status}
                      </span>
                      <span className="text-xs px-2 py-1 rounded-lg font-medium" style={{ background: pColors.bg, color: pColors.text }}>
                        {s.paymentStatus}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-50">
                    <span className="text-xs text-gray-400">
                      {new Date(s.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </span>
                    {editingId === s.id ? (
                      <div className="flex flex-col gap-2 items-end">
                        <select value={editForm.status} onChange={(e) => setEditForm({ ...editForm, status: e.target.value })} className="text-xs px-2 py-1 border rounded">
                          <option value="">No change</option>
                          <option value="CONFIRMED">Confirmed</option>
                          <option value="COMPLETED">Completed</option>
                          <option value="CANCELLED">Cancelled</option>
                        </select>
                        <input type="url" placeholder="Meet link" value={editForm.meetLink} onChange={(e) => setEditForm({ ...editForm, meetLink: e.target.value })} className="text-xs px-2 py-1 border rounded w-full" />
                        <div className="flex gap-1">
                          <button onClick={() => saveEdit(s.id)} disabled={saving} className="text-xs px-2 py-1 rounded bg-green-600 text-white">Save</button>
                          <button onClick={() => setEditingId(null)} className="text-xs px-2 py-1 rounded bg-gray-200">Cancel</button>
                        </div>
                      </div>
                    ) : (
                      <button onClick={() => { setEditingId(s.id); setEditForm({ status: '', meetLink: s.meetLink ?? '' }) }} className="text-xs text-blue-600 font-medium">
                        Edit
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* Desktop table */}
          <div className="hidden lg:block bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Patient</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Doctor</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Date & Time</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-500">Status</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-500">Payment</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sessions.map((s) => {
                  const sColors = STATUS_COLORS[s.status] ?? { bg: '#f3f4f6', text: '#374151' }
                  const pColors = STATUS_COLORS[s.paymentStatus] ?? { bg: '#f3f4f6', text: '#374151' }
                  return (
                    <tr key={s.id} id={`session-row-${s.id}`} className="border-b border-gray-50">
                      <td className="py-3 px-4">
                        <p className="font-medium text-gray-900">{s.user.name}</p>
                        <p className="text-xs text-gray-500">{s.user.email}</p>
                      </td>
                      <td className="py-3 px-4 text-gray-700">{s.doctor.user.name}</td>
                      <td className="py-3 px-4 text-gray-700">
                        {new Date(s.date).toLocaleDateString('en-IN', {
                          month: 'short', day: 'numeric', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: sColors.bg, color: sColors.text }}>
                          {s.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className="text-xs px-2 py-1 rounded-full font-medium" style={{ background: pColors.bg, color: pColors.text }}>
                          {s.paymentStatus}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {editingId === s.id ? (
                          <div className="flex flex-col gap-2 items-end">
                            <select
                              value={editForm.status}
                              onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                              className="text-xs px-2 py-1 border rounded"
                            >
                              <option value="">No change</option>
                              <option value="CONFIRMED">Confirmed</option>
                              <option value="COMPLETED">Completed</option>
                              <option value="CANCELLED">Cancelled</option>
                            </select>
                            <input
                              type="url"
                              placeholder="Meet link"
                              value={editForm.meetLink}
                              onChange={(e) => setEditForm({ ...editForm, meetLink: e.target.value })}
                              className="text-xs px-2 py-1 border rounded w-40"
                            />
                            <div className="flex gap-1">
                              <button
                                onClick={() => saveEdit(s.id)}
                                disabled={saving}
                                className="text-xs px-2 py-1 rounded bg-green-600 text-white"
                              >
                                Save
                              </button>
                              <button
                                onClick={() => setEditingId(null)}
                                className="text-xs px-2 py-1 rounded bg-gray-200"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditingId(s.id)
                              setEditForm({ status: '', meetLink: s.meetLink ?? '' })
                            }}
                            className="text-xs text-blue-600 hover:underline"
                          >
                            Edit
                          </button>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
            {sessions.length === 0 && (
              <p className="p-6 text-center text-gray-500">No sessions found.</p>
            )}
          </div>

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1 rounded bg-gray-200 text-gray-700 text-sm disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-3 py-1 text-sm text-gray-600">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1 rounded bg-gray-200 text-gray-700 text-sm disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
