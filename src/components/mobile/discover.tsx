'use client'

// Phase 5 — Mobile Discover hub. Ported from app/discover.jsx.
//
// Cart button lives in this header ONLY. Per design intent + brief,
// no other mobile route surfaces the cart icon — /user/cart is reached
// from here, from Shop "View cart" affordances, or by direct URL.
//
// Library + "Study Materials" are the same model (StudyMaterial) in
// the production schema; we consolidate into a single "Self-care
// library" section that links to /user/library.

import Link from 'next/link'
import { useCart } from '@/lib/cart-context'
import { Card, SectionHead, Blob } from './ui'
import {
  IconArrowRight,
  IconBook,
  IconCart,
  IconChevR,
} from './icons'
import type { ReactNode } from 'react'

type StudyMaterialPreview = {
  id: string
  title: string
  type: 'FREE' | 'PAID'
  price: string | null
  coverImage: string | null
}

type NgoVisitPreview = {
  id: string
  ngoName: string
  location: string
  visitDate: string // ISO
}

type MobileDiscoverProps = {
  libraryPreview: StudyMaterialPreview[]
  libraryOwnedCount: number
  nextNgoVisit: NgoVisitPreview | null
  ngoVisitsCount: number
}

export default function MobileDiscover({
  libraryPreview,
  libraryOwnedCount,
  nextNgoVisit,
  ngoVisitsCount,
}: MobileDiscoverProps) {
  const { totalItems } = useCart()

  return (
    <div
      data-mobile-fullbleed
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
          padding: '18px 20px 8px',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
        }}
      >
        <div style={{ flex: 1 }}>
          <div
            className="ms-display"
            style={{ fontSize: 32, color: 'var(--text)' }}
          >
            Discover
          </div>
          <div
            className="ms-serif"
            style={{
              fontSize: 13,
              color: 'var(--text-muted)',
              marginTop: 2,
            }}
          >
            Workshops, reading, and a small shop.
          </div>
        </div>
        <CartButton count={totalItems} />
      </header>

      {/* Sibling tiles */}
      <section
        style={{
          padding: '14px 20px 0',
          display: 'grid',
          gap: 14,
        }}
      >
        <DiscoverTile
          href="/user/discover/workshops"
          title="Workshops"
          kicker="Workshop"
          kickerColor="var(--primary)"
          sub="Live, expert-led sessions on a topic. Frameworks you'll actually use."
          meta="From ₹449 · 60–90 min"
          bg="var(--navy)"
          fg="var(--on-dark)"
          decor="rgba(255,248,235,0.10)"
        />
        <DiscoverTile
          href="/user/shop"
          title="Shop"
          kicker="New"
          kickerColor="var(--accent)"
          sub="Journals, candles, calm-down kits — curated for the journey."
          meta="From ₹199 · Free shipping over ₹999"
          bg="var(--bg-cream)"
          fg="var(--text)"
          decor="rgba(45,90,79,0.10)"
          decor2="rgba(201,120,100,0.18)"
        />
      </section>

      {/* Self-care library — consolidates "Library" + "Study Materials"
          from the design since both back to the same StudyMaterial
          model in our schema. */}
      {libraryPreview.length > 0 && (
        <>
          <section style={{ padding: '28px 20px 0' }}>
            <SectionHead
              title="Self-care library"
              action="See all"
              onAction={() => (window.location.href = '/user/library')}
            />
            <LibraryStrip ownedCount={libraryOwnedCount} />
          </section>

          <section style={{ padding: '18px 20px 0' }}>
            <div
              style={{
                display: 'flex',
                gap: 12,
                overflowX: 'auto',
                margin: '0 -20px',
                padding: '0 20px 4px',
              }}
              className="screen-scroll"
            >
              {libraryPreview.slice(0, 5).map((m) => (
                <Link
                  key={m.id}
                  href={`/user/library/${m.id}`}
                  style={{
                    minWidth: 160,
                    background: 'var(--bg-card)',
                    borderRadius: 18,
                    overflow: 'hidden',
                    boxShadow: 'var(--shadow-card)',
                    textAlign: 'left',
                    display: 'block',
                  }}
                >
                  <div
                    style={{
                      aspectRatio: '1 / 1.414',
                      background: m.coverImage
                        ? 'transparent'
                        : 'var(--accent-tint)',
                      position: 'relative',
                      overflow: 'hidden',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                    }}
                  >
                    {m.coverImage ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={m.coverImage}
                        alt={m.title}
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                        }}
                      />
                    ) : (
                      <>
                        <Blob
                          fill="rgba(255,255,255,0.45)"
                          style={{
                            position: 'absolute',
                            right: -14,
                            top: -18,
                            width: 78,
                            height: 78,
                          }}
                        />
                        <IconBook
                          size={28}
                          sw={1.6}
                          style={{
                            position: 'relative',
                            color: 'var(--text)',
                            opacity: 0.55,
                          }}
                        />
                      </>
                    )}
                    <div
                      style={{
                        position: 'absolute',
                        top: 8,
                        left: 10,
                        fontSize: 9.5,
                        fontWeight: 800,
                        padding: '3px 7px',
                        borderRadius: 999,
                        background:
                          m.type === 'FREE'
                            ? 'rgba(74,184,116,0.18)'
                            : 'rgba(0,0,0,0.10)',
                        color:
                          m.type === 'FREE' ? '#2A7A4A' : 'var(--text)',
                        letterSpacing: '0.06em',
                        textTransform: 'uppercase',
                      }}
                    >
                      {m.type === 'FREE'
                        ? 'Free'
                        : m.price
                        ? `₹${Math.round(Number(m.price))}`
                        : 'Paid'}
                    </div>
                  </div>
                  <div style={{ padding: 10 }}>
                    <div
                      style={{
                        fontSize: 12,
                        fontWeight: 800,
                        lineHeight: 1.2,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical' as const,
                        overflow: 'hidden',
                      }}
                    >
                      {m.title}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        </>
      )}

      {/* NGO Visits */}
      {(nextNgoVisit || ngoVisitsCount > 0) && (
        <section style={{ padding: '28px 20px 0' }}>
          <SectionHead
            kicker="NGO visits"
            title="Give back"
            action="See all"
            onAction={() =>
              (window.location.href = '/user/discover/ngo-visits')
            }
          />
          <Card
            padding={18}
            bg="var(--primary)"
            radius={22}
            style={{
              color: 'var(--on-dark)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <Blob
              fill="rgba(255,248,235,0.10)"
              style={{
                position: 'absolute',
                right: -30,
                top: -30,
                width: 150,
                height: 150,
              }}
            />
            <div style={{ position: 'relative' }}>
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 800,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  opacity: 0.85,
                }}
              >
                {nextNgoVisit
                  ? `Next · ${new Date(nextNgoVisit.visitDate).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}`
                  : 'One Saturday a month'}
              </span>
              <div
                className="ms-display"
                style={{
                  fontSize: 24,
                  marginTop: 6,
                  lineHeight: 1.1,
                  maxWidth: 240,
                }}
              >
                {nextNgoVisit
                  ? `Visit ${nextNgoVisit.ngoName} in ${nextNgoVisit.location}`
                  : 'Join an NGO visit near you'}
              </div>
              <Link
                href="/user/discover/ngo-visits"
                style={{
                  marginTop: 14,
                  background: 'var(--on-dark)',
                  color: 'var(--primary)',
                  padding: '10px 16px',
                  borderRadius: 999,
                  fontSize: 13,
                  fontWeight: 800,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                See upcoming drives <IconArrowRight size={14} sw={2.2} />
              </Link>
            </div>
          </Card>
        </section>
      )}
    </div>
  )
}

