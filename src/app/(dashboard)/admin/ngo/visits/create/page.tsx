'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { uploadToCloudinary } from '@/lib/cloudinary-upload'

export default function CreateNgoVisitPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    ngoName: '',
    location: '',
    description: '',
    photos: [] as string[],
    visitDate: '',
    isPublished: false,
  })

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files
    if (!files?.length) return
    setUploading(true)
    try {
      const urls: string[] = []
      for (const file of Array.from(files)) {
        const url = await uploadToCloudinary(file)
        urls.push(url)
      }
      setForm({ ...form, photos: [...form.photos, ...urls] })
    } catch {
      setError('Photo upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/admin/ngo/visits', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          visitDate: new Date(form.visitDate).toISOString(),
        }),
      })
      const data = await res.json()
      if (data.success) {
        router.push('/admin/ngo')
      } else {
        setError(data.error || 'Failed to create visit')
      }
    } catch {
      setError('Failed to create visit')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Add NGO Visit</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 max-w-2xl">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">NGO Name</label>
              <input type="text" value={form.ngoName} onChange={(e) => setForm({ ...form, ngoName: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Location</label>
              <input type="text" value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required minLength={10} rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Visit Date</label>
            <input type="datetime-local" value={form.visitDate} onChange={(e) => setForm({ ...form, visitDate: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Photos</label>
            {form.photos.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {form.photos.map((url, i) => (
                  <div key={i} className="relative">
                    <Image width={80} height={80} src={url} alt="" className="rounded object-cover" />
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, photos: form.photos.filter((_, j) => j !== i) })}
                      className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white rounded-full text-xs flex items-center justify-center"
                    >
                      ×
                    </button>
                  </div>
                ))}
              </div>
            )}
            <input type="file" accept="image/*" multiple onChange={handlePhotoUpload} disabled={uploading} className="text-sm text-gray-600" />
            {uploading && <p className="text-xs text-gray-500 mt-1">Uploading...</p>}
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} id="isPublished" />
            <label htmlFor="isPublished" className="text-sm font-medium text-gray-700">Publish immediately</label>
          </div>
        </div>

        {error && <p className="text-sm text-red-600 mt-4">{error}</p>}

        <div className="flex gap-3 mt-6">
          <button type="submit" disabled={submitting} className="px-6 py-2 rounded-lg text-white font-medium disabled:opacity-50" style={{ background: 'var(--coral)' }}>
            {submitting ? 'Creating...' : 'Create Visit'}
          </button>
          <button type="button" onClick={() => router.back()} className="px-6 py-2 rounded-lg bg-gray-200 text-gray-700 font-medium">Cancel</button>
        </div>
      </form>
    </div>
  )
}
