'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search } from 'lucide-react'

interface Patient {
  id: string
  name: string
  email: string
  phone: string | null
  totalSessions: number
  lastSessionDate: string | null
  nextSessionDate: string | null
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

export default function DoctorPatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    fetch('/api/doctor/patients')
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setPatients(res.data)
      })
      .finally(() => setLoading(false))
  }, [])

  const filtered = patients.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase())
  )

  if (loading) return <div className="p-8 text-gray-500">Loading patients...</div>

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Patients</h1>

      <div className="relative mb-6 max-w-md">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>

      {filtered.length === 0 ? (
        <p className="text-gray-500">No patients found.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((p) => (
            <div key={p.id} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold text-white"
                  style={{ background: 'var(--navy)' }}
                >
                  {getInitials(p.name)}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{p.name}</p>
                  <p className="text-sm text-gray-500 truncate">{p.email}</p>
                </div>
              </div>
              <div className="text-sm text-gray-600 space-y-1 mb-4">
                <p>Total sessions: <span className="font-medium text-gray-900">{p.totalSessions}</span></p>
                {p.lastSessionDate && (
                  <p>Last: {new Date(p.lastSessionDate).toLocaleDateString('en-IN')}</p>
                )}
                {p.nextSessionDate && (
                  <p>Next: {new Date(p.nextSessionDate).toLocaleDateString('en-IN')}</p>
                )}
              </div>
              <Link
                href={`/doctor/patients/${p.id}`}
                className="text-sm font-medium hover:underline"
                style={{ color: 'var(--coral)' }}
              >
                View Patient
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
