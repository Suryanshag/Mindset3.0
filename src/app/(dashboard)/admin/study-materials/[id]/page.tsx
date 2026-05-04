'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter, useParams } from 'next/navigation'
import { uploadToCloudinary } from '@/lib/cloudinary-upload'

export default function EditStudyMaterialPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const [uploadingCover, setUploadingCover] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    title: '',
    type: 'FREE' as 'FREE' | 'PAID',
    price: 0,
    fileUrl: '',
    coverImage: '',
    isPublished: false,
  })

  useEffect(() => {
    fetch(`/api/admin/study-materials/${id}`)
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          const m = res.data
          setForm({
            title: m.title,
            type: m.type,
            price: m.price ? Number(m.price) : 0,
            fileUrl: m.fileUrl,
            coverImage: m.coverImage || '',
            isPublished: m.isPublished,
          })
        }
      })
      .finally(() => setLoading(false))
  }, [id])

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingFile(true)
    try {
      const url = await uploadToCloudinary(file)
      setForm({ ...form, fileUrl: url })
    } catch {
      setError('File upload failed')
    } finally {
      setUploadingFile(false)
    }
  }

  async function handleCoverUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploadingCover(true)
    try {
      const url = await uploadToCloudinary(file)
      setForm({ ...form, coverImage: url })
    } catch {
      setError('Cover upload failed')
    } finally {
      setUploadingCover(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const body: Record<string, unknown> = {
        title: form.title,
        type: form.type,
        fileUrl: form.fileUrl,
        isPublished: form.isPublished,
      }
      if (form.type === 'PAID') body.price = form.price
      if (form.coverImage) body.coverImage = form.coverImage

      const res = await fetch(`/api/admin/study-materials/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (data.success) router.push('/admin/study-materials')
      else setError(data.error || 'Failed to update')
    } catch {
      setError('Failed to update')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-8 text-gray-500">Loading...</div>

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Study Material</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 max-w-2xl">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <div className="flex gap-4">
              {(['FREE', 'PAID'] as const).map((t) => (
                <label key={t} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="type" value={t} checked={form.type === t} onChange={() => setForm({ ...form, type: t })} />
                  <span className="text-sm text-gray-700">{t}</span>
                </label>
              ))}
            </div>
          </div>
          {form.type === 'PAID' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
              <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} min={1} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">File</label>
            {form.fileUrl ? (
              <div className="flex items-center gap-2">
                <a href={form.fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">Current file</a>
                <button type="button" onClick={() => setForm({ ...form, fileUrl: '' })} className="text-xs text-red-600">Replace</button>
              </div>
            ) : (
              <input type="file" accept=".pdf" onChange={handleFileUpload} disabled={uploadingFile} className="text-sm text-gray-600" />
            )}
            {uploadingFile && <p className="text-xs text-gray-500 mt-1">Uploading...</p>}
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Cover Image</label>
            {form.coverImage ? (
              <div className="flex items-center gap-2">
                <Image width={80} height={112} src={form.coverImage} alt="Cover" className="rounded object-cover" />
                <button type="button" onClick={() => setForm({ ...form, coverImage: '' })} className="text-xs text-red-600">Remove</button>
              </div>
            ) : (
              <input type="file" accept="image/*" onChange={handleCoverUpload} disabled={uploadingCover} className="text-sm text-gray-600" />
            )}
            {uploadingCover && <p className="text-xs text-gray-500 mt-1">Uploading...</p>}
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
