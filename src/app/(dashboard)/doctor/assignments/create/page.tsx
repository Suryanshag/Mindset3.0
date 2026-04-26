'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { uploadToCloudinary } from '@/lib/cloudinary-upload'

interface Patient {
  id: string
  name: string
  email: string
}

export default function CreateAssignmentPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const preselectedUserId = searchParams.get('userId') ?? ''

  const [patients, setPatients] = useState<Patient[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    userId: preselectedUserId,
    title: '',
    type: 'CUSTOM' as string,
    description: '',
    instructions: '',
    fileUrl: '',
    dueDate: '',
  })

  useEffect(() => {
    fetch('/api/doctor/patients')
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setPatients(res.data)
      })
      .finally(() => setLoading(false))
  }, [])

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadToCloudinary(file)
      setForm({ ...form, fileUrl: url })
    } catch {
      setError('File upload failed')
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const body: Record<string, string> = {
        userId: form.userId,
        title: form.title,
        type: form.type,
      }
      if (form.description) body.description = form.description
      if (form.instructions) body.instructions = form.instructions
      if (form.fileUrl) body.fileUrl = form.fileUrl
      if (form.dueDate) body.dueDate = new Date(form.dueDate).toISOString()

      const res = await fetch('/api/doctor/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (data.success) {
        router.push('/doctor/assignments')
      } else {
        setError(data.error || 'Failed to create assignment')
      }
    } catch {
      setError('Failed to create assignment')
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) return <div className="p-8 text-gray-500">Loading...</div>

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Create Assignment</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 max-w-2xl">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Patient</label>
            <select
              value={form.userId}
              onChange={(e) => setForm({ ...form, userId: e.target.value })}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select a patient</option>
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.email})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              required
              minLength={2}
              maxLength={200}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type</label>
            <select
              value={form.type}
              onChange={(e) => setForm({ ...form, type: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="CUSTOM">Custom</option>
              <option value="JOURNAL_PROMPT">Journal prompt</option>
              <option value="READING">Reading</option>
              <option value="WORKSHEET">Worksheet</option>
              <option value="BREATHING">Breathing exercise</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Instructions</label>
            <textarea
              value={form.instructions}
              onChange={(e) => setForm({ ...form, instructions: e.target.value })}
              placeholder="Detailed instructions for the patient..."
              maxLength={5000}
              rows={4}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
            <textarea
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              maxLength={2000}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Attachment (optional)</label>
            {form.fileUrl ? (
              <div className="flex items-center gap-2">
                <a href={form.fileUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-blue-600 hover:underline">
                  File uploaded
                </a>
                <button type="button" onClick={() => setForm({ ...form, fileUrl: '' })} className="text-xs text-red-600">
                  Remove
                </button>
              </div>
            ) : (
              <input type="file" onChange={handleFileUpload} disabled={uploading} className="text-sm text-gray-600" />
            )}
            {uploading && <p className="text-xs text-gray-500 mt-1">Uploading...</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Due Date (optional)</label>
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {error && <p className="text-sm text-red-600 mt-4">{error}</p>}

        <div className="flex gap-3 mt-6">
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 rounded-lg text-white font-medium disabled:opacity-50"
            style={{ background: 'var(--coral)' }}
          >
            {submitting ? 'Creating...' : 'Create Assignment'}
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
