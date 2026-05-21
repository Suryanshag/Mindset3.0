// Phase 5 — Mobile Shop product detail. Adapts app/shop.jsx detail.
// Reuses ProductActions (existing Client Component) for cart mutations.

import Link from 'next/link'
import { Card, Blob } from './ui'
import { IconArrowLeft, IconCart, IconShop } from './icons'
import ProductActions from '@/components/products/product-actions'

export type MobileShopProductDetail = {
  id: string
  name: string
  description: string
  price: number
  stock: number
  image: string | null
  isDigital: boolean
}

type Props = {
  p: MobileShopProductDetail
  cartCount: number
}

export default function MobileShopDetail({ p, cartCount }: Props) {
  const outOfStock = p.stock === 0 && !p.isDigital

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
        <span
          style={{
            flex: 1,
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.10em',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
          }}
        >
          Shop
        </span>
        <Link
          href="/user/cart"
          aria-label="Cart"
          style={{
            position: 'relative',
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
          <IconCart size={18} sw={1.7} />
          {cartCount > 0 && (
            <span
              style={{
                position: 'absolute',
                top: -2,
                right: -2,
                minWidth: 18,
                height: 18,
                padding: '0 5px',
                borderRadius: 999,
                background: 'var(--accent)',
                color: 'var(--on-dark)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 10,
                fontWeight: 800,
                border: '2px solid var(--bg-app)',
              }}
            >
              {cartCount > 9 ? '9+' : cartCount}
            </span>
          )}
        </Link>
      </header>

      {/* Hero image */}
      <section style={{ padding: '4px 20px 0' }}>
        <div
          style={{
            position: 'relative',
            aspectRatio: '4 / 3',
            borderRadius: 24,
            background: 'var(--bg-cream)',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {p.image ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={p.image}
              alt={p.name}
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
              }}
            />
          ) : (
            <>
              <Blob
                fill="rgba(201,120,100,0.18)"
                style={{
                  position: 'absolute',
                  right: -30,
                  top: -40,
                  width: 200,
                  height: 200,
                }}
              />
              <IconShop
                size={60}
                sw={1.4}
                style={{
                  position: 'relative',
                  color: 'var(--text-muted)',
                  opacity: 0.4,
                }}
              />
            </>
          )}
          {p.isDigital && (
            <div
              style={{
                position: 'absolute',
                top: 14,
                right: 14,
                fontSize: 11,
                fontWeight: 800,
                padding: '5px 12px',
                borderRadius: 999,
                background: 'rgba(45,90,79,0.85)',
                color: '#fff',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              Digital
            </div>
          )}
        </div>
      </section>

      {/* Title + price */}
      <section style={{ padding: '20px 20px 0' }}>
        <h1
          className="ms-display"
          style={{
            fontSize: 28,
            color: 'var(--text)',
            lineHeight: 1.1,
            marginBottom: 0,
          }}
        >
          {p.name}
        </h1>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            marginTop: 12,
          }}
        >
          <span
            style={{
              fontSize: 22,
              fontWeight: 800,
              color: 'var(--text)',
            }}
          >
            ₹{Math.round(p.price)}
          </span>
          {outOfStock ? (
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: '#7A1F12',
                background: 'rgba(154,52,18,0.10)',
                padding: '4px 10px',
                borderRadius: 999,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              Out of stock
            </span>
          ) : p.isDigital ? (
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: 'var(--primary)',
                background: 'var(--primary-tint)',
                padding: '4px 10px',
                borderRadius: 999,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              Instant access
            </span>
          ) : p.stock <= 5 ? (
            <span
              style={{
                fontSize: 11,
                fontWeight: 800,
                color: 'var(--accent-deep)',
                background: 'var(--accent-tint)',
                padding: '4px 10px',
                borderRadius: 999,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              Only {p.stock} left
            </span>
          ) : null}
        </div>
      </section>

      {/* Description */}
      <section style={{ padding: '20px 20px 0' }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.12em',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            marginBottom: 8,
          }}
        >
          About
        </div>
        <p
          className="ms-serif"
          style={{
            fontSize: 16,
            lineHeight: 1.6,
            color: 'var(--text)',
            margin: 0,
            whiteSpace: 'pre-wrap',
          }}
        >
          {p.description}
        </p>
      </section>

      {/* Sticky bottom action bar */}
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
          padding={10}
          style={{
            background: 'var(--bg-card)',
            display: 'flex',
            alignItems: 'center',
            gap: 10,
          }}
        >
          <div style={{ flex: 1, padding: '0 4px' }}>
            <div
              style={{
                fontSize: 10.5,
                fontWeight: 700,
                color: 'var(--text-muted)',
                letterSpacing: '0.10em',
                textTransform: 'uppercase',
              }}
            >
              Total
            </div>
            <div
              className="ms-display"
              style={{ fontSize: 22, color: 'var(--text)' }}
            >
              ₹{Math.round(p.price)}
            </div>
          </div>
          <div style={{ flexShrink: 0 }}>
            <ProductActions
              product={{
                id: p.id,
                name: p.name,
                price: p.price,
                image: p.image,
                stock: p.stock,
              }}
            />
          </div>
        </Card>
      </div>
    </div>
  )
}
