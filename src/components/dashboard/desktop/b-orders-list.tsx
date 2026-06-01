'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import { BCard, BChip } from './b-atoms'
import BPageHeader from './b-page-header'
import TrackingModal from '@/components/orders/tracking-modal'
import RazorpayCheckout from '@/components/payments/razorpay-checkout'

// Phase 3h — Orders list (Direction B port).
// Preserves the existing resume-payment + Razorpay handler unchanged.

type OrderItem = {
  quantity: number
  price: string
  product: { name: string; image: string | null; isDigital: boolean }
}

type Order = {
  id: string
  orderNumber: string | null
  totalAmount: string
  paymentStatus: string
  shippingStatus: string
  awbCode: string | null
  courierName: string | null
  createdAt: string
  shippingAddress: unknown
  orderItems: OrderItem[]
}

type Filter = 'all' | 'on-the-way' | 'delivered' | 'pending-payment'

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'on-the-way', label: 'On the way' },
  { key: 'delivered', label: 'Delivered' },
  { key: 'pending-payment', label: 'Pending payment' },
]

function isWithin24Hours(date: string | Date): boolean {
  return Date.now() - new Date(date).getTime() < 24 * 60 * 60 * 1000
}

export default function BOrdersList({ orders }: { orders: Order[] }) {
  const router = useRouter()
  const { data: authSession } = useSession()
  const [filter, setFilter] = useState<Filter>('all')
  const [trackingOrderId, setTrackingOrderId] = useState<string | null>(null)
  const [resumingOrderId, setResumingOrderId] = useState<string | null>(null)
  const [paymentData, setPaymentData] = useState<{
    razorpayOrderId: string
    amount: number
    orderId: string
  } | null>(null)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

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
    router.refresh()
  }

  function handlePaymentDismiss() {
    setPaymentData(null)
    setError('Payment cancelled. You can try again anytime.')
    setTimeout(() => setError(''), 5000)
  }

  const counts = {
    all: orders.length,
    'on-the-way': orders.filter((o) =>
      ['PROCESSING', 'SHIPPED'].includes(o.shippingStatus),
    ).length,
    delivered: orders.filter((o) => o.shippingStatus === 'DELIVERED').length,
    'pending-payment': orders.filter((o) => o.paymentStatus === 'PENDING').length,
  } as Record<Filter, number>

  const filtered = orders.filter((o) => {
    if (filter === 'all') return true
    if (filter === 'on-the-way') return ['PROCESSING', 'SHIPPED'].includes(o.shippingStatus)
    if (filter === 'delivered') return o.shippingStatus === 'DELIVERED'
    if (filter === 'pending-payment') return o.paymentStatus === 'PENDING'
    return true
  })

  return (
    <>
      <BPageHeader
        title="Your orders."
        breadcrumb={[
          { label: 'SHOP', href: '/user/shop' },
          { label: 'ORDERS' },
        ]}
        back="/user/shop"
        sub={`${orders.length} placed · ${counts['on-the-way']} on the way`}
        ctas={['search']}
      />

      {/* Filter chips */}
      <div className="flex items-center gap-2">
        {FILTERS.map((f) => {
          const on = filter === f.key
          const count = counts[f.key] ?? 0
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 12,
                padding: '6px 12px',
                borderRadius: 999,
                background: on ? 'var(--ink)' : 'transparent',
                color: on ? '#fff' : 'var(--text-muted)',
                border: on ? 'none' : '1px solid var(--border)',
              }}
            >
              {f.label}{' '}
              <span style={{ opacity: 0.65, fontFamily: 'var(--font-mono)', fontSize: 10 }}>
                · {count}
              </span>
            </button>
          )
        })}
      </div>

      {error && (
        <p style={{ fontSize: 13, color: '#9A3412', background: 'var(--accent-tint)', padding: '8px 14px', borderRadius: 8 }}>
          {error}
        </p>
      )}
      {successMsg && (
        <p style={{ fontSize: 13, color: 'var(--primary)', background: 'var(--primary-tint)', padding: '8px 14px', borderRadius: 8 }}>
          {successMsg}
        </p>
      )}

      {filtered.length === 0 ? (
        <BCard style={{ textAlign: 'center', padding: '48px 24px' }}>
          <p
            style={{
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              fontSize: 14,
              color: 'var(--text-muted)',
            }}
          >
            {filter === 'all' ? 'No orders yet.' : 'Nothing in this filter.'}
          </p>
          {filter === 'all' && (
            <Link
              href="/user/shop"
              style={{
                display: 'inline-block',
                fontFamily: 'var(--font-heading)',
                fontSize: 13,
                padding: '9px 18px',
                borderRadius: 999,
                background: 'var(--primary)',
                color: '#fff',
                marginTop: 14,
              }}
            >
              Browse the shop
            </Link>
          )}
        </BCard>
      ) : (
        <BCard padding={0} style={{ overflow: 'hidden' }}>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '120px 100px 1fr 130px 110px 24px',
              gap: 16,
              padding: '10px 20px',
              borderBottom: '1px solid var(--border)',
              fontFamily: 'var(--font-mono)',
              fontSize: 10,
              color: 'var(--text-faint)',
              letterSpacing: '0.08em',
            }}
          >
            <span>ORDER</span>
            <span>PLACED</span>
            <span>ITEMS</span>
            <span>TOTAL</span>
            <span>STATUS</span>
            <span />
          </div>
          {filtered.map((o, i) => (
            <OrderRow
              key={o.id}
              order={o}
              first={i === 0}
              resumingOrderId={resumingOrderId}
              onResume={handleResumeOrder}
              onTrack={(id) => setTrackingOrderId(id)}
            />
          ))}
        </BCard>
      )}

      <p
        style={{
          fontFamily: 'var(--font-serif)',
          fontStyle: 'italic',
          fontSize: 13,
          color: 'var(--text-faint)',
          textAlign: 'center',
          padding: '6px 0',
        }}
      >
        Receipts and GST invoices are emailed automatically. All available here too.
      </p>

      {trackingOrderId && (
        <TrackingModal
          orderId={trackingOrderId}
          onClose={() => setTrackingOrderId(null)}
        />
      )}

      {paymentData && authSession?.user && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 50,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
        >
          <BCard padding={24} style={{ maxWidth: 360, width: '100%', textAlign: 'center' }}>
            <h3
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 18,
                fontWeight: 500,
                color: 'var(--text)',
                marginBottom: 8,
              }}
            >
              Complete payment
            </h3>
            <p style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
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
              buttonText={`Pay ₹${(paymentData.amount / 100).toLocaleString('en-IN')}`}
            />
            <button
              type="button"
              onClick={() => setPaymentData(null)}
              style={{
                marginTop: 12,
                fontFamily: 'var(--font-heading)',
                fontSize: 12,
                color: 'var(--text-muted)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Cancel
            </button>
          </BCard>
        </div>
      )}
    </>
  )
}

