'use client'

import { useMemo, useState } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { BCap, BCard, BChip } from './b-atoms'
import BPageHeader from './b-page-header'

// Phase 3g — Library (Direction B port).
// Filter chips are local-state so URL params (none today) stay untouched.
// `owned` items show first as a "Your library" group; the rest become
// "Browse the library".

export type LibraryMaterial = {
  id: string
  title: string
  type: 'FREE' | 'PAID'
  price: string | null
  coverImage: string | null
  /** ISO string or null — when the user last opened the material. */
  lastOpenedAt: string | null
  isOwned: boolean
}

type Filter = 'all' | 'owned' | 'free' | 'paid'

type Props = {
  items: LibraryMaterial[]
}

const FILTERS: { key: Filter; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'owned', label: 'Your library' },
  { key: 'free', label: 'Free' },
  { key: 'paid', label: 'Paid' },
]

export default function BLibrary({ items }: Props) {
  const [filter, setFilter] = useState<Filter>('all')

  const counts = useMemo(() => {
    const map = new Map<Filter, number>()
    map.set('all', items.length)
    map.set('owned', items.filter((i) => i.isOwned).length)
    map.set('free', items.filter((i) => i.type === 'FREE').length)
    map.set('paid', items.filter((i) => i.type === 'PAID').length)
    return map
  }, [items])

  const filtered = useMemo(() => {
    if (filter === 'all') return items
    if (filter === 'owned') return items.filter((i) => i.isOwned)
    return items.filter((i) => i.type === filter.toUpperCase())
  }, [items, filter])

  // Featured = the most-recently-opened item (or the first item).
  const featured = useMemo(() => {
    const withDates = filtered
      .filter((i) => i.lastOpenedAt)
      .sort((a, b) => new Date(b.lastOpenedAt!).getTime() - new Date(a.lastOpenedAt!).getTime())
    return withDates[0] ?? filtered[0] ?? null
  }, [filtered])

  const rest = filtered.filter((i) => i.id !== featured?.id)

  return (
    <>
      <BPageHeader
        title="Library."
        sub="Short readings, audio walks, and notes from our therapists."
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
      </div>

      {/* Featured top */}
      {featured && <Featured item={featured} />}

      {/* Grid of the rest */}
      {rest.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {rest.map((m) => (
            <Tile key={m.id} item={m} />
          ))}
        </div>
      )}

      {filtered.length === 0 && (
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
        The library is curated by our therapists. We never algorithm-rank it.
      </p>
    </>
  )
}

function Featured({ item }: { item: LibraryMaterial }) {
  return (
    <Link href={`/user/library/${item.id}`}>
      <BCard padding={0} style={{ overflow: 'hidden' }}>
        <div style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr', gap: 28, padding: '24px 28px' }}>
          <div>
            <BChip kind={item.type === 'FREE' ? 'primary' : 'workshop'}>
              {item.type === 'FREE' ? 'FREE' : `₹${item.price ?? ''}`}
            </BChip>
            {item.isOwned && (
              <span style={{ marginLeft: 8 }}>
                <BChip kind="primary">IN YOUR LIBRARY</BChip>
              </span>
            )}
            <p
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 32,
                lineHeight: 1.1,
                color: 'var(--text)',
                marginTop: 12,
              }}
            >
              {item.title}
            </p>
            {item.lastOpenedAt && (
              <p
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10.5,
                  color: 'var(--text-faint)',
                  marginTop: 12,
                  letterSpacing: '0.06em',
                }}
              >
                LAST OPENED{' '}
                {new Date(item.lastOpenedAt)
                  .toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })
                  .toUpperCase()}
              </p>
            )}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                marginTop: 16,
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 12,
                  color: 'var(--primary)',
                }}
              >
                {item.isOwned ? 'Continue reading ›' : 'Read ›'}
              </span>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10.5,
                  color: 'var(--text-faint)',
                }}
              >
                · SAVE TO REFLECTION
              </span>
            </div>
          </div>
          <div
            style={{
              background: 'var(--bg-paper)',
              borderRadius: 10,
              border: '1px solid var(--border)',
              display: 'grid',
              placeItems: 'center',
              position: 'relative',
              aspectRatio: '3 / 4',
              overflow: 'hidden',
            }}
          >
            {item.coverImage ? (
              <Image
                fill
                src={item.coverImage}
                alt={item.title}
                sizes="240px"
                style={{ objectFit: 'contain' }}
                unoptimized
              />
            ) : (
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-faint)' }}>
                [ COVER ]
              </span>
            )}
          </div>
        </div>
      </BCard>
    </Link>
  )
}

function Tile({ item }: { item: LibraryMaterial }) {
  return (
    <Link href={`/user/library/${item.id}`}>
      <BCard padding={0} style={{ overflow: 'hidden', minHeight: 200, display: 'flex', flexDirection: 'column' }}>
        <div
          style={{
            position: 'relative',
            background: 'var(--bg-paper)',
            aspectRatio: '3 / 4',
            display: 'grid',
            placeItems: 'center',
            borderBottom: '1px solid var(--border)',
          }}
        >
          {item.coverImage ? (
            <Image
              fill
              src={item.coverImage}
              alt={item.title}
              sizes="280px"
              style={{ objectFit: 'contain' }}
              unoptimized
            />
          ) : (
            <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-faint)' }}>
              [ COVER ]
            </span>
          )}
          <div
            style={{
              position: 'absolute',
              top: 8,
              right: 8,
            }}
          >
            <BChip kind={item.type === 'FREE' ? 'primary' : 'workshop'}>
              {item.type === 'FREE' ? 'FREE' : `₹${item.price ?? ''}`}
            </BChip>
          </div>
          {item.isOwned && (
            <div style={{ position: 'absolute', top: 8, left: 8 }}>
              <BChip kind="primary">OWNED</BChip>
            </div>
          )}
        </div>
        <div style={{ padding: 14, flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
          <p
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 15,
              lineHeight: 1.35,
              color: 'var(--text)',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {item.title}
          </p>
          <div style={{ marginTop: 'auto' }}>
            {item.lastOpenedAt ? (
              <BCap>
                Last opened{' '}
                {new Date(item.lastOpenedAt).toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                })}
              </BCap>
            ) : item.isOwned ? (
              <BCap>Not opened yet</BCap>
            ) : null}
          </div>
        </div>
      </BCard>
    </Link>
  )
}
