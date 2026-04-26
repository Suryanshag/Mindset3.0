'use client'

import { useCart } from '@/lib/cart-context'
import { Minus, Plus, Trash2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'

export default function CartPage() {
  const { items, isLoading, removeItem, updateQuantity, totalAmount } = useCart()

  if (isLoading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--navy)' }}>
          My Cart
        </h1>
        <div className="bg-white rounded-xl border border-gray-100 p-8 animate-pulse">
          <div className="h-16 bg-gray-200 rounded mb-3" />
          <div className="h-16 bg-gray-200 rounded mb-3" />
          <div className="h-16 bg-gray-200 rounded" />
        </div>
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--navy)' }}>
          My Cart
        </h1>
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center">
          <p className="text-gray-500 mb-4">Your cart is empty</p>
          <Link
            href="/products"
            className="inline-block px-6 py-2.5 rounded-lg text-sm font-semibold text-white"
            style={{ background: 'var(--teal)' }}
          >
            Browse Products
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--navy)' }}>
        My Cart
      </h1>

      <div className="flex flex-col lg:flex-row gap-6">
        {/* Cart items */}
        <div className="flex-1 space-y-3">
          {items.map((item) => (
            <div
              key={item.productId}
              className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-4"
            >
              <div className="w-16 h-16 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden relative">
                {item.image ? (
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="64px"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400 text-xl">
                    ?
                  </div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 text-sm truncate">
                  {item.name}
                </p>
                <p className="text-sm text-gray-500">
                  &#8377;{item.price.toLocaleString('en-IN')}
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                  className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50"
                >
                  <Minus size={14} />
                </button>
                <span className="text-sm font-medium w-6 text-center">
                  {item.quantity}
                </span>
                <button
                  onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                  className="w-7 h-7 rounded-full border border-gray-200 flex items-center justify-center hover:bg-gray-50"
                >
                  <Plus size={14} />
                </button>
              </div>

              <p className="font-semibold text-gray-900 text-sm w-20 text-right">
                &#8377;{(item.price * item.quantity).toLocaleString('en-IN')}
              </p>

              <button
                onClick={() => removeItem(item.productId)}
                className="text-gray-400 hover:text-red-500 transition-colors"
              >
                <Trash2 size={16} />
              </button>
            </div>
          ))}
        </div>

        {/* Order summary */}
        <div className="w-full lg:w-72">
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 sticky top-4">
            <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--navy)' }}>
              Order Summary
            </h2>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-500">Subtotal</span>
              <span className="font-semibold text-gray-900">
                &#8377;{totalAmount.toLocaleString('en-IN')}
              </span>
            </div>
            <div className="border-t border-gray-100 my-3" />
            <div className="flex justify-between text-sm font-bold mb-4">
              <span style={{ color: 'var(--navy)' }}>Total</span>
              <span style={{ color: 'var(--navy)' }}>
                &#8377;{totalAmount.toLocaleString('en-IN')}
              </span>
            </div>
            <Link
              href="/user/orders/checkout"
              className="block text-center w-full py-2.5 rounded-lg text-sm font-semibold text-white"
              style={{ background: 'var(--teal)' }}
            >
              Proceed to Checkout
            </Link>
            <Link
              href="/products"
              className="block text-center w-full py-2 mt-2 text-sm font-medium text-gray-500 hover:text-gray-700"
            >
              Continue Shopping
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
