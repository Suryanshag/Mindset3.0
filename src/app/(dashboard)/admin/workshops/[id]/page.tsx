'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { uploadToCloudinary } from '@/lib/cloudinary-upload'
import RichTextEditor from '@/components/ui/rich-text-editor'

export default function EditWorkshopPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    title: '',
    description: '',
    image: '',
    date: '',
    isPublished: false,
  })

  useEffect(() => {
    fetch(`/api/admin/workshops/${id}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          const w = res.data
          setForm({
            title: w.title,
            description: w.description,
            image: w.image || '',
            date: new Date(w.date).toISOString().slice(0, 16),
            isPublished: w.isPublished,
          })
        }
      })
      .finally(() => setLoading(false))
  }, [id])

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadToCloudinary(file)
      setForm({ ...form, image: url })
    } catch {
      setError('Image upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const body: Record<string, unknown> = {
        title: form.title,
        description: form.description,
        date: new Date(form.date).toISOString(),
        isPublished: form.isPublished,
      }
      if (form.image) body.image = form.image

      const res = await fetch(`/api/admin/workshops/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (data.success) {
        router.push('/admin/workshops')
      } else {
        setError(data.error || 'Failed to update workshop')
      }
    } catch {
      setError('Failed to update workshop')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-8 text-gray-500">Loading workshop...</div>

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Workshop</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 max-w-2xl">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <RichTextEditor
              value={form.description}
              onChange={(html) => setForm({ ...form, description: html })}
              placeholder="Write workshop details..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date & Time</label>
            <input type="datetime-local" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Image</label>
            {form.image ? (
              <div className="flex items-center gap-2">
                <img src={form.image} alt="Workshop" className="w-20 rounded object-cover" style={{ aspectRatio: '1/1.414' }} />
                <button type="button" onClick={() => setForm({ ...form, image: '' })} className="text-xs text-red-600">Remove</button>
              </div>
            ) : (
              <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="text-sm text-gray-600" />
            )}
            {uploading && <p className="text-xs text-gray-500 mt-1">Uploading...</p>}
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} id="isPublished" />
            <label htmlFor="isPublished" className="text-sm font-medium text-gray-700">Published</label>
          </div>
        </div>

        {error && <p className="text-sm text-red-600 mt-4">{error}</p>}

        <div className="flex gap-3 mt-6">
          <button type="submit" disabled={saving} className="px-6 py-2 rounded-lg text-white font-medium disabled:opacity-50" style={{ background: 'var(--coral)' }}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button type="button" onClick={() => router.back()} className="px-6 py-2 rounded-lg bg-gray-200 text-gray-700 font-medium">Cancel</button>
        </div>
      </form>
    </div>
  )
}