function CartButton({ count }: { count: number }) {
  return (
    <Link
      href="/user/cart"
      aria-label={
        count > 0 ? `Cart, ${count} item${count === 1 ? '' : 's'}` : 'Cart'
      }
      style={{
        position: 'relative',
        width: 44,
        height: 44,
        borderRadius: '50%',
        background: 'var(--bg-card)',
        color: 'var(--text)',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <IconCart size={20} sw={1.7} />
      {count > 0 && (
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
          {count > 9 ? '9+' : count}
        </span>
      )}
    </Link>
  )
}

function DiscoverTile({
  href,
  title,
  kicker,
  kickerColor,
  sub,
  meta,
  bg,
  fg,
  decor,
  decor2,
}: {
  href: string
  title: string
  kicker: string
  kickerColor: string
  sub: string
  meta: string
  bg: string
  fg: string
  decor: string
  decor2?: string
}) {
  return (
    <Link
      href={href}
      style={{
        textAlign: 'left',
        background: bg,
        color: fg,
        borderRadius: 26,
        padding: 22,
        position: 'relative',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-card)',
        animation: 'fadeUp .5s both',
        display: 'block',
      }}
    >
      <Blob
        fill={decor}
        style={{
          position: 'absolute',
          right: -40,
          top: -50,
          width: 200,
          height: 200,
        }}
      />
      {decor2 && (
        <Blob
          fill={decor2}
          d="M40 12 C76 8 110 36 100 76 C92 110 40 120 14 92 C-6 70 4 18 40 12 Z"
          style={{
            position: 'absolute',
            left: -40,
            bottom: -50,
            width: 160,
            height: 160,
          }}
        />
      )}
      <div style={{ position: 'relative' }}>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '5px 11px',
            borderRadius: 999,
            background: 'rgba(255,255,255,0.85)',
            color: kickerColor,
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.10em',
            textTransform: 'uppercase',
          }}
        >
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: '50%',
              background: kickerColor,
            }}
          />{' '}
          {kicker}
        </span>
        <div
          className="ms-display"
          style={{ fontSize: 32, marginTop: 12, lineHeight: 1.0 }}
        >
          {title}
        </div>
        <p
          className="ms-serif"
          style={{
            fontSize: 14.5,
            opacity: 0.85,
            marginTop: 8,
            maxWidth: 280,
            lineHeight: 1.5,
          }}
        >
          {sub}
        </p>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            marginTop: 16,
          }}
        >
          <span
            style={{
              fontSize: 11,
              fontWeight: 800,
              opacity: 0.7,
              letterSpacing: '0.08em',
              textTransform: 'uppercase',
            }}
          >
            {meta}
          </span>
          <span
            style={{
              marginLeft: 'auto',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              fontSize: 13,
              fontWeight: 800,
            }}
          >
            Browse <IconArrowRight size={14} sw={2.2} />
          </span>
        </div>
      </div>
    </Link>
  )
}

function LibraryStrip({ ownedCount }: { ownedCount: number }) {
  const empty = ownedCount === 0
  return (
    <Link
      href="/user/library"
      style={{
        display: 'block',
        background: 'var(--bg-cream)',
        borderRadius: 20,
        padding: 16,
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div
          style={{
            width: 40,
            height: 40,
            borderRadius: 12,
            background: 'var(--accent-tint)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--accent-deep)',
          }}
        >
          <IconBook size={20} sw={1.8} />
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 14,
              fontWeight: empty ? 700 : 800,
              color: 'var(--text)',
            }}
          >
            {empty
              ? 'Your library is empty'
              : `You have ${ownedCount} saved`}
          </div>
          <div
            style={{
              fontSize: 12,
              color: 'var(--text-muted)',
              marginTop: 2,
            }}
          >
            {empty
              ? 'Pick up something below'
              : 'Pick up where you left off'}
          </div>
        </div>
        <IconChevR
          size={18}
          sw={1.8}
          style={{ color: 'var(--text-muted)' }}
        />
      </div>
    </Link>
  )
}

export type { ReactNode }
