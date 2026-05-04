'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import { format } from 'date-fns'
import Image from 'next/image'
import Link from 'next/link'
import {
  Clock,
  Settings,
  Truck,
  CheckCircle,
  ArrowLeft,
  ChevronDown,
  ChevronUp,
} from 'lucide-react'
import TrackingModal from '@/components/orders/tracking-modal'
import RazorpayCheckout from '@/components/payments/razorpay-checkout'

interface OrderItem {
  quantity: number
  price: string
  product: { name: string; image: string | null; isDigital: boolean }
}

interface Order {
  id: string
  totalAmount: string
  paymentStatus: string
  shippingStatus: string
  awbCode: string | null
  courierName: string | null
  createdAt: string
  shippingAddress: unknown
  orderItems: OrderItem[]
}

const SHIPPING_ICONS: Record<string, typeof Clock> = {
  PENDING: Clock,
  PROCESSING: Settings,
  SHIPPED: Truck,
  DELIVERED: CheckCircle,
  RETURNED: ArrowLeft,
}

const SHIPPING_COLORS: Record<string, { bg: string; text: string }> = {
  PENDING: { bg: '#FEF3C7', text: '#92400E' },
  PROCESSING: { bg: '#DBEAFE', text: '#1E40AF' },
  SHIPPED: { bg: '#E0E7FF', text: '#3730A3' },
  DELIVERED: { bg: '#D1FAE5', text: '#065F46' },
  RETURNED: { bg: '#FEE2E2', text: '#991B1B' },
}

const PAYMENT_COLORS: Record<string, { bg: string; text: string }> = {
  PAID: { bg: '#D1FAE5', text: '#065F46' },
  PENDING: { bg: '#FEF3C7', text: '#92400E' },
  FAILED: { bg: '#FEE2E2', text: '#991B1B' },
  REFUNDED: { bg: '#F3F4F6', text: '#374151' },
}

function isWithin24Hours(date: string | Date): boolean {
  return Date.now() - new Date(date).getTime() < 24 * 60 * 60 * 1000
}

