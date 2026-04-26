'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface StudyMaterial {
  id: string
  title: string
  type: string
  price: string | null
  fileUrl: string
  coverImage: string | null
  isPublished: boolean
}

export default function AdminStudyMaterialsPage() {
  const [materials, setMaterials] = useState<StudyMaterial[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/study-materials')
      .then((r) => r.json())
      .then((res) => { if (res.success) setMaterials(res.data) })
      .finally(() => setLoading(false))
  }, [])

  async function togglePublished(id: string, isPublished: boolean) {
    const res = await fetch(`/api/admin/study-materials/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublished: !isPublished }),
    })
    const data = await res.json()
    if (data.success) {
      setMaterials((prev) => prev.map((m) => (m.id === id ? { ...m, isPublished: !isPublished } : m)))
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this study material?')) return
    const res = await fetch(`/api/admin/study-materials/${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (data.success) setMaterials((prev) => prev.filter((m) => m.id !== id))
  }

  if (loading) return <div className="p-8 text-gray-500">Loading study materials...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Study Materials</h1>
        <Link
          href="/admin/study-materials/create"
          className="px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ background: 'var(--coral)' }}
        >
          Add Material
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-500">Title</th>
              <th className="text-center py-3 px-4 font-medium text-gray-500">Type</th>
              <th className="text-right py-3 px-4 font-medium text-gray-500">Price</th>
              <th className="text-center py-3 px-4 font-medium text-gray-500">Published</th>
              <th className="text-right py-3 px-4 font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {materials.map((m) => (
              <tr key={m.id} className="border-b border-gray-50">
                <td className="py-3 px-4 font-medium text-gray-900">{m.title}</td>
                <td className="py-3 px-4 text-center">
                  <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                    m.type === 'FREE' ? 'bg-green-100 text-green-800' : 'bg-orange-100 text-orange-800'
                  }`}>
                    {m.type}
                  </span>
                </td>
                <td className="py-3 px-4 text-right text-gray-700">
                  {m.type === 'PAID' && m.price ? `₹${Number(m.price).toLocaleString('en-IN')}` : '-'}
                </td>
                <td className="py-3 px-4 text-center">
                  <button
                    onClick={() => togglePublished(m.id, m.isPublished)}
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      m.isPublished ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {m.isPublished ? 'Published' : 'Draft'}
                  </button>
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="flex justify-end gap-2">
                    <Link href={`/admin/study-materials/${m.id}`} className="text-xs text-blue-600 hover:underline">Edit</Link>
                    <button onClick={() => handleDelete(m.id)} className="text-xs text-red-600 hover:underline">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {materials.length === 0 && <p className="p-6 text-center text-gray-500">No study materials yet.</p>}
      </div>
    </div>
  )
}
