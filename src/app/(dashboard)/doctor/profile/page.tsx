'use client'

import { useState, useEffect } from 'react'
import { uploadToCloudinary } from '@/lib/cloudinary-upload'

interface DoctorProfile {
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
  user: { name: string; email: string; phone: string | null }
}

export default function DoctorProfilePage() {
  const [profile, setProfile] = useState<DoctorProfile | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [form, setForm] = useState({
    designation: '',
    specialization: '',
    qualification: '',
    experience: 0,
    bio: '',
    sessionPrice: 0,
  })

  useEffect(() => {
    fetch('/api/doctor/profile')
      .then((r) => r.json())
      .then((res) => {
        if (res.success) {
          setProfile(res.data)
          setForm({
            designation: res.data.designation,
            specialization: res.data.specialization,
            qualification: res.data.qualification,
            experience: res.data.experience,
            bio: res.data.bio,
            sessionPrice: Number(res.data.sessionPrice),
          })
        }
      })
      .finally(() => setLoading(false))
  }, [])

  async function handleSave() {
    setSaving(true)
    setMessage('')
    try {
      const res = await fetch('/api/doctor/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      })
      const data = await res.json()
      if (data.success) {
        setProfile(data.data)
        setMessage('Profile updated successfully')
      } else {
        setMessage(data.error || 'Failed to update')
      }
    } catch {
      setMessage('Failed to update')
    } finally {
      setSaving(false)
    }
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadToCloudinary(file)
      const res = await fetch('/api/doctor/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ photo: url }),
      })
      const data = await res.json()
      if (data.success) setProfile(data.data)
    } catch {
      setMessage('Photo upload failed')
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return <div className="p-8 text-gray-500">Loading profile...</div>
  }

  if (!profile) {
    return <div className="p-8 text-gray-500">Doctor profile not found.</div>
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Profile</h1>

      <div className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 mb-6">
        {/* Photo */}
        <div className="flex items-center gap-4 mb-6">
          <div className="relative">
            {profile.photo ? (
              <img
                src={profile.photo}
                alt="Profile"
                className="w-20 h-20 rounded-full object-cover"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center text-2xl font-bold text-gray-400">
                {profile.user.name?.slice(0, 2).toUpperCase()}
              </div>
            )}
          </div>
          <div>
            <label className="text-sm font-medium text-white px-4 py-2 rounded-lg cursor-pointer" style={{ background: 'var(--coral)' }}>
              {uploading ? 'Uploading...' : 'Change Photo'}
              <input type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} disabled={uploading} />
            </label>
          </div>
        </div>

        {/* Read-only fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Name</label>
            <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{profile.user.name}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Email</label>
            <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{profile.user.email}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Type</label>
            <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{profile.type}</p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-500 mb-1">Slug</label>
            <p className="text-gray-900 bg-gray-50 px-3 py-2 rounded-lg">{profile.slug}</p>
          </div>
        </div>

        {/* Editable fields */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Designation</label>
            <input
              type="text"
              value={form.designation}
              onChange={(e) => setForm({ ...form, designation: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Specialization</label>
            <input
              type="text"
              value={form.specialization}
              onChange={(e) => setForm({ ...form, specialization: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Qualification</label>
            <input
              type="text"
              value={form.qualification}
              onChange={(e) => setForm({ ...form, qualification: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Experience (years)</label>
            <input
              type="number"
              value={form.experience}
              onChange={(e) => setForm({ ...form, experience: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Session Price (₹)</label>
            <input
              type="number"
              value={form.sessionPrice}
              onChange={(e) => setForm({ ...form, sessionPrice: Number(e.target.value) })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
          <textarea
            value={form.bio}
            onChange={(e) => setForm({ ...form, bio: e.target.value })}
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {message && (
          <p className={`text-sm mb-4 ${message.includes('success') ? 'text-green-600' : 'text-red-600'}`}>
            {message}
          </p>
        )}

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 rounded-lg text-white font-medium disabled:opacity-50"
          style={{ background: 'var(--coral)' }}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  )
}
