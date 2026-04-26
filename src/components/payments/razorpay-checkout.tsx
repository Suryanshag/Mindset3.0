'use client'

import { useEffect, useCallback } from 'react'

interface RazorpayOptions {
  key: string
  amount: number
  currency: string
  name: string
  description: string
  order_id: string
  prefill?: {
    name?: string
    email?: string
    contact?: string
  }
  theme?: {
    color?: string
  }
  handler: (response: RazorpayResponse) => void
  modal?: {
    ondismiss?: () => void
  }
}

export interface RazorpayResponse {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
}

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => {
      open: () => void
    }
  }
}

interface RazorpayCheckoutProps {
  orderId: string
  amount: number
  name: string
  email: string
  phone?: string
  description: string
  onSuccess: (response: RazorpayResponse) => void
  onDismiss?: () => void
  buttonText?: string
  disabled?: boolean
  className?: string
}

export default function RazorpayCheckout({
  orderId,
  amount,
  name,
  email,
  phone,
  description,
  onSuccess,
  onDismiss,
  buttonText = 'Pay Now',
  disabled = false,
  className,
}: RazorpayCheckoutProps) {

  useEffect(() => {
    const existing = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')
    if (existing) return

    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    document.body.appendChild(script)
  }, [])

  const handlePayment = useCallback(() => {
    if (!window.Razorpay) {
      alert('Payment system is loading. Please try again.')
      return
    }

    const options: RazorpayOptions = {
      key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID!,
      amount,
      currency: 'INR',
      name: 'Mindset',
      description,
      order_id: orderId,
      prefill: {
        name,
        email,
        contact: phone,
      },
      theme: {
        color: '#0B9DA9',
      },
      handler: onSuccess,
      modal: {
        ondismiss: onDismiss,
      },
    }

    const rzp = new window.Razorpay(options)
    rzp.open()
  }, [orderId, amount, name, email, phone, description, onSuccess, onDismiss])

  return (
    <button
      onClick={handlePayment}
      disabled={disabled}
      className={className ?? "w-full py-3 px-6 font-semibold rounded-lg text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"}
      style={!className ? { background: 'var(--teal)' } : undefined}
    >
      {buttonText}
    </button>
  )
}
