'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Lock } from 'lucide-react'
import { type RazorpayResponse } from '@/components/payments/razorpay-checkout'

interface EbookActionsProps {
  studyMaterialId: string
  price: number
  title: string
}

export default function EbookActions({ studyMaterialId, price, title }: EbookActionsProps) {
  const { data: session } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
        method: { upi: true, card: true, netbanking: true, wallet: true, emi: false },
        theme: { color: '#2D5A4F' },
        handler: async (response: RazorpayResponse) => {
          try {
            const verifyRes = await fetch('/api/payments/verify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                razorpayOrderId: data.data.razorpayOrderId,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              }),
            })
            const verifyData = await verifyRes.json()
            if (verifyData.success) {
              router.push(`/user/library/${studyMaterialId}`)
            } else {
              setError('Payment verified but entitlement failed. Please contact support.')
              setLoading(false)
            }
          } catch {
            setError('Payment recorded. Your library will update shortly.')
            setLoading(false)
          }
        },
        modal: {
          ondismiss: () => setLoading(false),
        },
      })
      rzp.open()
      setLoading(false)
    } catch {
      setError('Something went wrong')
      setLoading(false)
    }
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
