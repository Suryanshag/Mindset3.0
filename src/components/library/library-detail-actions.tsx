'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { type RazorpayResponse } from '@/components/payments/razorpay-checkout'

interface Props {
  materialId: string
  title: string
  price: number
  isOwned: boolean
  isFree: boolean
}

export default function LibraryDetailActions({ materialId, title, price, isOwned, isFree }: Props) {
  const router = useRouter()
  const { data: session } = useSession()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (isOwned || isFree) return
    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')
    if (existing) return
    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    document.body.appendChild(script)
  }, [isOwned, isFree])

  async function handleBuy() {
    setLoading(true)
    setError('')

    try {
      const res = await fetch('/api/payments/create-order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: 'EBOOK', studyMaterialId: materialId }),
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
          name: session?.user?.name ?? '',
          email: session?.user?.email ?? '',
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
              router.refresh()
            } else {
              setError('Payment verified but entitlement failed. Please contact support.')
              setLoading(false)
            }
          } catch {
            setError('Payment recorded. Your library will update shortly.')
            setLoading(false)
          }
        },
        modal: { ondismiss: () => setLoading(false) },
      })
      rzp.open()
      setLoading(false)
    } catch {
      setError('Something went wrong')
      setLoading(false)
    }
  }

  const readUrl = `/api/user/ebooks/${materialId}/serve`
  const downloadUrl = `/api/user/ebooks/${materialId}/serve?download=1`

  if (isOwned || isFree) {
    return (
      <>
        <div className="space-y-2">
          <a
            href={readUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center w-full py-3 px-6 rounded-2xl text-[15px] font-semibold text-white"
            style={{ background: 'var(--color-primary)' }}
          >
            Read →
          </a>
          <a
            href={downloadUrl}
            className="block text-center text-[13px] font-medium text-primary py-2"
          >
            Download
          </a>
        </div>

        {/* Mobile sticky CTA — sits above the bottom nav (~56px + safe area) */}
        <div
          className="fixed bottom-[72px] left-0 right-0 px-4 pb-3 lg:hidden z-20"
          style={{ background: 'linear-gradient(to top, var(--bg-app) 75%, transparent)' }}
        >
          <a
            href={readUrl}
            target="_blank"
            rel="noreferrer"
            className="flex items-center justify-center w-full py-3.5 px-6 rounded-2xl text-[15px] font-semibold text-white"
            style={{ background: 'var(--color-primary)' }}
          >
            Read →
          </a>
        </div>
      </>
    )
  }

  return (
    <>
      {error && <p className="text-xs text-red-600 mb-2">{error}</p>}
      <button
        onClick={handleBuy}
        disabled={loading}
        className="w-full py-3 px-6 rounded-2xl text-[15px] font-semibold text-white disabled:opacity-50"
        style={{ background: 'var(--color-primary)' }}
      >
        {loading ? 'Processing...' : `Buy ₹${price.toLocaleString('en-IN')}`}
      </button>

      {/* Mobile sticky CTA */}
      <div
        className="fixed bottom-[72px] left-0 right-0 px-4 pb-3 lg:hidden z-20"
        style={{ background: 'linear-gradient(to top, var(--bg-app) 75%, transparent)' }}
      >
        <button
          onClick={handleBuy}
          disabled={loading}
          className="w-full py-3.5 px-6 rounded-2xl text-[15px] font-semibold text-white disabled:opacity-50"
          style={{ background: 'var(--color-primary)' }}
        >
          {loading ? 'Processing...' : `Buy ₹${price.toLocaleString('en-IN')}`}
        </button>
      </div>
    </>
  )
}
