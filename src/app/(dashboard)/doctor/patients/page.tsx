'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { Search, ChevronRight, Calendar } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'
import DoctorMobileTopBar from '@/components/dashboard/doctor/mobile-top-bar'

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

// Stable color per patientId — same color across visits.
const AVATAR_COLORS = [
  'var(--accent)',
  'var(--navy)',
  'var(--primary)',
  'var(--accent-deep)',
  '#8C5A8A',
  '#5C3E0A',
]
function colorFor(id: string): string {
  let h = 0
  for (let i = 0; i < id.length; i++) h = ((h << 5) - h + id.charCodeAt(i)) | 0
  return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}

function relativeShort(iso: string | null): string {
  if (!iso) return 'never'
  const ms = Date.now() - new Date(iso).getTime()
  if (ms < 0) return formatDistanceToNow(new Date(iso), { addSuffix: false })
  return formatDistanceToNow(new Date(iso), { addSuffix: true })
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

  if (loading) {
    return (
      <>
        <div className="lg:hidden">
          <DoctorMobileTopBar title="Patients" />
          <div className="px-4 pt-2 grid gap-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-[72px] rounded-2xl animate-pulse" style={{ background: 'var(--bg-card)' }} />
            ))}
          </div>
        </div>
        <div className="hidden lg:block p-8 text-gray-500">Loading patients...</div>
      </>
    )
  }

  return (
    <>
      {/* ═══ Mobile ═══ */}
      <div className="lg:hidden">
        <DoctorMobileTopBar title="Patients" />
        <section className="px-4 pt-1.5">
          {patients.length === 0 ? (
            <div
              className="text-center rounded-[18px] mt-4"
              style={{
                background: 'var(--bg-card)',
                boxShadow: 'var(--shadow-card)',
                padding: '40px 24px',
              }}
            >
              <div className="ms-display text-[18px]" style={{ color: 'var(--text)' }}>No patients yet.</div>
              <p className="ms-serif italic mt-2 text-[13.5px]" style={{ color: 'var(--text-muted)' }}>
                Once users book with you, they show up here.
              </p>
            </div>
          ) : (
            <div className="grid gap-2">
              {patients.map((p) => (
                <Link
                  key={p.id}
                  href={`/doctor/patients/${p.id}`}
                  className="flex items-center gap-3 rounded-2xl p-3.5"
                  style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}
                >
                  <div
                    className="w-[42px] h-[42px] rounded-full flex items-center justify-center text-[12px] font-extrabold shrink-0"
                    style={{ background: colorFor(p.id), color: 'var(--on-dark, var(--cream))' }}
                  >
                    {getInitials(p.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] font-extrabold truncate" style={{ color: 'var(--text)' }}>
                      {p.name}
                    </div>
                    <div className="text-[11.5px] mt-1" style={{ color: 'var(--text-muted)' }}>
                      {p.totalSessions} session{p.totalSessions === 1 ? '' : 's'}
                      {p.lastSessionDate ? ` · last ${relativeShort(p.lastSessionDate)}` : ''}
                    </div>
                    {p.nextSessionDate && (
                      <div
                        className="inline-flex items-center gap-1.5 mt-1.5 rounded-full text-[10.5px] font-extrabold"
                        style={{
                          padding: '3px 8px',
                          background: 'var(--primary-tint)',
                          color: 'var(--primary)',
                        }}
                      >
                        <Calendar size={11} strokeWidth={2} />
                        {new Date(p.nextSessionDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
                      </div>
                    )}
                  </div>
                  <ChevronRight size={16} strokeWidth={1.8} style={{ color: 'var(--text-muted)' }} />
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ═══ Desktop (unchanged) ═══ */}
      <div className="hidden lg:block">
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
    </>
  )
}
