// Phase 5 — Mobile Library. Adapts app/library-page.jsx. Schema:
// StudyMaterial has cover, title, type (FREE/PAID), price, fileUrl.
// No body/content — so we skip the standalone LibraryReader port and
// rely on the existing /user/library/[id] detail page that opens the
// fileUrl. Flagged in PORT_LOG.

import Link from 'next/link'
import { Card, Blob } from './ui'
import { IconArrowLeft, IconBook, IconChevR } from './icons'

export type LibraryItem = {
  id: string
  title: string
  type: 'FREE' | 'PAID'
  price: string | null
  coverImage: string | null
}

export type OwnedLibraryItem = LibraryItem & {
  lastOpenedAt: string | null // ISO
}

type MobileLibraryProps = {
  owned: OwnedLibraryItem[]
  browseFree: LibraryItem[]
  browsePaid: LibraryItem[]
}

function lastOpenedLabel(iso: string | null): string {
  if (!iso) return 'Not opened yet'
  const d = new Date(iso)
  const days = Math.floor((Date.now() - d.getTime()) / 86400000)
  if (days <= 0) return 'Opened today'
  if (days === 1) return 'Opened yesterday'
  if (days < 7) return `Opened ${days} days ago`
  if (days < 30) {
    const w = Math.floor(days / 7)
    return `Opened ${w} ${w === 1 ? 'week' : 'weeks'} ago`
  }
  return `Opened ${d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
}

export default function MobileLibrary({
  owned,
  browseFree,
  browsePaid,
}: MobileLibraryProps) {
  const continueItem = owned.find((o) => o.lastOpenedAt) ?? owned[0] ?? null
  const otherOwned = owned.filter((o) => o.id !== continueItem?.id)

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
        <div>
          <div
            className="ms-display"
            style={{ fontSize: 24, color: 'var(--text)' }}
          >
            Library
          </div>
          <div
            style={{
              fontSize: 12,
              color: 'var(--text-muted)',
              marginTop: 2,
            }}
          >
            Self-care reading + study materials
          </div>
        </div>
      </header>

      {/* Continue reading hero */}
      {continueItem && (
        <section style={{ padding: '8px 20px 0' }}>
          <Link href={`/user/library/${continueItem.id}`}>
            <Card padding={0} style={{ overflow: 'hidden' }}>
              <div
                style={{
                  display: 'flex',
                  gap: 14,
                  padding: 16,
                  alignItems: 'center',
                }}
              >
                <CoverThumb item={continueItem} size={72} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      letterSpacing: '0.12em',
                      color: 'var(--primary)',
                      textTransform: 'uppercase',
                    }}
                  >
                    {continueItem.lastOpenedAt
                      ? 'Continue reading'
                      : 'Pick up where you left off'}
                  </div>
                  <div
                    style={{
                      fontSize: 16,
                      fontWeight: 800,
                      color: 'var(--text)',
                      marginTop: 4,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical' as const,
                      overflow: 'hidden',
                    }}
                  >
                    {continueItem.title}
                  </div>
                  <div
                    style={{
                      fontSize: 11.5,
                      color: 'var(--text-muted)',
                      marginTop: 4,
                    }}
                  >
                    {lastOpenedLabel(continueItem.lastOpenedAt)}
                  </div>
                </div>
                <IconChevR
                  size={20}
                  sw={1.8}
                  style={{ color: 'var(--text-muted)' }}
                />
              </div>
            </Card>
          </Link>
        </section>
      )}

      {/* Other owned items */}
      {otherOwned.length > 0 && (
        <section style={{ padding: '24px 20px 0' }}>
          <SectionLabel>Your library</SectionLabel>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12,
              marginTop: 12,
            }}
          >
            {otherOwned.map((item) => (
              <CatalogCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}

      {/* Browse free */}
      {browseFree.length > 0 && (
        <section style={{ padding: '24px 20px 0' }}>
          <SectionLabel>Free reads</SectionLabel>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12,
              marginTop: 12,
            }}
          >
            {browseFree.slice(0, 6).map((item) => (
              <CatalogCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}

      {/* Browse paid */}
      {browsePaid.length > 0 && (
        <section style={{ padding: '24px 20px 0' }}>
          <SectionLabel>Paid study materials</SectionLabel>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 12,
              marginTop: 12,
            }}
          >
            {browsePaid.slice(0, 6).map((item) => (
              <CatalogCard key={item.id} item={item} />
            ))}
          </div>
        </section>
      )}

      {owned.length === 0 && browseFree.length === 0 && browsePaid.length === 0 && (
        <section style={{ padding: '40px 20px' }}>
          <Card padding={24} style={{ textAlign: 'center' }}>
            <p
              className="ms-serif"
              style={{
                fontSize: 16,
                color: 'var(--text-muted)',
                margin: 0,
                lineHeight: 1.55,
              }}
            >
              The library is coming together. New reads will appear here soon.
            </p>
          </Card>
        </section>
      )}
    </div>
  )
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.12em',
        color: 'var(--text-muted)',
        textTransform: 'uppercase',
      }}
    >
      {children}
    </div>
  )
}

function CoverThumb({
  item,
  size = 100,
}: {
  item: LibraryItem
  size?: number
}) {
  return (
    <div
      style={{
        width: size,
        height: size * 1.2,
        borderRadius: 12,
        background: 'var(--accent-tint)',
        position: 'relative',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {item.coverImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={item.coverImage}
          alt={item.title}
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
              right: -10,
              top: -14,
              width: 60,
              height: 60,
            }}
          />
          <IconBook
            size={28}
            sw={1.6}
            style={{
              position: 'relative',
              color: 'var(--accent-deep)',
              opacity: 0.55,
            }}
          />
        </>
      )}
    </div>
  )
}

function CatalogCard({ item }: { item: LibraryItem }) {
  return (
    <Link
      href={`/user/library/${item.id}`}
      style={{
        display: 'block',
        background: 'var(--bg-card)',
        borderRadius: 18,
        overflow: 'hidden',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <div style={{ position: 'relative' }}>
        <CoverThumb item={item} size={160} />
        <div
          style={{
            position: 'absolute',
            top: 8,
            left: 8,
            fontSize: 10,
            fontWeight: 800,
            padding: '3px 8px',
            borderRadius: 999,
            background:
              item.type === 'FREE'
                ? 'rgba(74,184,116,0.85)'
                : 'rgba(0,0,0,0.55)',
            color: '#fff',
            letterSpacing: '0.06em',
            textTransform: 'uppercase',
          }}
        >
          {item.type === 'FREE'
            ? 'Free'
            : item.price
            ? `₹${Math.round(Number(item.price))}`
            : 'Paid'}
        </div>
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
          {item.title}
        </div>
      </div>
    </Link>
  )
}