function OrderRow({
  order,
  first,
  resumingOrderId,
  onResume,
  onTrack,
}: {
  order: Order
  first: boolean
  resumingOrderId: string | null
  onResume: (id: string) => void
  onTrack: (id: string) => void
}) {
  const isAllDigital = order.orderItems.every((oi) => oi.product.isDigital)
  const canResume = order.paymentStatus === 'PENDING' && isWithin24Hours(order.createdAt)
  const orderLabel = order.orderNumber ?? `#${order.id.slice(0, 8).toUpperCase()}`
  const placedLabel = new Date(order.createdAt).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  const total = Number(order.totalAmount)
  const itemsCount = order.orderItems.length
  const previewNames = order.orderItems
    .slice(0, 2)
    .map((oi) => oi.product.name)
    .join(', ')
  const moreNote = itemsCount > 2 ? ` + ${itemsCount - 2} more` : ''

  let chipKind: 'primary' | 'neutral' | 'accent' = 'neutral'
  let chipLabel = order.shippingStatus
  if (order.paymentStatus === 'PENDING') {
    chipKind = 'accent'
    chipLabel = 'PAYMENT PENDING'
  } else if (isAllDigital && order.paymentStatus === 'PAID') {
    chipKind = 'primary'
    chipLabel = 'AVAILABLE'
  } else if (order.shippingStatus === 'DELIVERED') {
    chipKind = 'primary'
    chipLabel = 'DELIVERED'
  } else if (order.shippingStatus === 'SHIPPED' || order.shippingStatus === 'PROCESSING') {
    chipKind = 'primary'
    chipLabel = order.shippingStatus
  } else if (order.shippingStatus === 'RETURNED') {
    chipKind = 'accent'
    chipLabel = 'RETURNED'
  } else {
    chipKind = 'neutral'
    chipLabel = order.shippingStatus
  }

  return (
    <Link
      href={`/user/orders/${order.id}`}
      style={{
        display: 'grid',
        gridTemplateColumns: '120px 100px 1fr 130px 110px 24px',
        gap: 16,
        padding: '14px 20px',
        alignItems: 'center',
        borderTop: first ? 'none' : '1px solid var(--border)',
      }}
    >
      <div style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text)' }}>
        {orderLabel}
      </div>
      <div style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>{placedLabel}</div>
      <div>
        <div style={{ fontSize: 13.5, color: 'var(--text)' }}>
          {itemsCount} {itemsCount === 1 ? 'item' : 'items'}
        </div>
        <div
          style={{
            fontSize: 11.5,
            color: 'var(--text-faint)',
            marginTop: 2,
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
            display: '-webkit-box',
            WebkitLineClamp: 1,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {previewNames}{moreNote}
        </div>
      </div>
      <div
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 14,
          fontWeight: 500,
          color: 'var(--text)',
        }}
      >
        ₹{total.toLocaleString('en-IN')}
      </div>
      <div className="flex flex-col gap-1.5 items-start">
        <BChip kind={chipKind}>{chipLabel}</BChip>
        {canResume && (
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault()
              onResume(order.id)
            }}
            disabled={resumingOrderId === order.id}
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 11,
              padding: '4px 10px',
              borderRadius: 999,
              background: 'var(--accent)',
              color: '#fff',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            {resumingOrderId === order.id ? 'Resuming…' : 'Pay now'}
          </button>
        )}
        {!isAllDigital &&
          order.shippingStatus !== 'PENDING' &&
          order.shippingStatus !== 'DELIVERED' && (
            <button
              type="button"
              onClick={(e) => {
                e.preventDefault()
                onTrack(order.id)
              }}
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 11,
                color: 'var(--primary)',
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
              }}
            >
              Track ›
            </button>
          )}
      </div>
      <span style={{ color: 'var(--text-muted)' }}>›</span>
    </Link>
  )
}
