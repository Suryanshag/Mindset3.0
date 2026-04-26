'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { Lock } from 'lucide-react'
import '@/components/payments/razorpay-checkout' // import for Window.Razorpay type

interface EbookActionsProps {
  studyMaterialId: string
  price: number
  title: string
}

export default function EbookActions({ studyMaterialId, price, title }: EbookActionsProps) {
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  // Load Razorpay script on mount
  useEffect(() => {
    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')
    if (existing) return
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    document.body.appendChild(script)
  }, [])

  if (!session?.user) {
    return (
      <Link
        href="/login?callbackUrl=/study-materials"
        className="flex items-center justify-center gap-2 w-full py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 hover:opacity-90"
        style={{ background: 'var(--teal)', color: '#fff' }}
      >
        <Lock size={16} />
        Login to Purchase
      </Link>
    )
  }

  async function handleBuy() {
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'EBOOK', studyMaterialId }),
      })
      const data = await res.json()
      if (!data.success) {
        setError(data.error ?? 'Failed to create order')
        setLoading(false)
        return
      }

      // Open Razorpay popup immediately
      if (!window.Razorpay) {
        setError('Payment system is loading. Please try again.')
        setLoading(false)
        return
      }

      const rzp = new window.Razorpay({
        key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
        amount: data.data.amount,
        currency: 'INR',
        name: 'Mindset',
        description: title,
        order_id: data.data.razorpayOrderId,
        prefill: {
          name: session!.user.name ?? '',
          email: session!.user.email ?? '',
        },
        theme: { color: '#0B9DA9' },
        handler: () => {
          setMessage('Purchase successful!')
        },
        modal: {
          ondismiss: () => {
            setLoading(false)
          },
        },
      })
      rzp.open()
      setLoading(false)
    } catch {
      setError('Something went wrong')
      setLoading(false)
    }
  }

  if (message) {
    return (
      <div className="space-y-2">
        <p className="text-sm text-green-700 bg-green-50 px-3 py-2 rounded-xl font-medium">{message}</p>
        <Link
          href="/user/ebooks"
          className="block text-center w-full py-2 px-4 text-sm rounded-xl font-semibold"
          style={{ color: 'var(--teal)' }}
        >
          View in My Library
        </Link>
      </div>
    )
  }

  return (
    <div>
      {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
      <button
        onClick={handleBuy}
        disabled={loading}
        className="w-full flex items-center justify-center gap-2 py-2.5 px-4 text-white text-sm rounded-xl font-semibold transition-all duration-200 disabled:opacity-50"
        style={{ background: 'var(--amber)' }}
      >
        <Lock size={16} />
        {loading ? 'Processing...' : `Buy Now — ₹${price}`}
      </button>
    </div>
  )
}
