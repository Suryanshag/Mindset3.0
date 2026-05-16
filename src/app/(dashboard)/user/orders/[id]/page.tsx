import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import Image from 'next/image'
import { prisma } from '@/lib/prisma'
import PageHeader from '@/components/dashboard/page-header'
import { formatSessionDateLong } from '@/lib/format-date'
import ReorderButton from './reorder-button'

const PAYMENT_CHIP: Record<string, { label: string; cls: string }> = {
  PAID: { label: 'Paid', cls: 'bg-primary-tint text-primary' },
  PENDING: { label: 'Payment pending', cls: 'bg-accent-tint text-accent' },
  FAILED: { label: 'Payment failed', cls: 'bg-red-100 text-red-700' },
  REFUNDED: { label: 'Refunded', cls: 'bg-bg-card text-text-muted' },
}

const SHIPPING_CHIP: Record<string, { label: string; cls: string }> = {
  PENDING: { label: 'Awaiting shipment', cls: 'bg-accent-tint text-accent' },
  PROCESSING: { label: 'Processing', cls: 'bg-accent-tint text-accent' },
  SHIPPED: { label: 'Shipped', cls: 'bg-primary-tint text-primary' },
  DELIVERED: { label: 'Delivered', cls: 'bg-primary-tint text-primary' },
  RETURNED: { label: 'Returned', cls: 'bg-red-100 text-red-700' },
}

const SUPPORT_EMAIL = 'support@mindset.health'

