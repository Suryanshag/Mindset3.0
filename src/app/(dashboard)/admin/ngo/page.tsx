'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { exportToCSV } from '@/lib/csv-export'

type NgoJoinStatus =
  | 'PENDING'
  | 'CONTACTED'
  | 'CONFIRMED'
  | 'ATTENDED'
  | 'NO_SHOW'
  | 'CANCELLED'

const STATUS_OPTIONS: NgoJoinStatus[] = [
  'PENDING',
  'CONTACTED',
  'CONFIRMED',
  'ATTENDED',
  'NO_SHOW',
  'CANCELLED',
]

const STATUS_LABEL: Record<NgoJoinStatus, string> = {
  PENDING: 'Pending',
  CONTACTED: 'Contacted',
  CONFIRMED: 'Confirmed',
  ATTENDED: 'Attended',
  NO_SHOW: 'No-show',
  CANCELLED: 'Cancelled',
}

const STATUS_PILL: Record<NgoJoinStatus, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800',
  CONTACTED: 'bg-blue-100 text-blue-800',
  CONFIRMED: 'bg-green-100 text-green-800',
  ATTENDED: 'bg-emerald-100 text-emerald-800',
  NO_SHOW: 'bg-gray-100 text-gray-600',
  CANCELLED: 'bg-red-100 text-red-800',
}

interface NgoVisit {
  id: string
  ngoName: string
  location: string
  description: string
  visitDate: string
  isPublished: boolean
}

interface JoinRequest {
  id: string
  name: string
  email: string
  phone: string
  age: number | null
  interest: string
  status: NgoJoinStatus
  createdAt: string
  userId: string | null
  ngoVisitId: string | null
  user: { id: string; name: string; email: string } | null
  ngoVisit: { id: string; ngoName: string; visitDate: string } | null
}

interface WhatsappLink {
  id: string
  link: string
  label: string
  updatedAt: string
}

