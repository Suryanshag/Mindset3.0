'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Workshop {
  id: string
  title: string
  date: string
  isPublished: boolean
  createdAt: string
}

export default function AdminWorkshopsPage() {
  const [workshops, setWorkshops] = useState<Workshop[]>([])
  const [loading, setLoading] = useState(true)
  const [deleting, setDeleting] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/admin/workshops')
      .then((r) => r.json())
      .then((res) => { if (res.success) setWorkshops(res.data) })
      .finally(() => setLoading(false))
  }, [])

  async function togglePublished(id: string, isPublished: boolean) {
    const res = await fetch(`/api/admin/workshops/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPublished: !isPublished }),
    })
    const data = await res.json()
    if (data.success) {
      setWorkshops((prev) => prev.map((w) => (w.id === id ? { ...w, isPublished: !isPublished } : w)))
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this workshop?')) return
    setDeleting(id)
    const res = await fetch(`/api/admin/workshops/${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (data.success) {
      setWorkshops((prev) => prev.filter((w) => w.id !== id))
    }
    setDeleting(null)
  }

  if (loading) return <div className="p-8 text-gray-500">Loading workshops...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Workshops</h1>
        <Link
          href="/admin/workshops/create"
          className="px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ background: 'var(--coral)' }}
        >
          Add Workshop
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-500">Title</th>
              <th className="text-left py-3 px-4 font-medium text-gray-500">Date</th>
              <th className="text-center py-3 px-4 font-medium text-gray-500">Status</th>
              <th className="text-right py-3 px-4 font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {workshops.map((w) => (
              <tr key={w.id} className="border-b border-gray-50">
                <td className="py-3 px-4 font-medium text-gray-900">{w.title}</td>
                <td className="py-3 px-4 text-gray-600">
                  {new Date(w.date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: 'numeric' })}
                </td>
                <td className="py-3 px-4 text-center">
                  <button
                    onClick={() => togglePublished(w.id, w.isPublished)}
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      w.isPublished ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    {w.isPublished ? 'Published' : 'Draft'}
                  </button>
                </td>
                <td className="py-3 px-4 text-right">
                  <div className="flex justify-end gap-2">
                    <Link href={`/admin/workshops/${w.id}`} className="text-xs text-blue-600 hover:underline">
                      Edit
                    </Link>
                    <button
                      onClick={() => handleDelete(w.id)}
                      disabled={deleting === w.id}
                      className="text-xs text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {workshops.length === 0 && (
          <p className="p-6 text-center text-gray-500">No workshops yet.</p>
        )}
      </div>
    </div>
  )
}
