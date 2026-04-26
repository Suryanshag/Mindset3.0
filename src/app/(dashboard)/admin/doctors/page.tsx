'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Doctor {
  id: string
  slug: string
  photo: string | null
  designation: string
  type: string
  specialization: string
  sessionPrice: string
  isActive: boolean
  user: { id: string; name: string; email: string; phone: string | null }
  _count: { sessions: number }
}

export default function AdminDoctorsPage() {
  const [doctors, setDoctors] = useState<Doctor[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/admin/doctors')
      .then((r) => r.json())
      .then((res) => { if (res.success) setDoctors(res.data) })
      .finally(() => setLoading(false))
  }, [])

  async function toggleActive(id: string, isActive: boolean) {
    const res = await fetch(`/api/admin/doctors/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !isActive }),
    })
    const data = await res.json()
    if (data.success) {
      setDoctors((prev) => prev.map((d) => (d.id === id ? { ...d, isActive: !isActive } : d)))
    }
  }

  const filtered = doctors.filter(
    (d) =>
      d.user.name.toLowerCase().includes(search.toLowerCase()) ||
      d.user.email.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div className="p-8 text-gray-500">Loading doctors...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Doctors</h1>
        <Link
          href="/admin/doctors/create"
          className="px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ background: 'var(--coral)' }}
        >
          Add Doctor
        </Link>
      </div>

      <input
        type="text"
        placeholder="Search by name or email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-md mb-6 px-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
      />

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-500">Name</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Email</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Type</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Specialization</th>
              <th className="text-right py-3 px-4 font-medium text-gray-500">Sessions</th>
              <th className="text-right py-3 px-4 font-medium text-gray-500">Price</th>
              <th className="text-center py-3 px-4 font-medium text-gray-500">Status</th>
              <th className="text-right py-3 px-4 font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d) => (
              <tr key={d.id} className="border-b border-gray-50">
                <td className="py-3 px-4 font-medium text-gray-900">{d.user.name}</td>
                <td className="py-3 px-4 text-gray-600">{d.user.email}</td>
                <td className="py-3 px-4 text-gray-600">{d.type}</td>
                <td className="py-3 px-4 text-gray-600">{d.specialization}</td>
                <td className="py-3 px-4 text-right text-gray-700">{d._count.sessions}</td>
                <td className="py-3 px-4 text-right text-gray-700">₹{Number(d.sessionPrice).toLocaleString('en-IN')}</td>
                <td className="py-3 px-4 text-center">
                  <button
                    onClick={() => toggleActive(d.id, d.isActive)}
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      d.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}
                  >
                    {d.isActive ? 'Active' : 'Inactive'}
                  </button>
                </td>
                <td className="py-3 px-4 text-right">
                  <Link
                    href={`/admin/doctors/${d.id}`}
                    className="text-xs text-blue-600 hover:underline"
                  >
                    Edit
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && (
          <p className="p-6 text-center text-gray-500">No doctors found.</p>
        )}
      </div>
    </div>
  )
}
