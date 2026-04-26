'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Image from 'next/image'
import Link from 'next/link'
import FreeMaterialActions from '@/components/study-materials/free-material-actions'
import PurchasedMaterialActions from '@/components/study-materials/purchased-material-actions'

interface Material {
  id: string
  title: string
  type: string
  price: string | null
  coverImage: string | null
}

export default function EbooksPage() {
  const { data: session } = useSession()
  const [free, setFree] = useState<Material[]>([])
  const [purchased, setPurchased] = useState<Material[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/user/ebooks')
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setFree(res.data.free)
          setPurchased(res.data.purchased)
        }
      })
      .finally(() => setLoading(false))
  }, [])

  function MaterialCard({
    material,
    label,
    actions,
  }: {
    material: Material
    label: string
    actions: React.ReactNode
  }) {
    return (
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
        <div className="relative w-full h-40 bg-gray-100">
          {material.coverImage ? (
            <Image
              src={material.coverImage}
              alt={material.title}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 33vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
          )}
        </div>
        <div className="p-4">
          <div className="flex items-center gap-2 mb-2">
            <span
              className="text-xs font-semibold px-2 py-0.5 rounded-full"
              style={{
                background: label === 'Free' ? '#D1FAE5' : '#DBEAFE',
                color: label === 'Free' ? '#065F46' : '#1E40AF',
              }}
            >
              {label}
            </span>
          </div>
          <h3 className="font-semibold text-sm mb-3" style={{ color: 'var(--navy)' }}>
            {material.title}
          </h3>
          {actions}
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--navy)' }}>
          E-Books &amp; Resources
        </h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 overflow-hidden animate-pulse">
              <div className="h-40 bg-gray-200" />
              <div className="p-4 space-y-2">
                <div className="h-4 w-16 bg-gray-200 rounded" />
                <div className="h-4 w-32 bg-gray-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--navy)' }}>
        E-Books &amp; Resources
      </h1>

      {/* Free */}
      <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--navy)' }}>
        Free Resources
      </h2>
      {free.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-500 mb-8">
          No free resources available yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          {free.map((m) => (
            <MaterialCard
              key={m.id}
              material={m}
              label="Free"
              actions={<FreeMaterialActions materialId={m.id} title={m.title} />}
            />
          ))}
        </div>
      )}

      {/* Purchased */}
      <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--navy)' }}>
        My Purchased Materials
      </h2>
      {purchased.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-8 text-center text-gray-500">
          <p>No purchased materials yet.</p>
          <Link
            href="/study-materials"
            className="text-sm font-semibold mt-2 inline-block"
            style={{ color: 'var(--coral)' }}
          >
            Browse Premium Materials &rarr;
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {purchased.map((m) => (
            <MaterialCard
              key={m.id}
              material={m}
              label="Purchased"
              actions={
                <PurchasedMaterialActions
                  materialId={m.id}
                  title={m.title}
                  userEmail={session?.user?.email ?? ''}
                />
              }
            />
          ))}
        </div>
      )}
    </div>
  )
}
