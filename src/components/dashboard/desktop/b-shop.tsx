'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { BCard, BChip } from './b-atoms'
import BPageHeader from './b-page-header'

// Phase 3h — Shop catalog (Direction B port).
// Local filter state; route + queries unchanged.

export type ShopProduct = {
  id: string
  name: string
  price: number
  imageUrl: string | null
  isDigital: boolean
  stock: number
}

type Filter = 'all' | 'physical' | 'digital' | 'in-stock'

type Props = {
  products: ShopProduct[]
  cartCount: number
}

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'physical', label: 'Physical' },
  { key: 'digital', label: 'Digital' },
  { key: 'in-stock', label: 'In stock' },
]

export default function BShop({ products }: Props) {
  const [filter, setFilter] = useState<Filter>('all')

  const counts = useMemo(() => {
    const map = new Map<Filter, number>()
    map.set('all', products.length)
    map.set('physical', products.filter((p) => !p.isDigital).length)
    map.set('digital', products.filter((p) => p.isDigital).length)
    map.set('in-stock', products.filter((p) => p.isDigital || p.stock > 0).length)
    return map
  }, [products])

  const filtered = useMemo(() => {
    if (filter === 'all') return products
    if (filter === 'physical') return products.filter((p) => !p.isDigital)
    if (filter === 'digital') return products.filter((p) => p.isDigital)
    return products.filter((p) => p.isDigital || p.stock > 0)
  }, [products, filter])

  return (
    <>
      <BPageHeader
        title="Shop."
        sub="A small, slow shelf. Curated by our therapists. We don&rsquo;t push."
        ctas={['search']}
      />

      {/* Filter chips */}
      <div className="flex items-center gap-2">
        {FILTERS.map((f) => {
          const on = filter === f.key
          const count = counts.get(f.key) ?? 0
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
        <div style={{ flex: 1 }} />
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10.5,
            color: 'var(--text-faint)',
          }}
        >
          SHIPS FROM BENGALURU · 3–5 DAYS
        </span>
      </div>

      {/* Grid */}
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
            Nothing in this filter yet.
          </p>
        </BCard>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {filtered.map((p) => (
            <Tile key={p.id} product={p} />
          ))}
        </div>
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
        Profits from the shop fund our pay-what-you-can workshops.
      </p>
    </>
  )
}

function Tile({ product }: { product: ShopProduct }) {
  const outOfStock = !product.isDigital && product.stock === 0
  return (
    <Link href={`/user/shop/${product.id}`}>
      <BCard
        padding={0}
        style={{
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minHeight: 240,
          opacity: outOfStock ? 0.55 : 1,
        }}
      >
        <div
          style={{
            background: 'var(--bg-paper)',
            aspectRatio: '4 / 3',
            borderBottom: '1px solid var(--border)',
            position: 'relative',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          {product.imageUrl ? (
            <Image
              fill
              src={product.imageUrl}
              alt={product.name}
              sizes="280px"
              style={{ objectFit: 'cover' }}
              unoptimized
            />
          ) : (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-faint)' }}>
              [ {product.name.split(' ').slice(0, 2).join(' ').toUpperCase()} ]
            </span>
          )}
        </div>
        <div style={{ padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
          <div className="flex justify-between items-baseline">
            <BChip kind={product.isDigital ? 'primary' : 'workshop'}>
              {product.isDigital ? 'DIGITAL' : 'MADE'}
            </BChip>
            <span
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 14,
                fontWeight: 500,
                color: 'var(--text)',
              }}
            >
              ₹{product.price.toLocaleString('en-IN')}
            </span>
          </div>
          <div
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 16,
              lineHeight: 1.3,
              color: 'var(--text)',
              marginTop: 4,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {product.name}
          </div>
          <div
            style={{
              marginTop: 'auto',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingTop: 10,
            }}
          >
            <span
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 12,
                color: 'var(--primary)',
              }}
            >
              View ›
            </span>
            {outOfStock && (
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  color: 'var(--text-muted)',
                  letterSpacing: '0.06em',
                }}
              >
                OUT OF STOCK
              </span>
            )}
          </div>
        </div>
      </BCard>
    </Link>
  )
}
