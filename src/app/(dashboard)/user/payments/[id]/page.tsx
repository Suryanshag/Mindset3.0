'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import { format } from 'date-fns'
import Link from 'next/link'

interface PaymentDetail {
  id: string
  amount: string
  type: string
  status: string
  razorpayOrderId: string | null
  razorpayPaymentId: string | null
  createdAt: string
  session: {
    id: string
    date: string
    status: string
    meetLink: string | null
    doctor: {
      user: { name: string }
      designation: string
    }
  } | null
  order: {
    id: string
    shippingStatus: string
    awbCode: string | null
    orderItems: {
      quantity: number
      price: string
      product: { name: string }
    }[]
  } | null
  studyMaterial: {
    title: string
    fileUrl?: string
  } | null
}

const STATUS_COLORS: Record<string, { bg: string; text: string }> = {
  PAID: { bg: '#D1FAE5', text: '#065F46' },
  PENDING: { bg: '#FEF3C7', text: '#92400E' },
  FAILED: { bg: '#FEE2E2', text: '#991B1B' },
  REFUNDED: { bg: '#F3F4F6', text: '#374151' },
}

export default function PaymentDetailPage() {
  const { id } = useParams<{ id: string }>()
  const [payment, setPayment] = useState<PaymentDetail | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    fetch(`/api/user/payments/${id}`)
      .then(r => r.json())
      .then(res => {
        if (res.success) setPayment(res.data)
        else setError(res.error ?? 'Payment not found')
      })
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--navy)' }}>
          Payment Details
        </h1>
        <div className="bg-white rounded-xl border border-gray-100 p-8 animate-pulse">
          <div className="h-6 w-48 bg-gray-200 rounded mb-4" />
          <div className="h-4 w-32 bg-gray-200 rounded mb-2" />
          <div className="h-4 w-64 bg-gray-200 rounded" />
        </div>
      </div>
    )
  }

  if (error || !payment) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--navy)' }}>
          Payment Details
        </h1>
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-500">
          {error || 'Payment not found'}
        </div>
        <Link href="/user/payments" className="text-sm font-semibold mt-4 inline-block" style={{ color: 'var(--coral)' }}>
          &larr; Back to Payments
        </Link>
      </div>
    )
  }

  const statusColor = STATUS_COLORS[payment.status] ?? STATUS_COLORS.PENDING

  return (
    <div>
      <Link href="/user/payments" className="text-sm font-semibold mb-4 inline-block" style={{ color: 'var(--coral)' }}>
        &larr; Back to Payments
      </Link>

      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--navy)' }}>
        Payment Details
      </h1>

      {/* Payment info */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-4 space-y-3">
        <div className="flex items-center justify-between">
          <span
            className="text-xs font-semibold px-3 py-1 rounded-full"
            style={{ background: statusColor.bg, color: statusColor.text }}
          >
            {payment.status}
          </span>
          <p className="text-2xl font-bold" style={{ color: 'var(--navy)' }}>
            &#8377;{Number(payment.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="text-sm text-gray-500 space-y-1">
          <p>Type: <span className="font-medium text-gray-700">{payment.type}</span></p>
          <p>Date: {format(new Date(payment.createdAt), 'dd MMM yyyy, h:mm a')}</p>
          {payment.razorpayPaymentId && (
            <p>Razorpay ID: <span className="font-mono text-xs">{payment.razorpayPaymentId}</span></p>
          )}
          {payment.razorpayOrderId && (
            <p>Order ID: <span className="font-mono text-xs">{payment.razorpayOrderId}</span></p>
          )}
        </div>
      </div>

      {/* Session details */}
      {payment.type === 'SESSION' && payment.session && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-4">
          <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--navy)' }}>Session Details</h2>
          <div className="text-sm space-y-2">
            <p>Doctor: <span className="font-semibold">{payment.session.doctor.user.name}</span></p>
            <p className="text-gray-500">{payment.session.doctor.designation}</p>
            <p>Date: {format(new Date(payment.session.date), 'dd MMM yyyy, h:mm a')}</p>
            <p>Status: <span className="font-medium">{payment.session.status}</span></p>
            {payment.session.meetLink && payment.session.status === 'CONFIRMED' && (
              <a
                href={payment.session.meetLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block mt-2 px-4 py-2 rounded-lg text-sm font-semibold text-white"
                style={{ background: 'var(--teal)' }}
              >
                Join Session
              </a>
            )}
          </div>
        </div>
      )}

      {/* Order details */}
      {payment.type === 'PRODUCT' && payment.order && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-4">
          <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--navy)' }}>Order Details</h2>
          <div className="text-sm space-y-2">
            <p>Shipping: <span className="font-medium">{payment.order.shippingStatus}</span></p>
            {payment.order.awbCode && (
              <p>AWB: <span className="font-mono">{payment.order.awbCode}</span></p>
            )}
            <div className="border-t border-gray-100 pt-3 mt-3 space-y-2">
              {payment.order.orderItems.map((item, i) => (
                <div key={i} className="flex justify-between">
                  <span>{item.product.name} x{item.quantity}</span>
                  <span className="font-medium">₹{Number(item.price).toLocaleString('en-IN')}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* E-book details */}
      {payment.type === 'EBOOK' && payment.studyMaterial && (
        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 mb-4">
          <h2 className="text-lg font-bold mb-3" style={{ color: 'var(--navy)' }}>E-Book Details</h2>
          <p className="text-sm font-semibold">{payment.studyMaterial.title}</p>
          {payment.status === 'PAID' && payment.studyMaterial.fileUrl && (
            <a
              href={payment.studyMaterial.fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-block mt-3 px-4 py-2 rounded-lg text-sm font-semibold text-white"
              style={{ background: 'var(--teal)' }}
            >
              Download E-Book
            </a>
          )}
        </div>
      )}
    </div>
  )
}
