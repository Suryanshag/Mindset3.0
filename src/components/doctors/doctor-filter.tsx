'use client'

import { useState } from 'react'
import DoctorCard from './doctor-card'
import type { Prisma } from '@prisma/client'

type Decimal = Prisma.Decimal

type Doctor = {
  id: string
  slug: string
  photo: string | null
  designation: string
  type: 'COUNSELOR' | 'PSYCHOLOGIST'
  specialization: string
  qualification: string
  experience: number
  bio: string
  sessionPrice: Decimal
  user: { name: string }
}

const FILTERS = ['ALL', 'COUNSELOR', 'PSYCHOLOGIST'] as const

export default function DoctorFilter({ doctors }: { doctors: Doctor[] }) {
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>('ALL')

  const filtered = filter === 'ALL' ? doctors : doctors.filter((d) => d.type === filter)

  return (
    <>
      {/* Filter Pills */}
      <div className="flex gap-2 mb-8">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="px-5 py-2 rounded-full text-sm font-semibold transition-all duration-200"
            style={{
              background: filter === f ? 'var(--teal)' : 'white',
              color: filter === f ? 'white' : 'var(--navy)',
              border: filter === f ? '2px solid var(--teal)' : '2px solid rgba(0,0,0,0.1)',
            }}
          >
            {f === 'ALL' ? 'All Doctors' : f === 'COUNSELOR' ? 'Counselors' : 'Psychologists'}
          </button>
        ))}
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <div className="text-center py-16">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
            style={{ background: 'var(--teal)', opacity: 0.15 }}
          >
            <span className="text-2xl">🔍</span>
          </div>
          <p className="font-semibold mb-2" style={{ color: 'var(--navy)' }}>
            No doctors found
          </p>
          <p className="text-sm text-gray-500">Try a different filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((doctor) => (
            <DoctorCard key={doctor.id} {...doctor} />
          ))}
        </div>
      )}
    </>
  )
}