export default function AdminNgoPage() {
  const [tab, setTab] = useState<'visits' | 'requests' | 'whatsapp'>('visits')
  const [visits, setVisits] = useState<NgoVisit[]>([])
  const [requests, setRequests] = useState<JoinRequest[]>([])
  const [whatsapp, setWhatsapp] = useState<WhatsappLink | null>(null)
  const [loading, setLoading] = useState(true)
  const [whatsappForm, setWhatsappForm] = useState({ link: '', label: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [statusFilter, setStatusFilter] = useState<'ALL' | NgoJoinStatus>('ALL')
  const [requestsError, setRequestsError] = useState('')

  useEffect(() => {
    Promise.all([
      fetch('/api/admin/ngo/visits').then((r) => r.json()),
      fetch('/api/admin/ngo/requests').then((r) => r.json()),
      fetch('/api/admin/ngo/whatsapp').then((r) => r.json()),
    ])
      .then(([visitsRes, requestsRes, whatsappRes]) => {
        if (visitsRes.success) setVisits(visitsRes.data)
        if (requestsRes.success) setRequests(requestsRes.data.requests)
        if (whatsappRes.success && whatsappRes.data) {
          setWhatsapp(whatsappRes.data)
          setWhatsappForm({ link: whatsappRes.data.link, label: whatsappRes.data.label })
        }
      })
      .finally(() => setLoading(false))
  }, [])

  async function togglePublished(id: string, isPublished: boolean) {
    const res = await fetch(`/api/admin/ngo/visits/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublished: !isPublished }),
    })
    const data = await res.json()
    if (data.success) {
      setVisits((prev) => prev.map((v) => (v.id === id ? { ...v, isPublished: !isPublished } : v)))
    }
  }

  async function handleDeleteVisit(id: string) {
    if (!confirm('Delete this visit?')) return
    const res = await fetch(`/api/admin/ngo/visits/${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (data.success) setVisits((prev) => prev.filter((v) => v.id !== id))
  }

  async function saveWhatsapp() {
    setSaving(true)
    setError('')
    try {
      const res = await fetch('/api/admin/ngo/whatsapp', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(whatsappForm),
      })
      const data = await res.json()
      if (data.success) {
        setWhatsapp(data.data)
      } else {
        setError(data.error || 'Failed to save')
      }
    } catch {
      setError('Failed to save')
    } finally {
      setSaving(false)
    }
  }

  const filteredRequests =
    statusFilter === 'ALL'
      ? requests
      : requests.filter((r) => r.status === statusFilter)

  async function changeStatus(id: string, status: NgoJoinStatus) {
    const snapshot = requests
    setRequestsError('')
    // Optimistic — flip the row immediately, revert if the PATCH fails.
    setRequests((rs) => rs.map((r) => (r.id === id ? { ...r, status } : r)))
    try {
      const res = await fetch(`/api/admin/ngo/requests/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const data = await res.json()
      if (!data.success) throw new Error(data.error || 'Failed')
    } catch {
      setRequests(snapshot)
      setRequestsError('Could not update status. Please try again.')
    }
  }

  function exportRequests() {
    exportToCSV(
      filteredRequests.map((r) => ({
        Name: r.name,
        Email: r.email,
        Phone: r.phone,
        Age: r.age ?? '',
        Interest: r.interest,
        'Visit Name': r.ngoVisit?.ngoName ?? 'Public form (legacy)',
        'Visit Date': r.ngoVisit
          ? new Date(r.ngoVisit.visitDate).toLocaleDateString('en-IN')
          : '',
        Status: STATUS_LABEL[r.status],
        Source: r.userId ? 'Dashboard' : 'Guest',
        UserAccount: r.user?.email ?? '',
        Date: new Date(r.createdAt).toLocaleDateString('en-IN'),
      })),
      'ngo-join-requests'
    )
  }

  if (loading) return <div className="p-8 text-gray-500">Loading...</div>

  const tabs = [
    { key: 'visits' as const, label: 'NGO Visits' },
    { key: 'requests' as const, label: 'Join Requests' },
    { key: 'whatsapp' as const, label: 'WhatsApp Link' },
  ]

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">NGO Management</h1>

      <div className="flex gap-3 mb-6">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              tab === t.key ? 'text-white' : 'bg-white text-gray-700 border border-gray-200'
            }`}
            style={tab === t.key ? { background: 'var(--coral)' } : undefined}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === 'visits' && (
        <div>
          <Link
            href="/admin/ngo/visits/create"
            className="inline-block mb-4 px-4 py-2 rounded-lg text-sm font-medium text-white"
            style={{ background: 'var(--coral)' }}
          >
            Add Visit
          </Link>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">NGO Name</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Location</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Date</th>
                  <th className="text-center py-3 px-4 font-medium text-gray-500">Status</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {visits.map((v) => (
                  <tr key={v.id} className="border-b border-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">{v.ngoName}</td>
                    <td className="py-3 px-4 text-gray-600">{v.location}</td>
                    <td className="py-3 px-4 text-gray-600">{new Date(v.visitDate).toLocaleDateString('en-IN')}</td>
                    <td className="py-3 px-4 text-center">
                      <button
                        onClick={() => togglePublished(v.id, v.isPublished)}
                        className={`text-xs px-2 py-1 rounded-full font-medium ${
                          v.isPublished ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                        }`}
                      >
                        {v.isPublished ? 'Published' : 'Draft'}
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Link href={`/admin/ngo/visits/${v.id}`} className="text-xs text-blue-600 hover:underline">Edit</Link>
                        <button onClick={() => handleDeleteVisit(v.id)} className="text-xs text-red-600 hover:underline">Delete</button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {visits.length === 0 && <p className="p-6 text-center text-gray-500">No visits yet.</p>}
          </div>
        </div>
      )}

      {tab === 'requests' && (
        <div>
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as 'ALL' | NgoJoinStatus)}
              className="px-3 py-2 rounded-lg text-sm border border-gray-300 text-gray-700 bg-white"
            >
              <option value="ALL">All statuses</option>
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>{STATUS_LABEL[s]}</option>
              ))}
            </select>
            <button
              onClick={exportRequests}
              disabled={filteredRequests.length === 0}
              className="px-4 py-2 rounded-lg text-sm font-medium bg-gray-200 text-gray-700 disabled:opacity-50"
            >
              Export to CSV
            </button>
            {requestsError && (
              <span className="text-sm text-red-600">{requestsError}</span>
            )}
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Name</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Email</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Phone</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Age</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Visit</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">User</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((r) => (
                  <tr key={r.id} className="border-b border-gray-50 align-top">
                    <td className="py-3 px-4 font-medium text-gray-900">{r.name}</td>
                    <td className="py-3 px-4 text-gray-600">{r.email}</td>
                    <td className="py-3 px-4 text-gray-600">{r.phone}</td>
                    <td className="py-3 px-4 text-right text-gray-700">{r.age ?? '—'}</td>
                    <td className="py-3 px-4 text-gray-700 max-w-[200px]">
                      {r.ngoVisit ? (
                        <Link
                          href={`/admin/ngo/visits/${r.ngoVisit.id}`}
                          className="hover:underline"
                        >
                          <div className="font-medium text-gray-900 line-clamp-1">
                            {r.ngoVisit.ngoName}
                          </div>
                          <div className="text-[11px] text-gray-500">
                            {new Date(r.ngoVisit.visitDate).toLocaleDateString('en-IN')}
                          </div>
                        </Link>
                      ) : (
                        <span className="text-[11px] italic text-gray-400">
                          Public form (legacy)
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <span
                        className={`text-xs px-2 py-0.5 rounded-full font-medium ${STATUS_PILL[r.status]}`}
                      >
                        {STATUS_LABEL[r.status]}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-gray-700 max-w-[200px]">
                      {r.user ? (
                        <Link
                          href={`/admin/users/${r.user.id}`}
                          className="hover:underline"
                        >
                          <div className="font-medium text-gray-900 line-clamp-1">
                            {r.user.name}
                          </div>
                          <div className="text-[11px] text-gray-500 line-clamp-1">
                            {r.user.email}
                          </div>
                        </Link>
                      ) : (
                        <span
                          title="Submitted via the deprecated public form before 2026-05-19"
                          className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600"
                        >
                          Guest
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-gray-600 whitespace-nowrap">
                      {new Date(r.createdAt).toLocaleDateString('en-IN')}
                    </td>
                    <td className="py-3 px-4">
                      <select
                        value={r.status}
                        onChange={(e) => changeStatus(r.id, e.target.value as NgoJoinStatus)}
                        className="text-xs border border-gray-300 rounded-lg px-2 py-1 text-gray-700 bg-white"
                      >
                        {STATUS_OPTIONS.map((s) => (
                          <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {filteredRequests.length === 0 && (
              <p className="p-6 text-center text-gray-500">
                {requests.length === 0 ? 'No requests yet.' : 'No requests match this filter.'}
              </p>
            )}
          </div>
        </div>
      )}

      {tab === 'whatsapp' && (
        <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 max-w-lg">
          {whatsapp && (
            <p className="text-sm text-gray-600 mb-4">
              Current link: <a href={whatsapp.link} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline break-all">{whatsapp.link}</a>
            </p>
          )}
          {!whatsapp && <p className="text-sm text-gray-500 mb-4">No WhatsApp link set.</p>}
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp Group Link</label>
              <input
                type="url"
                value={whatsappForm.link}
                onChange={(e) => setWhatsappForm({ ...whatsappForm, link: e.target.value })}
                placeholder="https://chat.whatsapp.com/..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Label</label>
              <input
                type="text"
                value={whatsappForm.label}
                onChange={(e) => setWhatsappForm({ ...whatsappForm, label: e.target.value })}
                placeholder="NGO Drive"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
              />
            </div>
            <p className="text-xs text-amber-600">Updating this link will affect all future NGO join confirmation emails.</p>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              onClick={saveWhatsapp}
              disabled={saving || !whatsappForm.link}
              className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
              style={{ background: 'var(--coral)' }}
            >
              {saving ? 'Saving...' : 'Save Link'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
