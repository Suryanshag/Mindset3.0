'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { exportToCSV } from '@/lib/csv-export'

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
  city: string
  age: number
  interest: string
  createdAt: string
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

  function exportRequests() {
    exportToCSV(
      requests.map((r) => ({
        Name: r.name,
        Email: r.email,
        Phone: r.phone,
        City: r.city,
        Age: r.age,
        Interest: r.interest,
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
          <button
            onClick={exportRequests}
            disabled={requests.length === 0}
            className="mb-4 px-4 py-2 rounded-lg text-sm font-medium bg-gray-200 text-gray-700 disabled:opacity-50"
          >
            Export to CSV
          </button>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Name</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Email</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Phone</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">City</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-500">Age</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Interest</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-500">Date</th>
                </tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id} className="border-b border-gray-50">
                    <td className="py-3 px-4 font-medium text-gray-900">{r.name}</td>
                    <td className="py-3 px-4 text-gray-600">{r.email}</td>
                    <td className="py-3 px-4 text-gray-600">{r.phone}</td>
                    <td className="py-3 px-4 text-gray-600">{r.city}</td>
                    <td className="py-3 px-4 text-right text-gray-700">{r.age}</td>
                    <td className="py-3 px-4 text-gray-600 max-w-xs truncate">{r.interest}</td>
                    <td className="py-3 px-4 text-gray-600">{new Date(r.createdAt).toLocaleDateString('en-IN')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {requests.length === 0 && <p className="p-6 text-center text-gray-500">No requests yet.</p>}
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
