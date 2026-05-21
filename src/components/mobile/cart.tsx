'use client'

// Phase 5 — Mobile Cart. Ported from app/cart.jsx. Reuses useCart from
// CartProvider unchanged — lazy-fetch behavior preserved.

import Link from 'next/link'
import { useCart } from '@/lib/cart-context'
import { Card, Blob } from './ui'
import {
  IconArrowLeft,
  IconArrowRight,
  IconMinus,
  IconPlus,
  IconShop,
} from './icons'

export default function MobileCart() {
  const {
    items,
    isLoading,
    removeItem,
    updateQuantity,
    totalAmount,
    totalItems,
  } = useCart()

  return (
    <div
      data-mobile-fullbleed
      data-no-mobile-header
      className="screen-scroll"
      style={{
        background: 'var(--bg-app)',
        minHeight: '100%',
        overflowY: 'auto',
        paddingBottom: 140,
      }}
    >
      <header
        style={{
          padding: '14px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: 12,
        }}
      >
        <Link
          href="/user/shop"
          aria-label="Back to Shop"
          style={{
            width: 40,
            height: 40,
            borderRadius: '50%',
            background: 'var(--bg-card)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: 'var(--shadow-card)',
          }}
        >
          <IconArrowLeft size={18} sw={1.8} />
        </Link>
        <div>
          <div
            className="ms-display"
            style={{ fontSize: 24, color: 'var(--text)' }}
          >
            Cart
          </div>
          <div
            style={{
              fontSize: 12,
              color: 'var(--text-muted)',
              marginTop: 2,
            }}
          >
            {totalItems} {totalItems === 1 ? 'item' : 'items'}
          </div>
        </div>
      </header>

      {isLoading && items.length === 0 ? (
        <section style={{ padding: '20px' }}>
          <Card padding={20}>
            <div
              style={{
                height: 64,
                background: 'var(--bg-app)',
                borderRadius: 12,
                marginBottom: 12,
              }}
            />
            <div
              style={{
                height: 64,
                background: 'var(--bg-app)',
                borderRadius: 12,
              }}
            />
          </Card>
        </section>
      ) : items.length === 0 ? (
        <section style={{ padding: '20px' }}>
          <Card padding={24} style={{ textAlign: 'center' }}>
            <Blob
              fill="rgba(201,120,100,0.12)"
              style={{
                width: 80,
                height: 80,
                margin: '0 auto 14px',
              }}
            />
            <div
              className="ms-display"
              style={{
                fontSize: 22,
                color: 'var(--text)',
                marginBottom: 8,
              }}
            >
              Your cart is empty
            </div>
            <p
              className="ms-serif"
              style={{
                fontSize: 14,
                color: 'var(--text-muted)',
                margin: 0,
                lineHeight: 1.55,
              }}
            >
              Browse the shop and find something kind for yourself.
            </p>
            <Link
              href="/user/shop"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                marginTop: 18,
                background: 'var(--primary)',
                color: 'var(--on-dark)',
                padding: '12px 22px',
                borderRadius: 999,
                fontSize: 14,
                fontWeight: 800,
              }}
            >
              Browse shop <IconArrowRight size={14} sw={2.2} />
            </Link>
          </Card>
        </section>
      ) : (
        <>
          {/* Line items */}
          <section style={{ padding: '12px 20px 0' }}>
            <div style={{ display: 'grid', gap: 12 }}>
              {items.map((item) => (
                <Card key={item.productId} padding={14}>
                  <div
                    style={{
                      display: 'flex',
                      gap: 12,
                      alignItems: 'center',
                    }}
                  >
                    <div
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: 12,
                        background: 'var(--bg-cream)',
                        position: 'relative',
                        overflow: 'hidden',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        flexShrink: 0,
                      }}
                    >
                      {item.image ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={item.image}
                          alt={item.name}
                          style={{
                            width: '100%',
                            height: '100%',
                            objectFit: 'cover',
                          }}
                        />
                      ) : (
                        <IconShop
                          size={24}
                          sw={1.6}
                          style={{
                            color: 'var(--text-muted)',
                            opacity: 0.6,
                          }}
                        />
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div
                        style={{
                          fontSize: 14,
                          fontWeight: 700,
                          color: 'var(--text)',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical' as const,
                          overflow: 'hidden',
                          lineHeight: 1.3,
                        }}
                      >
                        {item.name}
                      </div>
                      <div
                        style={{
                          fontSize: 12,
                          color: 'var(--text-muted)',
                          marginTop: 2,
                        }}
                      >
                        ₹{Math.round(item.price)} each
                      </div>
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: 14,
                          marginTop: 10,
                        }}
                      >
                        <div
                          style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: 4,
                            background: 'var(--bg-app)',
                            borderRadius: 999,
                            padding: 3,
                          }}
                        >
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(
                                item.productId,
                                Math.max(0, item.quantity - 1)
                              )
                            }
                            aria-label="Decrease quantity"
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: '50%',
                              background: 'var(--bg-card)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'var(--text)',
                            }}
                          >
                            <IconMinus size={14} sw={2} />
                          </button>
                          <span
                            style={{
                              minWidth: 22,
                              textAlign: 'center',
                              fontSize: 13,
                              fontWeight: 800,
                              color: 'var(--text)',
                            }}
                          >
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              updateQuantity(
                                item.productId,
                                item.quantity + 1
                              )
                            }
                            aria-label="Increase quantity"
                            style={{
                              width: 28,
                              height: 28,
                              borderRadius: '50%',
                              background: 'var(--bg-card)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              color: 'var(--text)',
                            }}
                          >
                            <IconPlus size={14} sw={2} />
                          </button>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeItem(item.productId)}
                          style={{
                            marginLeft: 'auto',
                            fontSize: 12,
                            fontWeight: 700,
                            color: 'var(--text-muted)',
                          }}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </div>
                  <div
                    style={{
                      paddingTop: 10,
                      marginTop: 10,
                      borderTop: '1px solid var(--border)',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'baseline',
                    }}
                  >
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 700,
                        color: 'var(--text-muted)',
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                      }}
                    >
                      Line total
                    </span>
                    <span
                      style={{
                        fontSize: 15,
                        fontWeight: 800,
                        color: 'var(--text)',
                      }}
                    >
                      ₹{Math.round(item.price * item.quantity)}
                    </span>
                  </div>
                </Card>
              ))}
            </div>
          </section>

          {/* Sticky bottom checkout bar */}
          <div
            style={{
              position: 'fixed',
              left: 14,
              right: 14,
              bottom: 'calc(env(safe-area-inset-bottom) + 76px)',
              zIndex: 12,
            }}
          >
            <Card
              padding={12}
              style={{
                background: 'var(--bg-card)',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
              }}
            >
              <div style={{ flex: 1, padding: '0 6px' }}>
                <div
                  style={{
                    fontSize: 10.5,
                    fontWeight: 700,
                    color: 'var(--text-muted)',
                    letterSpacing: '0.10em',
                    textTransform: 'uppercase',
                  }}
                >
                  Subtotal
                </div>
                <div
                  className="ms-display"
                  style={{ fontSize: 22, color: 'var(--text)' }}
                >
                  ₹{Math.round(totalAmount)}
                </div>
              </div>
              <Link
                href="/user/orders/checkout"
                style={{
                  background: 'var(--primary)',
                  color: 'var(--on-dark)',
                  padding: '14px 22px',
                  borderRadius: 999,
                  fontSize: 14,
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  boxShadow: 'var(--shadow-pop)',
                }}
              >
                Checkout <IconArrowRight size={14} sw={2.2} />
              </Link>
            </Card>
          </div>
        </>
      )}
    </div>
  )
}
