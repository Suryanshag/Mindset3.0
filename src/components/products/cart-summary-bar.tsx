'use client'

import Link from 'next/link'
import { useCart } from '@/lib/cart-context'
import { ShoppingCart, ArrowRight } from 'lucide-react'

export default function CartSummaryBar() {
  const { totalItems, totalAmount } = useCart()

  if (totalItems === 0) return null

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-40 animate-fade-in-up"
      style={{ background: 'var(--navy)' }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3 text-white">
          <ShoppingCart size={20} />
          <span className="text-sm font-semibold">
            {totalItems} item{totalItems !== 1 ? 's' : ''} in cart
          </span>
          <span className="text-sm" style={{ color: 'rgba(255,248,235,0.6)' }}>—</span>
          <span className="text-sm font-bold" style={{ color: 'var(--amber)' }}>
            ₹{totalAmount.toLocaleString('en-IN')}
          </span>
        </div>
        <Link
          href="/user/cart"
          className="flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white transition-colors"
          style={{ background: 'var(--color-primary)' }}
        >
          View Cart
          <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  )
}
