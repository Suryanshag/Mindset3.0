'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { useRouter, useParams } from 'next/navigation'
import { uploadToCloudinary } from '@/lib/cloudinary-upload'
import RichTextEditor from '@/components/ui/rich-text-editor'

type Presenter = {
  id: string
  name: string
  title: string
  tier: 'PROFESSIONAL' | 'ASSOCIATE'
}

export default function EditWorkshopPage() {
  const router = useRouter()
  const params = useParams<{ id: string }>()
  const id = params.id

  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [presenters, setPresenters] = useState<Presenter[]>([])

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
    status: 'SCHEDULED' as 'SCHEDULED' | 'LIVE' | 'COMPLETED' | 'CANCELLED',
    presenterId: '',
    presenterSplitPct: 70,
    meetLink: '',
    isPublished: false,
  })

  useEffect(() => {
    Promise.all([
      fetch(`/api/admin/workshops/${id}`).then((r) => r.json()),
      fetch('/api/admin/presenters').then((r) => r.json()),
    ])
      .then(([wsRes, presRes]) => {
        if (wsRes.success) {
          const w = wsRes.data
          const dateLocal = new Date(w.startsAt).toISOString().slice(0, 16)
          setForm({
            title: w.title || '',
            subtitle: w.subtitle || '',
            description: w.description || '',
            image: w.coverImageUrl || '',
            date: dateLocal,
            durationMin: w.durationMin || 60,
            priceRupees: (w.priceCents || 0) / 100,
            capacity: w.capacity || 50,
            minCapacity: w.minCapacity || 5,
            type: w.type || 'WORKSHOP',
            status: w.status || 'SCHEDULED',
            presenterId: w.presenterId || '',
            presenterSplitPct: w.presenterSplitPct ?? 70,
            meetLink: w.meetLink || '',
            isPublished: w.published,
          })
        } else {
          setError(wsRes.error || 'Failed to load workshop')
        }
        if (presRes.success) setPresenters(presRes.data)
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
        subtitle: form.subtitle || undefined,
        description: form.description,
        date: new Date(form.date).toISOString(),
        durationMin: form.durationMin,
        priceCents: Math.round(form.priceRupees * 100),
        capacity: form.capacity,
        minCapacity: form.minCapacity,
        type: form.type,
        status: form.status,
        presenterId: form.presenterId || undefined,
        presenterSplitPct: form.presenterSplitPct,
        meetLink: form.meetLink || undefined,
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

  const inputCls = 'w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm'
  const labelCls = 'block text-sm font-medium text-gray-700 mb-1'

  const presenterCut = Math.round(form.priceRupees * (form.presenterSplitPct / 100))
  const platformCut = form.priceRupees - presenterCut

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Edit Workshop</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 max-w-3xl space-y-6">

        <div>
          <label className={labelCls}>Status</label>
          <select
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value as typeof form.status })}
            className={inputCls}
          >
            <option value="SCHEDULED">Scheduled</option>
            <option value="LIVE">Live</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>

        <div>
          <label className={labelCls}>Type</label>
          <div className="flex gap-2">
            {(['WORKSHOP', 'CIRCLE'] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setForm({ ...form, type: t })}
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
        </div>

        <div>
          <label className={labelCls}>Title</label>
          <input type="text" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required className={inputCls} />
        </div>
        <div>
          <label className={labelCls}>Subtitle (optional)</label>
          <input type="text" value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} className={inputCls} maxLength={300} />
        </div>

        <div>
          <label className={labelCls}>Description</label>
          <RichTextEditor value={form.description} onChange={(html) => setForm({ ...form, description: html })} placeholder="Workshop details..." />
        </div>

        <div>
          <label className={labelCls}>Presenter</label>
          <select
            value={form.presenterId}
            onChange={(e) => setForm({ ...form, presenterId: e.target.value })}
            className={inputCls}
          >
            <option value="">— None —</option>
            {presenters.map((p) => (
              <option key={p.id} value={p.id}>
                {p.name} — {p.title} ({p.tier === 'PROFESSIONAL' ? 'Pro' : 'Associate'})
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            To add a brand-new presenter, use Create Workshop.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className={labelCls}>Date & time</label>
            <input type="datetime-local" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Duration (minutes)</label>
            <input type="number" value={form.durationMin} onChange={(e) => setForm({ ...form, durationMin: parseInt(e.target.value) || 60 })} min={15} max={480} className={inputCls} />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className={labelCls}>Price (₹)</label>
            <input type="number" value={form.priceRupees} onChange={(e) => setForm({ ...form, priceRupees: parseFloat(e.target.value) || 0 })} min={0} step={1} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Max capacity</label>
            <input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: parseInt(e.target.value) || 50 })} min={1} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Min to run</label>
            <input type="number" value={form.minCapacity} onChange={(e) => setForm({ ...form, minCapacity: parseInt(e.target.value) || 5 })} min={1} className={inputCls} />
          </div>
        </div>

        {form.priceRupees > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
            <label className={labelCls}>Presenter split (%)</label>
            <input type="number" value={form.presenterSplitPct} onChange={(e) => setForm({ ...form, presenterSplitPct: Math.max(0, Math.min(100, parseInt(e.target.value) || 0)) })} min={0} max={100} className="w-32 px-3 py-2 border border-gray-300 rounded-lg text-gray-900 text-sm" />
            <p className="text-xs text-gray-700 mt-2">
              At ₹{form.priceRupees}/seat: presenter gets <strong>₹{presenterCut}</strong>, Mindset gets <strong>₹{platformCut}</strong>.
              <br />
              <span className="text-amber-700">⚠ Internal — never shown externally.</span>
            </p>
          </div>
        )}

        <div>
          <label className={labelCls}>Google Meet / Zoom link</label>
          <input type="url" value={form.meetLink} onChange={(e) => setForm({ ...form, meetLink: e.target.value })} placeholder="https://meet.google.com/..." className={inputCls} />
        </div>

        <div>
          <label className={labelCls}>Cover image</label>
          {form.image ? (
            <div className="flex items-center gap-2">
              <Image src={form.image} alt="Workshop" width={80} height={113} className="rounded object-cover" unoptimized />
              <button type="button" onClick={() => setForm({ ...form, image: '' })} className="text-xs text-red-600">Remove</button>
            </div>
          ) : (
            <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="text-sm text-gray-600" />
          )}
        </div>

        <div className="flex items-center gap-2 pt-2 border-t border-gray-100">
          <input type="checkbox" checked={form.isPublished} onChange={(e) => setForm({ ...form, isPublished: e.target.checked })} id="isPublished" />
          <label htmlFor="isPublished" className="text-sm font-medium text-gray-700">Published</label>
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <div className="flex gap-3 pt-2">
          <button type="submit" disabled={saving} className="px-6 py-2 rounded-lg text-white font-medium disabled:opacity-50" style={{ background: 'var(--coral)' }}>
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
          <button type="button" onClick={() => router.back()} className="px-6 py-2 rounded-lg bg-gray-200 text-gray-700 font-medium">Cancel</button>
        </div>
      </form>
    </div>
  )
}