interface ShippingAddressJSON {
  name?: string
  phone?: string
  addressLine1?: string
  addressLine2?: string
  city?: string
  state?: string
  pincode?: string
}

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const authSession = await auth()
  if (!authSession?.user?.id) redirect('/login')

  const order = await prisma.order.findFirst({
    where: { id, userId: authSession.user.id },
    include: {
      orderItems: {
        include: {
          product: {
            select: { id: true, name: true, image: true, isDigital: true },
          },
        },
      },
      payment: {
        select: {
          amount: true,
          status: true,
          razorpayPaymentId: true,
          createdAt: true,
        },
      },
    },
  })
  if (!order) notFound()

  const addr = (order.shippingAddress ?? {}) as ShippingAddressJSON
  const hasAddress = !!addr.addressLine1

  const subtotal = order.orderItems.reduce(
    (sum, oi) => sum + Number(oi.price) * oi.quantity,
    0
  )
  const deliveryCharge = Number(order.deliveryCharge)
  const total = Number(order.totalAmount)

  const payChip = PAYMENT_CHIP[order.paymentStatus] ?? PAYMENT_CHIP.PENDING
  const shipChip = SHIPPING_CHIP[order.shippingStatus] ?? SHIPPING_CHIP.PENDING

  const hasShipment =
    order.shippingStatus === 'SHIPPED' ||
    order.shippingStatus === 'DELIVERED' ||
    !!order.awbCode ||
    !!order.shiprocketOrderId

  const trackingHref =
    order.trackingUrl ??
    (order.shiprocketOrderId
      ? `https://app.shiprocket.in/tracking/${order.shiprocketOrderId}`
      : null)

  const orderLabel = order.orderNumber ?? `#${order.id.slice(-8).toUpperCase()}`
  const helpSubject = encodeURIComponent(`Help with order ${orderLabel}`)
  const razorpayShort = order.payment?.razorpayPaymentId
    ? order.payment.razorpayPaymentId.slice(-8)
    : null

  return (
    <div>
      <PageHeader title="Order details" back="/user/orders" />

      <div className="space-y-5 pt-4">
        {/* Heading: order number + placed date + status pills */}
        <div>
          <p className="text-[22px] lg:text-[24px] font-medium text-text">
            Order {orderLabel}
          </p>
          <p className="text-[13px] text-text-muted mt-1">
            Placed {formatSessionDateLong(order.createdAt)}
          </p>
          <div className="flex flex-wrap gap-2 mt-3">
            <span
              className={`text-[11px] font-medium uppercase tracking-[0.5px] px-2.5 py-1 rounded-full ${payChip.cls}`}
            >
              {payChip.label}
            </span>
            <span
              className={`text-[11px] font-medium uppercase tracking-[0.5px] px-2.5 py-1 rounded-full ${shipChip.cls}`}
            >
              {shipChip.label}
            </span>
          </div>
        </div>

        {/* Items */}
        <div
          className="bg-bg-card rounded-2xl overflow-hidden"
          style={{ border: '1px solid var(--color-border)' }}
        >
          <p className="text-[11px] font-medium text-text-faint uppercase tracking-[0.6px] px-4 pt-4">
            Items
          </p>
          <ul className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
            {order.orderItems.map((item) => (
              <li key={item.productId} className="flex items-center gap-3 px-4 py-3">
                <div className="w-[60px] h-[60px] rounded-lg bg-bg-app flex items-center justify-center shrink-0 overflow-hidden">
                  {item.product.image ? (
                    <Image
                      src={item.product.image}
                      alt={item.product.name}
                      width={60}
                      height={60}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-text-faint text-[24px]">{'\u{1F4E6}'}</span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-medium text-text">{item.product.name}</p>
                  <p className="text-[12px] text-text-muted mt-0.5">
                    Qty {item.quantity} · {'₹'}
                    {Number(item.price).toLocaleString('en-IN')} each
                  </p>
                </div>
                <p className="text-[14px] font-medium text-text shrink-0">
                  {'₹'}
                  {(Number(item.price) * item.quantity).toLocaleString('en-IN')}
                </p>
              </li>
            ))}
          </ul>
          <div
            className="px-4 py-3 bg-bg-app/50 space-y-1.5"
            style={{ borderTop: '1px solid var(--color-border)' }}
          >
            <div className="flex justify-between text-[13px] text-text-muted">
              <span>Subtotal</span>
              <span>{'₹'}{subtotal.toLocaleString('en-IN')}</span>
            </div>
            {deliveryCharge > 0 && (
              <div className="flex justify-between text-[13px] text-text-muted">
                <span>
                  Delivery{order.selectedCourierName ? ` (${order.selectedCourierName})` : ''}
                </span>
                <span>{'₹'}{deliveryCharge.toLocaleString('en-IN')}</span>
              </div>
            )}
            <div className="flex justify-between text-[15px] font-medium text-text pt-1">
              <span>Total</span>
              <span>{'₹'}{total.toLocaleString('en-IN')}</span>
            </div>
          </div>
        </div>

        {/* Shipping address */}
        {hasAddress && (
          <div>
            <p className="text-[11px] font-medium text-text-faint uppercase tracking-[0.6px] mb-2">
              Shipping to
            </p>
            <div
              className="bg-bg-card rounded-2xl p-4"
              style={{ border: '1px solid var(--color-border)' }}
            >
              <p className="text-[14px] text-text leading-relaxed">
                {addr.name && <>{addr.name}<br /></>}
                {addr.addressLine1}<br />
                {addr.addressLine2 && <>{addr.addressLine2}<br /></>}
                {addr.city}, {addr.state} — {addr.pincode}
                {addr.phone && (
                  <>
                    <br />
                    <span className="text-text-muted">{addr.phone}</span>
                  </>
                )}
              </p>
            </div>
          </div>
        )}

        {/* Delivery info */}
        {hasShipment && (
          <div>
            <p className="text-[11px] font-medium text-text-faint uppercase tracking-[0.6px] mb-2">
              Delivery
            </p>
            <div
              className="bg-bg-card rounded-2xl p-4 space-y-2"
              style={{ border: '1px solid var(--color-border)' }}
            >
              {order.courierName && (
                <p className="text-[13px] text-text">
                  <span className="text-text-muted">Courier:</span> {order.courierName}
                </p>
              )}
              {order.awbCode && (
                <p className="text-[13px] text-text">
                  <span className="text-text-muted">AWB:</span>{' '}
                  <span className="font-mono">{order.awbCode}</span>
                </p>
              )}
              {trackingHref && (
                <a
                  href={trackingHref}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block text-[13px] text-primary underline mt-1"
                >
                  Track shipment
                </a>
              )}
            </div>
          </div>
        )}

        {/* Payment info */}
        {order.payment && (
          <div>
            <p className="text-[11px] font-medium text-text-faint uppercase tracking-[0.6px] mb-2">
              Payment
            </p>
            <div
              className="bg-bg-card rounded-2xl p-4 space-y-1.5"
              style={{ border: '1px solid var(--color-border)' }}
            >
              <p className="text-[13px] text-text">
                <span className="text-text-muted">Amount:</span> {'₹'}
                {Number(order.payment.amount).toLocaleString('en-IN')}
              </p>
              <p className="text-[13px] text-text">
                <span className="text-text-muted">Method:</span> Razorpay
              </p>
              {order.payment.createdAt && (
                <p className="text-[13px] text-text">
                  <span className="text-text-muted">Paid on:</span>{' '}
                  {formatSessionDateLong(order.payment.createdAt)}
                </p>
              )}
              {razorpayShort && (
                <p className="text-[13px] text-text">
                  <span className="text-text-muted">Reference:</span>{' '}
                  <span className="font-mono">…{razorpayShort}</span>
                </p>
              )}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <ReorderButton />
          <a
            href={`mailto:${SUPPORT_EMAIL}?subject=${helpSubject}`}
            className="text-[14px] text-text-muted underline"
          >
            Need help?
          </a>
        </div>
      </div>
    </div>
  )
}
