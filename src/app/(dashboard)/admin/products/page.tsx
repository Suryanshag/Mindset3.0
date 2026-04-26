'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

interface Product {
  id: string
  name: string
  description: string
  price: string
  stock: number
  image: string | null
  isActive: boolean
  _count: { orderItems: number }
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/admin/products')
      .then((r) => r.json())
      .then((res) => { if (res.success) setProducts(res.data) })
      .finally(() => setLoading(false))
  }, [])

  async function toggleActive(id: string, isActive: boolean) {
    const res = await fetch(`/api/admin/products/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isActive: !isActive }),
    })
    const data = await res.json()
    if (data.success) {
      setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, isActive: !isActive } : p)))
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Are you sure you want to delete this product?')) return
    const res = await fetch(`/api/admin/products/${id}`, { method: 'DELETE' })
    const data = await res.json()
    if (data.success) {
      setProducts((prev) => prev.filter((p) => p.id !== id))
    } else {
      alert(data.error || 'Failed to delete')
    }
  }

  function stockBadge(stock: number) {
    if (stock === 0) return { label: 'Out of Stock', cls: 'bg-red-100 text-red-800' }
    if (stock < 5) return { label: 'Low Stock', cls: 'bg-yellow-100 text-yellow-800' }
    return { label: 'In Stock', cls: 'bg-green-100 text-green-800' }
  }

  if (loading) return <div className="p-8 text-gray-500">Loading products...</div>

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Products</h1>
        <Link
          href="/admin/products/create"
          className="px-4 py-2 rounded-lg text-sm font-medium text-white"
          style={{ background: 'var(--coral)' }}
        >
          Add Product
        </Link>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-medium text-gray-500">Product</th>
              <th className="text-right py-3 px-4 font-medium text-gray-500">Price</th>
              <th className="text-right py-3 px-4 font-medium text-gray-500">Stock</th>
              <th className="text-center py-3 px-4 font-medium text-gray-500">Status</th>
              <th className="text-right py-3 px-4 font-medium text-gray-500">Orders</th>
              <th className="text-right py-3 px-4 font-medium text-gray-500">Actions</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => {
              const badge = stockBadge(p.stock)
              return (
                <tr key={p.id} className="border-b border-gray-50">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      {p.image && <img src={p.image} alt="" className="w-10 h-10 rounded object-cover" />}
                      <span className="font-medium text-gray-900">{p.name}</span>
                    </div>
                  </td>
                  <td className="py-3 px-4 text-right text-gray-700">₹{Number(p.price).toLocaleString('en-IN')}</td>
                  <td className="py-3 px-4 text-right">
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${badge.cls}`}>
                      {p.stock} — {badge.label}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => toggleActive(p.id, p.isActive)}
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        p.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {p.isActive ? 'Active' : 'Inactive'}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-right text-gray-700">{p._count.orderItems}</td>
                  <td className="py-3 px-4 text-right">
                    <div className="flex justify-end gap-2">
                      <Link href={`/admin/products/${p.id}`} className="text-xs text-blue-600 hover:underline">Edit</Link>
                      <button onClick={() => handleDelete(p.id)} className="text-xs text-red-600 hover:underline">Delete</button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
        {products.length === 0 && <p className="p-6 text-center text-gray-500">No products yet.</p>}
      </div>
    </div>
  )
}
