'use client'

import { useEffect } from 'react'
import { useCart } from '@/lib/cart-context'
import Image from 'next/image'
import Link from 'next/link'
import { BCap, BCard } from './b-atoms'
import BPageHeader from './b-page-header'

// Phase 3h — Cart (Direction B port). All cart operations come from the
// existing CartProvider; this is purely visual.

export default function BCart() {
  const { items, isLoading, removeItem, updateQuantity, totalAmount, refresh } = useCart()

  useEffect(() => {
    refresh()
  }, [refresh])

  if (isLoading) {
    return (
      <>
        <BPageHeader
          title="Your cart."
          breadcrumb={[
            { label: 'SHOP', href: '/user/shop' },
            { label: 'CART' },
          ]}
          back="/user/shop"
          sub="Loading…"
          ctas={['search']}
        />
        <BCard>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>One moment.</p>
        </BCard>
      </>
    )
  }

  if (items.length === 0) {
    return (
      <>
        <BPageHeader
          title="Your cart."
          breadcrumb={[
            { label: 'SHOP', href: '/user/shop' },
            { label: 'CART' },
          ]}
          back="/user/shop"
          sub="Empty for now"
          ctas={['search']}
        />
        <BCard style={{ textAlign: 'center', padding: '48px 24px' }}>
          <p style={{ fontSize: 14, color: 'var(--text-muted)' }}>
            Your cart is empty.
          </p>
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
              fontWeight: 500,
              marginTop: 14,
            }}
          >
            Browse the shop
          </Link>
        </BCard>
      </>
    )
  }

  const itemsCount = items.reduce((sum, i) => sum + i.quantity, 0)
  const subtotal = totalAmount

  return (
    <>
      <BPageHeader
        title="Your cart."
        breadcrumb={[
          { label: 'SHOP', href: '/user/shop' },
          { label: 'CART' },
        ]}
        back="/user/shop"
        sub={`${itemsCount} ${itemsCount === 1 ? 'item' : 'items'} · review and check out · IST`}
        ctas={['search']}
      />

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 18 }}>
        {/* Items card */}
        <BCard padding={0} style={{ overflow: 'hidden' }}>
          {items.map((item, i) => (
            <div
              key={item.productId}
              style={{
                display: 'grid',
                gridTemplateColumns: '80px 1fr 100px 90px 24px',
                gap: 16,
                padding: '16px 18px',
                alignItems: 'center',
                borderTop: i === 0 ? 'none' : '1px solid var(--border)',
              }}
            >
              <div
                style={{
                  width: 80,
                  height: 80,
                  background: 'var(--bg-paper)',
                  borderRadius: 8,
                  border: '1px solid var(--border)',
                  position: 'relative',
                  overflow: 'hidden',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                {item.image ? (
                  <Image
                    fill
                    src={item.image}
                    alt={item.name}
                    sizes="80px"
                    style={{ objectFit: 'cover' }}
                    unoptimized
                  />
                ) : (
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--text-faint)' }}>
                    [ img ]
                  </span>
                )}
              </div>
              <div>
                <div
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: 16,
                    lineHeight: 1.3,
                    color: 'var(--text)',
                  }}
                >
                  {item.name}
                </div>
                <div
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontStyle: 'italic',
                    fontSize: 12.5,
                    color: 'var(--text-muted)',
                    marginTop: 4,
                  }}
                >
                  ₹{item.price.toLocaleString('en-IN')} each
                </div>
              </div>
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  border: '1px solid var(--border)',
                  borderRadius: 999,
                  padding: '2px 6px',
                  width: 90,
                  justifyContent: 'space-between',
                }}
              >
                <button
                  type="button"
                  onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  −
                </button>
                <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text)' }}>
                  {item.quantity}
                </span>
                <button
                  type="button"
                  onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                  style={{
                    width: 22,
                    height: 22,
                    borderRadius: '50%',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--text-muted)',
                    fontSize: 13,
                    cursor: 'pointer',
                  }}
                >
                  +
                </button>
              </div>
              <div
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 14,
                  fontWeight: 500,
                  textAlign: 'right',
                  color: 'var(--text)',
                }}
              >
                ₹{(item.price * item.quantity).toLocaleString('en-IN')}
              </div>
              <button
                type="button"
                onClick={() => removeItem(item.productId)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: 'var(--text-faint)',
                  fontSize: 14,
                  cursor: 'pointer',
                }}
                aria-label="Remove"
              >
                ×
              </button>
            </div>
          ))}
        </BCard>

        {/* Summary */}
        <div className="flex flex-col gap-3.5">
          <BCard>
            <BCap>Summary</BCap>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: 8,
                marginTop: 12,
                fontSize: 13.5,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>
                  Subtotal · {itemsCount} {itemsCount === 1 ? 'item' : 'items'}
                </span>
                <span>₹{subtotal.toLocaleString('en-IN')}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: 'var(--text-muted)' }}>Shipping</span>
                <span style={{ color: 'var(--text-faint)', fontFamily: 'var(--font-mono)', fontSize: 11 }}>
                  CALCULATED AT CHECKOUT
                </span>
              </div>
              <div
                style={{
                  borderTop: '1px solid var(--border)',
                  paddingTop: 10,
                  marginTop: 4,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'baseline',
                }}
              >
                <span style={{ fontFamily: 'var(--font-heading)', fontSize: 14, fontWeight: 500 }}>
                  Total
                </span>
                <span style={{ fontFamily: 'var(--font-heading)', fontSize: 22, fontWeight: 500 }}>
                  ₹{subtotal.toLocaleString('en-IN')}
                </span>
              </div>
            </div>
            <Link
              href="/user/orders/checkout"
              style={{
                display: 'block',
                textAlign: 'center',
                fontFamily: 'var(--font-heading)',
                fontSize: 14,
                padding: '12px 20px',
                borderRadius: 999,
                background: 'var(--primary)',
                color: '#fff',
                marginTop: 14,
                fontWeight: 500,
              }}
            >
              Check out ›
            </Link>
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10,
                color: 'var(--text-faint)',
                marginTop: 8,
                textAlign: 'center',
                letterSpacing: '0.06em',
              }}
            >
              UPI · CARDS · NETBANKING
            </div>
          </BCard>
          <Link
            href="/user/shop"
            style={{
              textAlign: 'center',
              fontFamily: 'var(--font-heading)',
              fontSize: 12.5,
              padding: '9px 14px',
              borderRadius: 999,
              background: 'transparent',
              color: 'var(--text-muted)',
              border: '1px solid var(--border)',
            }}
          >
            ‹ Continue shopping
          </Link>
        </div>
      </div>
    </>
  )
}
