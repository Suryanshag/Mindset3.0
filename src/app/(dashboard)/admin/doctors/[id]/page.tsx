'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter, useParams } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { Wallet, AlertCircle, ShieldCheck, ShieldAlert } from 'lucide-react'
import { uploadToCloudinary } from '@/lib/cloudinary-upload'

type LicenseType = '' | 'RCI' | 'MCI' | 'State Medical Council' | 'Other'

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
  panNumber: string | null
  upiId: string | null
  payoutFullName: string | null
  licenseNumber: string | null
  licenseType: string | null
  licenseVerifiedAt: string | null
  licenseVerifiedBy: string | null
  licenseVerifierName: string | null
  user: { id: string; name: string; email: string; phone: string | null }
}

export default function EditDoctorPage() {
  const router = useRouter()
  const { id } = useParams<{ id: string }>()
  const { data: authSession } = useSession()
  const [doctor, setDoctor] = useState<Doctor | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [verifying, setVerifying] = useState(false)
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
    panNumber: '',
    upiId: '',
    payoutFullName: '',
    licenseNumber: '',
    licenseType: '' as LicenseType,
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
              panNumber: found.panNumber ?? '',
              upiId: found.upiId ?? '',
              payoutFullName: found.payoutFullName ?? '',
              licenseNumber: found.licenseNumber ?? '',
              licenseType: (found.licenseType ?? '') as LicenseType,
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

  // Verify/unverify is a single-purpose PATCH (just the action flag) so it
  // doesn't carry along any unsaved form edits. The PATCH route resolves
  // licenseVerifiedBy from the authenticated session; we mirror that
  // locally for optimistic UI without an extra refetch.
  async function handleVerifyToggle(verify: boolean) {
    if (!verify && !window.confirm('Are you sure? This will reset the verification.')) return
    setVerifying(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/doctors/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ licenseVerified: verify }),
      })
      const data = await res.json()
      if (!data.success) {
        setError(data.error || 'Failed to update verification')
        return
      }
      setDoctor((d) =>
        d
          ? {
              ...d,
              licenseVerifiedAt: verify ? new Date().toISOString() : null,
              licenseVerifiedBy: verify ? authSession?.user?.id ?? null : null,
              licenseVerifierName: verify ? authSession?.user?.name ?? null : null,
            }
          : d,
      )
    } catch {
      setError('Failed to update verification')
    } finally {
      setVerifying(false)
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
                <Image width={64} height={64} src={form.photo} alt="Doctor" className="rounded-full object-cover" />
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

          {/* Payout Details */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <Wallet className="w-5 h-5" style={{ color: 'var(--coral)' }} />
              <h2 className="text-base font-semibold text-gray-900">Payout Details</h2>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Used for weekly payouts. Edit only for support cases — doctor manages these themselves on their profile.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">PAN Number</label>
                <input
                  type="text"
                  value={form.panNumber}
                  onChange={(e) => setForm({ ...form, panNumber: e.target.value.toUpperCase() })}
                  placeholder="ABCDE1234F"
                  maxLength={10}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 font-mono"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Name (as on PAN)</label>
                <input
                  type="text"
                  value={form.payoutFullName}
                  onChange={(e) => setForm({ ...form, payoutFullName: e.target.value })}
                  placeholder="Full name on PAN card"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">UPI ID</label>
                <input
                  type="text"
                  value={form.upiId}
                  onChange={(e) => setForm({ ...form, upiId: e.target.value })}
                  placeholder="yourname@okhdfcbank"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 font-mono"
                />
              </div>
            </div>

            {(!form.panNumber || !form.upiId) && (
              <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-800">
                  Payout details incomplete — earnings cannot be settled until both PAN and UPI are filled.
                </p>
              </div>
            )}
          </div>

          {/* License & Credentialing — edit fields + verification panel */}
          <div className="mt-6 pt-6 border-t border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <ShieldCheck className="w-5 h-5" style={{ color: 'var(--coral)' }} />
              <h2 className="text-base font-semibold text-gray-900">License & Credentialing</h2>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">License Number</label>
                <input
                  type="text"
                  value={form.licenseNumber}
                  onChange={(e) => setForm({ ...form, licenseNumber: e.target.value })}
                  maxLength={50}
                  placeholder="A12345"
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">License Type</label>
                <select
                  value={form.licenseType}
                  onChange={(e) => setForm({ ...form, licenseType: e.target.value as LicenseType })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900"
                >
                  <option value="">Select…</option>
                  <option value="RCI">RCI</option>
                  <option value="MCI">MCI</option>
                  <option value="State Medical Council">State Medical Council</option>
                  <option value="Other">Other</option>
                </select>
              </div>
            </div>

            {(() => {
              const isVerified = !!doctor?.licenseVerifiedAt
              const hasLicense = !!doctor?.licenseNumber
              if (!isVerified && !hasLicense) {
                return (
                  <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg text-xs text-gray-500">
                    Save a License Number above (and select a type) before this doctor can be marked verified.
                  </div>
                )
              }
              if (!isVerified) {
                return (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between gap-3">
                    <div className="flex items-start gap-2 min-w-0">
                      <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <p className="text-xs text-amber-800">
                        License recorded but not yet verified by an admin.
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleVerifyToggle(true)}
                      disabled={verifying}
                      className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium text-white disabled:opacity-50"
                      style={{ background: 'var(--coral)' }}
                    >
                      {verifying ? 'Marking…' : 'Mark as Verified'}
                    </button>
                  </div>
                )
              }
              const verifiedAt = doctor?.licenseVerifiedAt
                ? new Date(doctor.licenseVerifiedAt).toLocaleDateString('en-IN', {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  })
                : ''
              const verifierName = doctor?.licenseVerifierName ?? 'Admin (deleted)'
              return (
                <div className="p-3 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between gap-3">
                  <div className="flex items-start gap-2 min-w-0">
                    <ShieldCheck className="w-4 h-4 text-green-600 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-green-800">
                      Verified on <span className="font-medium">{verifiedAt}</span> by{' '}
                      <span className="font-medium">{verifierName}</span>
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleVerifyToggle(false)}
                    disabled={verifying}
                    className="shrink-0 px-3 py-1.5 rounded-lg text-xs font-medium text-gray-700 border border-gray-300 bg-white disabled:opacity-50"
                  >
                    {verifying ? 'Updating…' : 'Unverify'}
                  </button>
                </div>
              )
            })()}
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
