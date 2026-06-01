import Image from 'next/image'
import { BCap, BCard, BChip } from './b-atoms'
import BPageHeader from './b-page-header'
import ReorderButton from '@/app/(dashboard)/user/orders/[id]/reorder-button'

// Phase 3h — Order detail (Direction B port).
// Server-renderable wrapper; reuses ReorderButton client component.

type OrderItem = {
  productId: string
  quantity: number
  price: number
  product: { name: string; image: string | null; isDigital: boolean }
}

type Props = {
  order: {
    id: string
    orderNumber: string | null
    paymentStatus: string
    shippingStatus: string
    totalAmount: number
    deliveryCharge: number
    selectedCourierName: string | null
    awbCode: string | null
    courierName: string | null
    trackingUrl: string | null
    shiprocketOrderId: number | null
    createdAt: Date
    items: OrderItem[]
  }
  shippingAddress: {
    name?: string
    phone?: string
    addressLine1?: string
    addressLine2?: string
    city?: string
    state?: string
    pincode?: string
  } | null
  payment: {
    amount: number
    status: string
    razorpayPaymentId: string | null
    createdAt: Date | null
  } | null
}

const SUPPORT_EMAIL = 'mindset.org.connect@gmail.com'

export default function BOrderDetail({ order, shippingAddress, payment }: Props) {
  const orderLabel = order.orderNumber ?? `#${order.id.slice(-8).toUpperCase()}`
  const breadcrumb = [
    { label: 'SHOP', href: '/user/shop' },
    { label: 'ORDERS', href: '/user/orders' },
    { label: orderLabel },
  ]
  const placedDate = order.createdAt.toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })
  const placedTime = order.createdAt.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
  const subtotal = order.items.reduce((sum, oi) => sum + oi.price * oi.quantity, 0)
  const itemsCount = order.items.reduce((sum, oi) => sum + oi.quantity, 0)

  const trackingHref =
    order.trackingUrl ??
    (order.shiprocketOrderId
      ? `https://app.shiprocket.in/tracking/${order.shiprocketOrderId}`
      : null)

  const stages: { l: string; key: 'PENDING' | 'PROCESSING' | 'SHIPPED' | 'DELIVERED' }[] = [
    { l: 'Placed', key: 'PENDING' },
    { l: 'Packed', key: 'PROCESSING' },
    { l: 'Shipped', key: 'SHIPPED' },
    { l: 'Delivered', key: 'DELIVERED' },
  ]
  const stageOrder: Record<typeof stages[number]['key'], number> = {
    PENDING: 0,
    PROCESSING: 1,
    SHIPPED: 2,
    DELIVERED: 3,
  }
  const currentStage =
    order.shippingStatus === 'RETURNED'
      ? -1
      : stageOrder[order.shippingStatus as keyof typeof stageOrder] ?? 0

  const sub = `Placed ${placedDate} · ${placedTime} IST · ${itemsCount} ${itemsCount === 1 ? 'item' : 'items'}`

  return (
    <>
      <BPageHeader title={`Order ${orderLabel}.`} breadcrumb={breadcrumb} back="/user/orders" sub={sub} ctas={['search']} />

      {/* Timeline */}
      <BCard padding={0}>
        <div style={{ padding: '20px 28px' }}>
          <BCap>Where it is</BCap>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(4, 1fr)',
              gap: 0,
              marginTop: 18,
              position: 'relative',
            }}
          >
            {stages.map((s, i) => {
              const done = i <= currentStage
              const here = i === currentStage
              return (
                <div
                  key={s.key}
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    position: 'relative',
                  }}
                >
                  {i < stages.length - 1 && (
                    <div
                      style={{
                        position: 'absolute',
                        top: 11,
                        left: '50%',
                        width: '100%',
                        height: 2,
                        background: i < currentStage ? 'var(--primary)' : 'var(--border)',
                      }}
                    />
                  )}
                  <div
                    style={{
                      width: 24,
                      height: 24,
                      borderRadius: '50%',
                      border: `2px solid ${done ? 'var(--primary)' : 'var(--border)'}`,
                      background: done ? 'var(--primary)' : 'var(--bg-card)',
                      zIndex: 2,
                      display: 'grid',
                      placeItems: 'center',
                    }}
                  >
                    {done && (
                      <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} />
                    )}
                  </div>
                  <div
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: 13,
                      fontWeight: 500,
                      marginTop: 8,
                      color: here ? 'var(--primary)' : done ? 'var(--text)' : 'var(--text-muted)',
                    }}
                  >
                    {s.l}
                  </div>
                </div>
              )
            })}
          </div>
          {trackingHref && (
            <div style={{ marginTop: 14, textAlign: 'center' }}>
              <a
                href={trackingHref}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 13,
                  padding: '9px 18px',
                  borderRadius: 999,
                  background: 'var(--primary)',
                  color: '#fff',
                  display: 'inline-block',
                  fontWeight: 500,
                }}
              >
                Track shipment ›
              </a>
            </div>
          )}
        </div>
      </BCard>

      <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 18 }}>
        {/* Items */}
        <BCard padding={0} style={{ overflow: 'hidden' }}>
          <div style={{ padding: '12px 18px', borderBottom: '1px solid var(--border)' }}>
            <BCap>
              {order.items.length} {order.items.length === 1 ? 'item' : 'items'} in this order
            </BCap>
          </div>
          {order.items.map((item, i) => (
            <div
              key={item.productId + i}
              style={{
                display: 'grid',
                gridTemplateColumns: '56px 1fr auto',
                gap: 14,
                padding: '12px 18px',
                alignItems: 'center',
                borderTop: i === 0 ? 'none' : '1px solid var(--border)',
              }}
            >
              <div
                style={{
                  width: 56,
                  height: 56,
                  background: 'var(--bg-paper)',
                  borderRadius: 6,
                  border: '1px solid var(--border)',
                  position: 'relative',
                  display: 'grid',
                  placeItems: 'center',
                  overflow: 'hidden',
                }}
              >
                {item.product.image ? (
                  <Image
                    fill
                    src={item.product.image}
                    alt={item.product.name}
                    sizes="56px"
                    style={{ objectFit: 'cover' }}
                    unoptimized
                  />
                ) : (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9, color: 'var(--text-faint)' }}>
                    [ img ]
                  </span>
                )}
              </div>
              <div>
                <div
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: 14,
                    lineHeight: 1.3,
                    color: 'var(--text)',
                  }}
                >
                  {item.product.name}
                </div>
                <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 2 }}>
                  qty {item.quantity}
                  {item.product.isDigital ? ' · download ready' : ''}
                </div>
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 13,
                  fontWeight: 500,
                  color: 'var(--text)',
                }}
              >
                ₹{(item.price * item.quantity).toLocaleString('en-IN')}
              </div>
            </div>
          ))}
        </BCard>

        {/* Summary + address */}
        <div className="flex flex-col gap-3.5">
          <BCard padding={16}>
            <BCap>{payment ? 'Paid' : 'Payment'}</BCap>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: 13.5,
                marginTop: 10,
              }}
            >
              <span style={{ color: 'var(--text-muted)' }}>Subtotal</span>
              <span>₹{subtotal.toLocaleString('en-IN')}</span>
            </div>
            {order.deliveryCharge > 0 && (
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  fontSize: 13.5,
                  marginTop: 6,
                }}
              >
                <span style={{ color: 'var(--text-muted)' }}>
                  Shipping{order.selectedCourierName ? ` (${order.selectedCourierName})` : ''}
                </span>
                <span>₹{order.deliveryCharge.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div
              style={{
                borderTop: '1px solid var(--border)',
                marginTop: 10,
                paddingTop: 10,
                display: 'flex',
                justifyContent: 'space-between',
                fontFamily: 'var(--font-heading)',
                fontSize: 16,
                fontWeight: 500,
              }}
            >
              <span>Total</span>
              <span>₹{order.totalAmount.toLocaleString('en-IN')}</span>
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <BChip kind={order.paymentStatus === 'PAID' ? 'primary' : 'accent'}>
                {order.paymentStatus}
              </BChip>
              <BChip kind="neutral">{order.shippingStatus}</BChip>
            </div>
            {payment?.razorpayPaymentId && (
              <p
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  color: 'var(--text-faint)',
                  marginTop: 10,
                  letterSpacing: '0.06em',
                }}
              >
                REF · …{payment.razorpayPaymentId.slice(-8)}
              </p>
            )}
          </BCard>

          {shippingAddress?.addressLine1 && (
            <BCard padding={16}>
              <BCap>Shipping to</BCap>
              <div style={{ fontSize: 13.5, marginTop: 8, color: 'var(--text)' }}>
                {shippingAddress.name}
              </div>
              <div
                style={{
                  fontSize: 12.5,
                  color: 'var(--text-muted)',
                  marginTop: 2,
                  lineHeight: 1.55,
                }}
              >
                {shippingAddress.addressLine1}
                {shippingAddress.addressLine2 && (
                  <>
                    <br />
                    {shippingAddress.addressLine2}
                  </>
                )}
                <br />
                {shippingAddress.city}, {shippingAddress.state} — {shippingAddress.pincode}
                {shippingAddress.phone && (
                  <>
                    <br />
                    {shippingAddress.phone}
                  </>
                )}
              </div>
              {trackingHref && (
                <a
                  href={trackingHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: 12,
                    color: 'var(--primary)',
                    display: 'inline-block',
                    marginTop: 10,
                  }}
                >
                  Track ›
                </a>
              )}
            </BCard>
          )}

          <BCard padding={14}>
            <div className="flex flex-col gap-2">
              <ReorderButton />
              <a
                href={`mailto:${SUPPORT_EMAIL}?subject=${encodeURIComponent(`Help with order ${orderLabel}`)}`}
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 12.5,
                  color: 'var(--text-muted)',
                  textAlign: 'center',
                  padding: '9px 14px',
                  borderRadius: 999,
                  border: '1px solid var(--border)',
                }}
              >
                Need help?
              </a>
            </div>
          </BCard>
        </div>
      </div>
    </>
  )
}
