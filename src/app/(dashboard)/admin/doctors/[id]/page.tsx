'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { uploadToCloudinary } from '@/lib/cloudinary-upload'

interface Doctor {
  id: string
  slug: string
  photo: string | null
  designation: string
  type: string
  specialization: string
  qualification: string
  experience: number
  bio: string
  sessionPrice: string
  isActive: boolean
  user: { id: string; name: string; email: string; phone: string | null }
}

export default function EditDoctorPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const [doctor, setDoctor] = useState<Doctor | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    designation: '',
    type: 'COUNSELOR' as string,
    specialization: '',
    qualification: '',
    experience: 0,
    bio: '',
    sessionPrice: 0,
    isActive: true,
    photo: '',
  })

  useEffect(() => {
    fetch('/api/admin/doctors')
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          const found = res.data.find((d: Doctor) => d.id === id)
          if (found) {
            setDoctor(found)
            setForm({
              designation: found.designation,
              type: found.type,
              specialization: found.specialization,
              qualification: found.qualification,
              experience: found.experience,
              bio: found.bio,
              sessionPrice: Number(found.sessionPrice),
              isActive: found.isActive,
              photo: found.photo || '',
            })
          }
        }
      })
      .finally(() => setLoading(false))
  }, [id])

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadToCloudinary(file)
      setForm({ ...form, photo: url })
    } catch {
      setError('Photo upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError('')

    try {
      const res = await fetch(`/api/admin/doctors/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.success) {
        router.push('/admin/doctors')
      } else {
        setError(data.error || 'Failed to update doctor')
      }
    } catch {
      setError('Failed to update doctor')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-8 text-gray-500">Loading doctor...</div>
  if (!doctor) return <div className="p-8 text-gray-500">Doctor not found.</div>

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-2">Edit Doctor</h1>
      <p className="text-gray-500 mb-6">{doctor.user.name} ({doctor.user.email})</p>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 max-w-2xl">
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
              <input
                type="text"
                value={form.designation}
                onChange={(e) => setForm({ ...form, designation: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
              <select
                value={form.type}
                onChange={(e) => setForm({ ...form, type: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
              >
                <option value="COUNSELOR">Counselor</option>
                <option value="PSYCHOLOGIST">Psychologist</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
              <input
                type="text"
                value={form.specialization}
                onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Qualification</label>
              <input
                type="text"
                value={form.qualification}
                onChange={(e) => setForm({ ...form, qualification: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Experience (years)</label>
              <input
                type="number"
                value={form.experience}
                onChange={(e) => setForm({ ...form, experience: Number(e.target.value) })}
                min={0}
                max={60}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Session Price (₹)</label>
              <input
                type="number"
                value={form.sessionPrice}
                onChange={(e) => setForm({ ...form, sessionPrice: Number(e.target.value) })}
                min={1}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
            <textarea
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Photo</label>
            {form.photo ? (
              <div className="flex items-center gap-2">
                <img src={form.photo} alt="Doctor" className="w-16 h-16 rounded-full object-cover" />
                <button type="button" onClick={() => setForm({ ...form, photo: '' })} className="text-xs text-red-600">
                  Remove
                </button>
              </div>
            ) : (
              <input type="file" accept="image/*" onChange={handlePhotoUpload} disabled={uploading} className="text-sm text-gray-600" />
            )}
            {uploading && <p className="text-xs text-gray-500 mt-1">Uploading...</p>}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
              id="isActive"
            />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Active</label>
          </div>
        </div>

        {error && <p className="text-sm text-red-600 mt-4">{error}</p>}

        <div className="flex gap-3 mt-6">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 rounded-lg text-white font-medium disabled:opacity-50"
            style={{ background: 'var(--coral)' }}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button
            type="button"
            onClick={() => router.back()}
            className="px-6 py-2 rounded-lg bg-gray-200 text-gray-700 font-medium"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