export default function OrdersPage() {
  const { data: authSession } = useSession()
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [trackingOrderId, setTrackingOrderId] = useState<string | null>(null)
  const [resumingOrderId, setResumingOrderId] = useState<string | null>(null)
  const [paymentData, setPaymentData] = useState<{
    razorpayOrderId: string
    amount: number
    orderId: string
  } | null>(null)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  function fetchOrders() {
    fetch('/api/user/orders')
      .then((r) => r.json())
      .then((res) => {
        if (res.success) setOrders(res.data)
      })
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    fetchOrders()
  }, [])

  function toggleExpand(id: string) {
    const next = new Set(expanded)
    if (expanded.has(id)) { next.delete(id) } else { next.add(id) }
    setExpanded(next)
  }

  async function handleResumeOrder(orderId: string) {
    setResumingOrderId(orderId)
    setError('')
    try {
      const res = await fetch(`/api/payments/resume-order/${orderId}`, {
        method: 'POST',
      })
      const data = await res.json()
      if (!data.success) {
        setError(data.error ?? 'Failed to resume order')
        return
      }
      setPaymentData({
        razorpayOrderId: data.data.razorpayOrderId,
        amount: data.data.amount,
        orderId: data.data.orderId,
      })
    } catch {
      setError('Failed to resume order. Please try again.')
    } finally {
      setResumingOrderId(null)
    }
  }

  function handlePaymentSuccess() {
    setPaymentData(null)
    setSuccessMsg('Payment successful! Your order is being processed.')
    setTimeout(() => setSuccessMsg(''), 5000)
    fetchOrders()
  }

  function handlePaymentDismiss() {
    setPaymentData(null)
    setError('Payment cancelled. You can try again anytime.')
    setTimeout(() => setError(''), 5000)
  }

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--navy)' }}>
          My Orders
        </h1>
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="bg-white rounded-xl border border-gray-100 p-5 animate-pulse">
              <div className="h-4 w-48 bg-gray-200 rounded mb-3" />
              <div className="h-3 w-32 bg-gray-200 rounded" />
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6" style={{ color: 'var(--navy)' }}>
        My Orders
      </h1>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 px-4 py-2 rounded-lg mb-4">{error}</p>
      )}
      {successMsg && (
        <p className="text-sm text-green-700 bg-green-50 px-4 py-2 rounded-lg mb-4">{successMsg}</p>
      )}

      {orders.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-100 p-12 text-center text-gray-500">
          <p>No orders yet.</p>
          <Link
            href="/products"
            className="text-sm font-semibold mt-2 inline-block"
            style={{ color: 'var(--coral)' }}
          >
            Browse our products! &rarr;
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const isAllDigital = order.orderItems.every(oi => oi.product.isDigital)
            const ShipIcon = SHIPPING_ICONS[order.shippingStatus] ?? Clock
            const shipColor = SHIPPING_COLORS[order.shippingStatus] ?? SHIPPING_COLORS.PENDING
            const payColor = PAYMENT_COLORS[order.paymentStatus] ?? PAYMENT_COLORS.PENDING
            const isOpen = expanded.has(order.id)
            const canResume = order.paymentStatus === 'PENDING' && isWithin24Hours(order.createdAt)

            return (
              <div
                key={order.id}
                className="bg-white rounded-xl border border-gray-100 shadow-sm"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-sm font-mono text-gray-400">
                        #{order.id.slice(0, 8)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {format(new Date(order.createdAt), 'dd MMM yyyy, h:mm a')}
                      </p>
                      <div className="flex items-center gap-2 mt-2 flex-wrap">
                        <span
                          className="text-xs font-semibold px-2 py-0.5 rounded-full"
                          style={{ background: payColor.bg, color: payColor.text }}
                        >
                          {order.paymentStatus}
                        </span>
                        {isAllDigital ? (
                          <span
                            className="text-xs font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1"
                            style={{ background: '#D1FAE5', color: '#065F46' }}
                          >
                            <CheckCircle size={12} />
                            Available in Library
                          </span>
                        ) : (
                          <span
                            className="text-xs font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1"
                            style={{ background: shipColor.bg, color: shipColor.text }}
                          >
                            <ShipIcon size={12} />
                            {order.shippingStatus}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        {isAllDigital && order.paymentStatus === 'PAID' ? (
                          <Link
                            href="/user/library"
                            className="text-xs font-semibold inline-block"
                            style={{ color: 'var(--teal)' }}
                          >
                            Open Library &rarr;
                          </Link>
                        ) : !isAllDigital && order.shippingStatus !== 'PENDING' && order.shippingStatus !== 'DELIVERED' ? (
                          <button
                            onClick={() => setTrackingOrderId(order.id)}
                            className="text-xs font-semibold inline-block"
                            style={{ color: 'var(--teal)' }}
                          >
                            Track Order &rarr;
                          </button>
                        ) : null}
                        {canResume && (
                          <button
                            onClick={() => handleResumeOrder(order.id)}
                            disabled={resumingOrderId === order.id}
                            className="text-xs font-semibold px-3 py-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600 transition-colors disabled:opacity-50"
                          >
                            {resumingOrderId === order.id ? 'Resuming...' : 'Complete Payment'}
                          </button>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-lg font-bold" style={{ color: 'var(--navy)' }}>
                        &#8377;{Number(order.totalAmount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                      </p>
                      <button
                        onClick={() => toggleExpand(order.id)}
                        className="text-xs text-gray-400 mt-1 inline-flex items-center gap-1 hover:text-gray-600"
                      >
                        {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        {order.orderItems.length} item{order.orderItems.length !== 1 ? 's' : ''}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded items */}
                {isOpen && (
                  <div className="border-t border-gray-100 divide-y divide-gray-50">
                    {order.orderItems.map((item, i) => (
                      <div key={i} className="p-4 flex items-center gap-3">
                        <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 relative flex-shrink-0">
                          {item.product.image ? (
                            <Image
                              src={item.product.image}
                              alt={item.product.name}
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-300 text-xs">
                              N/A
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate" style={{ color: 'var(--navy)' }}>
                            {item.product.name}
                          </p>
                          <p className="text-xs text-gray-400">
                            Qty: {item.quantity}
                            {!isAllDigital && (
                              <span className={`ml-2 ${item.product.isDigital ? 'text-teal-600' : ''}`}>
                                {item.product.isDigital ? 'Available immediately' : ''}
                              </span>
                            )}
                          </p>
                        </div>
                        <p className="text-sm font-semibold" style={{ color: 'var(--navy)' }}>
                          &#8377;{Number(item.price).toLocaleString('en-IN')}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {trackingOrderId && (
        <TrackingModal
          orderId={trackingOrderId}
          onClose={() => setTrackingOrderId(null)}
        />
      )}

      {paymentData && authSession?.user && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-sm w-full text-center">
            <h3 className="text-lg font-bold mb-2" style={{ color: 'var(--navy)' }}>
              Complete Payment
            </h3>
            <p className="text-sm text-gray-500 mb-4">
              Pay to complete your order
            </p>
            <RazorpayCheckout
              orderId={paymentData.razorpayOrderId}
              amount={paymentData.amount}
              name={authSession.user.name ?? ''}
              email={authSession.user.email ?? ''}
              description="Mindset Products Order"
              onSuccess={handlePaymentSuccess}
              onDismiss={handlePaymentDismiss}
              buttonText={`Pay \u20B9${(paymentData.amount / 100).toLocaleString('en-IN')}`}
            />
            <button
              onClick={() => setPaymentData(null)}
              className="mt-3 text-sm text-gray-500 hover:text-gray-700"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
