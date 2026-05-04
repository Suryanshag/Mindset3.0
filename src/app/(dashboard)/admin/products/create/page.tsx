'use client'

import { useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { uploadToCloudinary } from '@/lib/cloudinary-upload'

export default function CreateProductPage() {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const [form, setForm] = useState({
    name: '',
    description: '',
    price: 0,
    stock: 0,
    image: '',
    sku: '',
    weight: 0.5,
    isActive: true,
    isDigital: false,
  })

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

    try {
      const body: Record<string, unknown> = {
        name: form.name,
        description: form.description,
        price: form.price,
        stock: form.stock,
        isActive: form.isActive,
        isDigital: form.isDigital,
      }
      if (form.image) body.image = form.image
      if (form.sku) body.sku = form.sku
      if (form.weight) body.weight = form.weight

      const res = await fetch('/api/admin/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (data.success) {
        router.push('/admin/products')
      } else {
        setError(data.error || 'Failed to create product')
      }
    } catch {
      setError('Failed to create product')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Add Product</h1>

      <form onSubmit={handleSubmit} className="bg-white rounded-xl p-6 shadow-sm border border-gray-100 max-w-2xl">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
            <input type="text" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required minLength={10} rows={4} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Price (₹)</label>
              <input type="number" value={form.price} onChange={(e) => setForm({ ...form, price: Number(e.target.value) })} min={1} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Stock</label>
              <input type="number" value={form.stock} onChange={(e) => setForm({ ...form, stock: Number(e.target.value) })} min={0} required className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">SKU (optional)</label>
              <input type="text" value={form.sku} onChange={(e) => setForm({ ...form, sku: e.target.value })} placeholder="e.g. PROD-001" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Weight (kg)</label>
              <input type="number" value={form.weight} onChange={(e) => setForm({ ...form, weight: Number(e.target.value) })} min={0.01} step={0.01} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Image (optional)</label>
            {form.image ? (
              <div className="flex items-center gap-2">
                <Image width={80} height={80} src={form.image} alt="Product" className="rounded object-cover" />
                <button type="button" onClick={() => setForm({ ...form, image: '' })} className="text-xs text-red-600">Remove</button>
              </div>
            ) : (
              <input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} className="text-sm text-gray-600" />
            )}
            {uploading && <p className="text-xs text-gray-500 mt-1">Uploading...</p>}
          </div>
          <div className="flex items-center gap-2">
            <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} id="isActive" />
            <label htmlFor="isActive" className="text-sm font-medium text-gray-700">Active</label>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <input type="checkbox" checked={form.isDigital} onChange={(e) => setForm({ ...form, isDigital: e.target.checked })} id="isDigital" />
              <label htmlFor="isDigital" className="text-sm font-medium text-gray-700">Digital Product</label>
            </div>
            {form.isDigital && (
              <p className="text-xs text-gray-400 mt-1 ml-5">Stock and weight are ignored for digital products</p>
            )}
          </div>
        </div>

        {error && <p className="text-sm text-red-600 mt-4">{error}</p>}

        <div className="flex gap-3 mt-6">
          <button type="submit" disabled={submitting} className="px-6 py-2 rounded-lg text-white font-medium disabled:opacity-50" style={{ background: 'var(--coral)' }}>
            {submitting ? 'Creating...' : 'Create Product'}
          </button>
          <button type="button" onClick={() => router.back()} className="px-6 py-2 rounded-lg bg-gray-200 text-gray-700 font-medium">Cancel</button>
        </div>
      </form>
    </div>
  )
}
