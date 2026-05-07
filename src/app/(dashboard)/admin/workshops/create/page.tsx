'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { uploadToCloudinary } from '@/lib/cloudinary-upload'
import RichTextEditor from '@/components/ui/rich-text-editor'

type Presenter = {
  id: string
  name: string
  title: string
  tier: 'PROFESSIONAL' | 'ASSOCIATE'
}

type PresenterMode = 'existing' | 'new'

export default function CreateWorkshopPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [presenters, setPresenters] = useState<Presenter[]>([])
  const [presenterMode, setPresenterMode] = useState<PresenterMode>('existing')

  const [form, setForm] = useState({
    title: '',
    subtitle: '',
    description: '',
    image: '',
    date: '',
    durationMin: 60,
    priceRupees: 0,
    capacity: 50,
    minCapacity: 5,
    type: 'WORKSHOP' as 'WORKSHOP' | 'CIRCLE',
    presenterId: '',
    presenterSplitPct: 70,
    meetLink: '',
    isPublished: false,
  })

  const [newPresenter, setNewPresenter] = useState({
    name: '',
    title: '',
    tier: 'PROFESSIONAL' as 'PROFESSIONAL' | 'ASSOCIATE',
    bio: '',
    linkedinUrl: '',
  })

  useEffect(() => {
    fetch('/api/admin/presenters')
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setPresenters(res.data)
      })
      .catch(() => {})
  }, [])

  function selectType(t: 'WORKSHOP' | 'CIRCLE') {
    // Default split: WORKSHOP → 70/5, CIRCLE → 50/4.
    setForm({
      ...form,
      type: t,
      presenterSplitPct: t === 'CIRCLE' ? 50 : 70,
      minCapacity: t === 'CIRCLE' ? 4 : 5,
    })
  }

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
    setSubmitting(true)
    setError('')

    if (presenterMode === 'existing' && !form.presenterId) {
      setError('Please select a presenter or switch to "Add new"')
      setSubmitting(false)
      return
    }
    if (presenterMode === 'new' && (!newPresenter.name || !newPresenter.title)) {
      setError('New presenter requires name and title')
      setSubmitting(false)
      return
    }

    try {
      const body: Record<string, unknown> = {
        title: form.title,
        subtitle: form.subtitle || undefined,
        description: form.description,
        date: new Date(form.date).toISOString(),
        durationMin: form.durationMin,
        priceCents: Math.round(form.priceRupees * 100),
        capacity: form.capacity,
        minCapacity: form.minCapacity,
        type: form.type,
        presenterSplitPct: form.presenterSplitPct,
        isPublished: form.isPublished,
      }
      if (form.image) body.image = form.image
      if (form.meetLink) body.meetLink = form.meetLink

      if (presenterMode === 'existing') {
        body.presenterId = form.presenterId
      } else {
        body.newPresenter = {
          name: newPresenter.name,
          title: newPresenter.title,
          tier: newPresenter.tier,
          bio: newPresenter.bio || undefined,
          linkedinUrl: newPresenter.linkedinUrl || undefined,
        }
      }

      const res = await fetch('/api/admin/workshops', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (data.success) {
        router.push('/admin/workshops')
      } else {
        setError(data.error || 'Failed to create workshop')
      }
    } catch {
      setError('Failed to create workshop')
    } finally {
      setSubmitting(false)
    }
  }

  const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm'
  const labelCls = 'block text-sm font-medium text-gray-700 mb-1'

  const presenterCut = Math.round(form.priceRupees * (form.presenterSplitPct / 100))
  const platformCut = form.priceRupees - presenterCut

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Create Workshop</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 max-w-3xl space-y-6">

        {/* Type */}
        <div>
          <label className={labelCls}>Type</label>
          <div className="flex gap-2">
            {(['WORKSHOP', 'CIRCLE'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => selectType(t)}
                className="px-4 py-2 rounded-lg text-sm font-medium border"
                style={{
                  background: form.type === t ? 'var(--coral)' : 'white',
                  color: form.type === t ? 'white' : '#374151',
                  borderColor: form.type === t ? 'var(--coral)' : '#d1d5db',
                }}
              >
                {t === 'WORKSHOP' ? 'Workshop' : 'Circle'}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {form.type === 'WORKSHOP'
              ? 'Topic-led, expert-driven session'
              : 'Smaller, peer-led conversation'}
          </p>
        </div>

        <div>
          <label className={labelCls}>Title</label>
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            required
            className={inputCls}
          />
        </div>
        <div>
          <label className={labelCls}>Subtitle (optional)</label>
          <input
            type="text"
            value={form.subtitle}
            onChange={(e) => setForm({ ...form, subtitle: e.target.value })}
            className={inputCls}
            maxLength={300}
          />
        </div>

        <div>
          <label className={labelCls}>Description</label>
          <RichTextEditor
            value={form.description}
            onChange={(html) => setForm({ ...form, description: html })}
            placeholder="What will attendees learn? Who is it for?"
          />
        </div>

        {/* Presenter */}
        <div className="border border-gray-200 rounded-lg p-4 space-y-3 bg-gray-50">
          <div className="flex items-center justify-between">
            <label className="text-sm font-semibold text-gray-700">Presenter</label>
            <div className="flex gap-1 text-xs">
              <button
                type="button"
                onClick={() => setPresenterMode('existing')}
                className="px-3 py-1 rounded-md font-medium"
                style={{
                  background: presenterMode === 'existing' ? 'var(--navy)' : 'white',
                  color: presenterMode === 'existing' ? 'white' : '#374151',
                  border: '1px solid #d1d5db',
                }}
              >
                Existing
              </button>
              <button
                type="button"
                onClick={() => setPresenterMode('new')}
                className="px-3 py-1 rounded-md font-medium"
                style={{
                  background: presenterMode === 'new' ? 'var(--navy)' : 'white',
                  color: presenterMode === 'new' ? 'white' : '#374151',
                  border: '1px solid #d1d5db',
                }}
              >
                + Add new
              </button>
            </div>
          </div>

          {presenterMode === 'existing' ? (
            <div>
              <select
                value={form.presenterId}
                onChange={(e) => setForm({ ...form, presenterId: e.target.value })}
                className={inputCls}
              >
                <option value="">— Select presenter —</option>
                {presenters.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {p.title} ({p.tier === 'PROFESSIONAL' ? 'Pro' : 'Associate'})
                  </option>
                ))}
              </select>
              {presenters.length === 0 && (
                <p className="text-xs text-gray-500 mt-1">
                  No presenters yet. Switch to {'"'}+ Add new{'"'} to create one.
                </p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">Name *</label>
                  <input
                    type="text"
                    value={newPresenter.name}
                    onChange={(e) => setNewPresenter({ ...newPresenter, name: e.target.value })}
                    placeholder="Dr. Riya Mehta"
                    className={inputCls}
                  />
                </div>
                <div>
                  <label className="text-xs text-gray-600 mb-1 block">Title / Designation *</label>
                  <input
                    type="text"
                    value={newPresenter.title}
                    onChange={(e) => setNewPresenter({ ...newPresenter, title: e.target.value })}
                    placeholder="Clinical Psychologist"
                    className={inputCls}
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Tier</label>
                <select
                  value={newPresenter.tier}
                  onChange={(e) => setNewPresenter({ ...newPresenter, tier: e.target.value as 'PROFESSIONAL' | 'ASSOCIATE' })}
                  className={inputCls}
                >
                  <option value="PROFESSIONAL">Professional (qualified clinician)</option>
                  <option value="ASSOCIATE">Associate (student / early-career)</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-600 mb-1 block">Short bio (optional)</label>
                <textarea
                  value={newPresenter.bio}
                  onChange={(e) => setNewPresenter({ ...newPresenter, bio: e.target.value })}
                  rows={2}
                  placeholder="1-2 sentences shown on the workshop page"
                  className={inputCls}
                  maxLength={2000}
                />
              </div>
              <div>
                <label className="text-xs text-gray-600 mb-1 block">LinkedIn URL (optional)</label>
                <input
                  type="url"
                  value={newPresenter.linkedinUrl}
                  onChange={(e) => setNewPresenter({ ...newPresenter, linkedinUrl: e.target.value })}
                  placeholder="https://linkedin.com/in/..."
                  className={inputCls}
                />
              </div>
              <p className="text-xs text-gray-500">
                Payout details (UPI / PAN / bank) can be added later via Prisma Studio.
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Date & time</label>
            <input
              type="datetime-local"
              value={form.date}
              onChange={(e) => setForm({ ...form, date: e.target.value })}
              required
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Duration (minutes)</label>
            <input
              type="number"
              value={form.durationMin}
              onChange={(e) => setForm({ ...form, durationMin: parseInt(e.target.value) || 60 })}
              min={15}
              max={480}
              className={inputCls}
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Price (₹)</label>
            <input
              type="number"
              value={form.priceRupees}
              onChange={(e) => setForm({ ...form, priceRupees: parseFloat(e.target.value) || 0 })}
              min={0}
              step={1}
              className={inputCls}
            />
            <p className="text-xs text-gray-500 mt-1">0 = free</p>
          </div>
          <div>
            <label className={labelCls}>Max capacity</label>
            <input
              type="number"
              value={form.capacity}
              onChange={(e) => setForm({ ...form, capacity: parseInt(e.target.value) || 50 })}
              min={1}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Min to run</label>
            <input
              type="number"
              value={form.minCapacity}
              onChange={(e) => setForm({ ...form, minCapacity: parseInt(e.target.value) || 5 })}
              min={1}
              className={inputCls}
            />
            <p className="text-xs text-gray-500 mt-1">Auto-cancel if below</p>
          </div>
        </div>

        {form.priceRupees > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <label className={labelCls}>Presenter split (%)</label>
            <input
              type="number"
              value={form.presenterSplitPct}
              onChange={(e) => setForm({ ...form, presenterSplitPct: Math.max(0, Math.min(100, parseInt(e.target.value) || 0)) })}
              min={0}
              max={100}
              className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm"
            />
            <p className="text-xs text-gray-700 mt-2">
              At ₹{form.priceRupees}/seat: presenter gets <strong>₹{presenterCut}</strong>, Mindset gets <strong>₹{platformCut}</strong>.
              <br />
              <span className="text-amber-700">⚠ Internal — never shown to presenter or attendees.</span>
            </p>
          </div>
        )}

        <div>
          <label className={labelCls}>Google Meet / Zoom link (optional, can add later)</label>
          <input
            type="url"
            value={form.meetLink}
            onChange={(e) => setForm({ ...form, meetLink: e.target.value })}
            placeholder="https://meet.google.com/..."
            className={inputCls}
          />
          <p className="text-xs text-gray-500 mt-1">
            Shown to registered attendees from 10 min before start until 30 min after end.
          </p>
        </div>

        <div>
          <label className={labelCls}>Cover image (optional)</label>
          {form.image ? (
            <div className="flex items-center gap-2">
              <Image src={form.image} alt="Workshop" width={80} height={113} className="rounded object-cover" unoptimized />
              <button type="button" onClick={() => setForm({ ...form, image: '' })} className="text-xs text-red-600">
                Remove
              </button>
            </div>
          ) : (
            <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="text-sm text-gray-600" />
          )}
          {uploading && <p className="text-xs text-gray-500 mt-1">Uploading...</p>}
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
          <input
            type="checkbox"
            checked={form.isPublished}
            onChange={(e) => setForm({ ...form, isPublished: e.target.checked })}
            id="isPublished"
          />
          <label htmlFor="isPublished" className="text-sm font-medium text-gray-700">
            Publish immediately (visible to users)
          </label>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-2 rounded-lg text-white font-medium disabled:opacity-50"
            style={{ background: 'var(--coral)' }}
          >
            {submitting ? 'Creating...' : 'Create Workshop'}
          </button>
          <button type="button" onClick={() => router.back()} className="px-6 py-2 rounded-lg bg-gray-200 text-gray-700 font-medium">
            Cancel
          </button>
        </div>
      </form>
    </div>
  )
}
