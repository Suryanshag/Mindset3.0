'use client'

// Phase 5 — Mobile Shop catalog. Adapts app/shop.jsx.
// Filter chips render visually but DO NOT filter — Product has no
// category field per the production schema. Flagged in PORT_LOG.

import { useState } from 'react'
import Link from 'next/link'
import { useCart } from '@/lib/cart-context'
import { Card, Chip, Blob } from './ui'
import {
  IconArrowLeft,
  IconCart,
  IconChevR,
  IconShop,
} from './icons'

type Product = {
  id: string
  name: string
  price: number
  imageUrl: string | null
  isDigital: boolean
  stock: number
}

type MobileShopProps = {
  products: Product[]
}

// Visual-only filter chips. Replace with real categories when the
// Product schema gains a category field.
const FILTER_CHIPS = ['All', 'Journals', 'Mindful tools', 'Self-care kits', 'Digital']

export default function MobileShop({ products }: MobileShopProps) {
  const [filter, setFilter] = useState('All')
  const { totalItems } = useCart()
  const visible =
    filter === 'Digital'
      ? products.filter((p) => p.isDigital)
      : products

  return (
    <div
      data-mobile-fullbleed
      data-no-mobile-header
      className="screen-scroll"
      style={{
        background: 'var(--bg-app)',
        minHeight: '100%',
        overflowY: 'auto',
        paddingBottom: 110,
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
          href="/user/discover"
          aria-label="Back to Discover"
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
        <div style={{ flex: 1 }}>
          <div
            className="ms-display"
            style={{ fontSize: 24, color: 'var(--text)' }}
          >
            Shop
          </div>
          <div
            style={{
              fontSize: 12,
              color: 'var(--text-muted)',
              marginTop: 2,
            }}
          >
            Free shipping over ₹999
          </div>
        </div>
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
          {totalItems > 0 && (
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
              {totalItems > 9 ? '9+' : totalItems}
            </span>
          )}
        </Link>
      </header>

      {/* Filter chips — visual only */}
      <div
        style={{
          display: 'flex',
          gap: 8,
          overflowX: 'auto',
          margin: '6px -20px 0',
          padding: '0 20px 6px',
        }}
        className="screen-scroll"
      >
        {FILTER_CHIPS.map((f) => (
          <Chip
            key={f}
            active={filter === f}
            onClick={() => setFilter(f)}
          >
            {f}
          </Chip>
        ))}
      </div>

      <section style={{ padding: '14px 20px 0' }}>
        {visible.length === 0 ? (
          <Card padding={28} style={{ textAlign: 'center' }}>
            <p
              className="ms-serif"
              style={{
                fontSize: 16,
                color: 'var(--text-muted)',
                margin: 0,
                lineHeight: 1.55,
              }}
            >
              The shop is being stocked. Check back soon.
            </p>
          </Card>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12,
            }}
          >
            {visible.map((p) => (
              <ProductCard key={p.id} p={p} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function ProductCard({ p }: { p: Product }) {
  const outOfStock = p.stock === 0 && !p.isDigital
  return (
    <Link
      href={`/user/shop/${p.id}`}
      style={{
        display: 'block',
        background: 'var(--bg-card)',
        borderRadius: 18,
        overflow: 'hidden',
        boxShadow: 'var(--shadow-card)',
        opacity: outOfStock ? 0.65 : 1,
      }}
    >
      <div
        style={{
          position: 'relative',
          height: 170,
          background: 'var(--bg-cream)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {p.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={p.imageUrl}
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
              fill="rgba(201,120,100,0.15)"
              style={{
                position: 'absolute',
                right: -16,
                top: -20,
                width: 90,
                height: 90,
              }}
            />
            <IconShop
              size={32}
              sw={1.6}
              style={{
                position: 'relative',
                color: 'var(--text-muted)',
                opacity: 0.5,
              }}
            />
          </>
        )}
        {outOfStock && (
          <div
            style={{
              position: 'absolute',
              top: 8,
              left: 8,
              fontSize: 10,
              fontWeight: 800,
              padding: '3px 8px',
              borderRadius: 999,
              background: 'rgba(0,0,0,0.55)',
              color: '#fff',
              letterSpacing: '0.06em',
              textTransform: 'uppercase',
            }}
          >
            Out of stock
          </div>
        )}
        {p.isDigital && (
          <div
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
              fontSize: 10,
              fontWeight: 800,
              padding: '3px 8px',
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
      <div style={{ padding: 12 }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--text)',
            lineHeight: 1.3,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical' as const,
            overflow: 'hidden',
          }}
        >
          {p.name}
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginTop: 10,
          }}
        >
          <span
            style={{
              fontSize: 14,
              fontWeight: 800,
              color: 'var(--text)',
            }}
          >
            ₹{Math.round(p.price)}
          </span>
          <IconChevR
            size={16}
            sw={1.8}
            style={{ color: 'var(--text-muted)' }}
          />
        </div>
      </div>
    </Link>
  )
}
