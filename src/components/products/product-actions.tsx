'use client'

import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { useCart } from '@/lib/cart-context'
import { useState } from 'react'
import { ShoppingCart, Minus, Plus, Check, ArrowRight } from 'lucide-react'

interface ProductActionsProps {
  product: {
    id: string
    name: string
    price: number
    image: string | null
    stock: number
  }
}

export default function ProductActions({ product }: ProductActionsProps) {
  const { data: session } = useSession()
  const { addItem, updateQuantity, items } = useCart()
  const [added, setAdded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [isUpdating, setIsUpdating] = useState(false)
  const [error, setError] = useState('')

  const cartItem = items.find((i) => i.productId === product.id)
  const inCart = !!cartItem
  const quantity = cartItem?.quantity ?? 0

  async function handleAdd() {
    setLoading(true)
    setError('')
    try {
      await addItem(product.id)
      setAdded(true)
      setTimeout(() => setAdded(false), 1500)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add to cart')
    } finally {
      setLoading(false)
    }
  }

  async function handleQuantityChange(newQuantity: number) {
    if (isUpdating) return
    setIsUpdating(true)
    setError('')
    try {
      await updateQuantity(product.id, newQuantity)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update quantity')
    } finally {
      setIsUpdating(false)
    }
  }

  if (!session?.user) {
    return (
      <Link
        href="/login?callbackUrl=/products"
        className="mt-2 flex items-center justify-center gap-2 w-full py-2.5 px-5 rounded-xl text-sm font-semibold transition-all duration-200 hover:opacity-90"
        style={{ background: 'var(--teal)', color: '#fff' }}
        title="Login to purchase"
      >
        <ShoppingCart size={16} />
        Login to Purchase
      </Link>
    )
  }

  return (
    <div className="space-y-3">
      {error && (
        <p className="text-xs font-medium px-3 py-1.5 rounded-lg" style={{ color: '#dc2626', background: 'rgba(220,38,38,0.06)' }}>
          {error}
        </p>
      )}
      {inCart ? (
        <>
          {/* Unified quantity selector pill */}
          <div
            className="inline-flex items-center rounded-full overflow-hidden"
            style={{ border: '1.5px solid rgba(30,68,92,0.12)' }}
          >
            <button
              onClick={() => handleQuantityChange(quantity - 1)}
              disabled={isUpdating}
              className="w-10 h-10 flex items-center justify-center transition-all duration-150 disabled:opacity-40"
              style={{ color: 'var(--navy)' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(30,68,92,0.06)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <Minus size={15} strokeWidth={2.5} />
            </button>
            <span
              className="w-11 text-center text-sm font-bold tabular-nums select-none"
              style={{ color: 'var(--navy)' }}
            >
              {quantity}
            </span>
            <button
              onClick={() => handleQuantityChange(quantity + 1)}
              disabled={isUpdating || quantity >= product.stock}
              className="w-10 h-10 flex items-center justify-center transition-all duration-150 disabled:opacity-40"
              style={{ color: 'var(--navy)' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(30,68,92,0.06)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <Plus size={15} strokeWidth={2.5} />
            </button>
          </div>

          {/* View Cart link */}
          <Link
            href="/user/cart"
            className="flex items-center gap-1.5 text-sm font-semibold transition-opacity duration-150 hover:opacity-70 w-fit"
            style={{ color: 'var(--teal)' }}
          >
            View Cart
            <ArrowRight size={14} strokeWidth={2.5} />
          </Link>
        </>
      ) : (
        <button
          onClick={handleAdd}
          disabled={loading}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-white text-sm rounded-xl transition-all duration-200 font-semibold disabled:opacity-50"
          style={{ background: added ? '#059669' : 'var(--teal)' }}
        >
          {added ? <Check size={16} strokeWidth={2.5} /> : <ShoppingCart size={16} />}
          {loading ? 'Adding...' : added ? 'Added to Cart' : 'Add to Cart'}
        </button>
      )}
    </div>
  )
}
