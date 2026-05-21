// Phase 5 — Mobile Workshops list. Ported from app/workshops.jsx.
// Navy hero + featured card + "This week" list. Each row links to
// /user/discover/workshops/[id] (existing detail; mobile variant in
// the sibling file).

import Link from 'next/link'
import { Card, Avatar, Blob, TypeChip } from './ui'
import { IconArrowLeft } from './icons'

export type WorkshopItem = {
  id: string
  title: string
  subtitle: string | null
  description: string
  coverImageUrl: string | null
  instructorName: string | null
  presenterName: string | null
  startsAt: string // ISO
  durationMin: number
  priceCents: number
  capacity: number | null
  registrationsCount: number
}

type MobileWorkshopsListProps = {
  upcoming: WorkshopItem[]
  attended: { id: string; title: string; startsAt: string }[]
}

export default function MobileWorkshopsList({
  upcoming,
  attended,
}: MobileWorkshopsListProps) {
  const featured = upcoming[0] ?? null
  const rest = upcoming.slice(1)

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
      {/* Hero */}
      <div
        style={{
          background: 'var(--navy)',
          color: 'var(--on-dark)',
          position: 'relative',
          overflow: 'hidden',
          borderBottomLeftRadius: 36,
          borderBottomRightRadius: 36,
          padding: '14px 20px 30px',
        }}
      >
        <Blob
          fill="rgba(255,248,235,0.07)"
          style={{
            position: 'absolute',
            right: -50,
            top: -60,
            width: 220,
            height: 220,
          }}
        />
        <Blob
          fill="rgba(201,120,100,0.18)"
          d="M40 12 C76 8 110 36 100 76 C92 110 40 120 14 92 C-6 70 4 18 40 12 Z"
          style={{
            position: 'absolute',
            left: -60,
            bottom: -70,
            width: 200,
            height: 200,
          }}
        />
        <header
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <Link
            href="/user/discover"
            aria-label="Back to Discover"
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: 'rgba(255,248,235,0.12)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'var(--on-dark)',
            }}
          >
            <IconArrowLeft size={16} sw={1.8} />
          </Link>
          <span
            style={{
              fontSize: 11,
              fontWeight: 800,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
              opacity: 0.7,
            }}
          >
            Workshops
          </span>
        </header>
        <div style={{ position: 'relative', marginTop: 22 }}>
          <h1
            className="ms-display"
            style={{ fontSize: 38, lineHeight: 1.0, marginBottom: 0 }}
          >
            Learn from people
            <br />
            who do this for a living.
          </h1>
          <p
            className="ms-serif"
            style={{
              marginTop: 12,
              fontSize: 15,
              opacity: 0.82,
              maxWidth: 300,
              lineHeight: 1.5,
            }}
          >
            Live sessions with clinical psychologists. Topical, practical,
            and small enough to ask questions in.
          </p>
        </div>
      </div>

      {upcoming.length === 0 ? (
        <div style={{ padding: 20, marginTop: 20 }}>
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
              No workshops scheduled. Check back soon for upcoming sessions.
            </p>
          </Card>
        </div>
      ) : (
        <>
          {/* Featured */}
          {featured && (
            <section style={{ padding: '20px 20px 0' }}>
              <FeaturedWorkshopCard w={featured} />
            </section>
          )}

          {/* Rest */}
          {rest.length > 0 && (
            <section style={{ padding: '24px 20px 0' }}>
              <div style={{ marginBottom: 14 }}>
                <div
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    color: 'var(--text-muted)',
                    textTransform: 'uppercase',
                  }}
                >
                  Live · Google Meet
                </div>
                <div
                  className="ms-display"
                  style={{
                    fontSize: 26,
                    color: 'var(--text)',
                    marginTop: 4,
                  }}
                >
                  More this week
                </div>
              </div>
              <div style={{ display: 'grid', gap: 12 }}>
                {rest.map((w) => (
                  <WorkshopRow key={w.id} w={w} />
                ))}
              </div>
            </section>
          )}
        </>
      )}

      {attended.length > 0 && (
        <section style={{ padding: '32px 20px 0' }}>
          <div style={{ marginBottom: 12 }}>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: '0.12em',
                color: 'var(--text-muted)',
                textTransform: 'uppercase',
              }}
            >
              Your past workshops
            </div>
          </div>
          <Card padding={0}>
            {attended.slice(0, 5).map((w, i, arr) => (
              <Link
                key={w.id}
                href={`/user/discover/workshops/${w.id}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  padding: '14px 16px',
                  borderBottom:
                    i === arr.length - 1
                      ? 'none'
                      : '1px solid var(--border)',
                }}
              >
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: 'var(--text)',
                    }}
                  >
                    {w.title}
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: 'var(--text-muted)',
                      marginTop: 2,
                    }}
                  >
                    {new Date(w.startsAt).toLocaleDateString('en-IN', {
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </div>
                </div>
              </Link>
            ))}
          </Card>
        </section>
      )}
    </div>
  )
}

function FeaturedWorkshopCard({ w }: { w: WorkshopItem }) {
  const presenter = w.presenterName ?? w.instructorName ?? 'Mindset facilitator'
  const date = new Date(w.startsAt)
  const fillRatio = w.capacity ? w.registrationsCount / w.capacity : 0
  const filling = fillRatio >= 0.7

  return (
    <Link
      href={`/user/discover/workshops/${w.id}`}
      style={{ display: 'block' }}
    >
      <Card padding={0} style={{ overflow: 'hidden' }}>
        <div
          style={{
            height: 120,
            background: 'var(--primary-tint)',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'flex-end',
            padding: '14px 16px',
          }}
        >
          {w.coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={w.coverImageUrl}
              alt={w.title}
              style={{
                position: 'absolute',
                inset: 0,
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
                  right: -22,
                  top: -28,
                  width: 130,
                  height: 130,
                }}
              />
              <Blob
                fill="rgba(0,0,0,0.05)"
                d="M40 12 C76 8 110 36 100 76 C92 110 40 120 14 92 C-6 70 4 18 40 12 Z"
                style={{
                  position: 'absolute',
                  left: -10,
                  bottom: -18,
                  width: 80,
                  height: 80,
                }}
              />
            </>
          )}
          <div
            style={{
              position: 'relative',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <TypeChip kind="workshop" size="lg" />
            {filling && (
              <span
                style={{
                  fontSize: 10.5,
                  fontWeight: 800,
                  letterSpacing: '0.06em',
                  color: 'var(--accent-deep)',
                  background: 'rgba(255,255,255,0.85)',
                  padding: '4px 8px',
                  borderRadius: 999,
                }}
              >
                Filling up · {w.registrationsCount}/{w.capacity}
              </span>
            )}
          </div>
        </div>
        <div style={{ padding: '14px 16px 16px' }}>
          <div
            className="ms-display"
            style={{
              fontSize: 22,
              color: 'var(--text)',
              lineHeight: 1.15,
            }}
          >
            {w.title}
          </div>
          {w.subtitle && (
            <div
              className="ms-serif"
              style={{
                fontSize: 14,
                color: 'var(--text-muted)',
                marginTop: 6,
                lineHeight: 1.45,
              }}
            >
              {w.subtitle}
            </div>
          )}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginTop: 14,
              paddingTop: 12,
              borderTop: '1px solid var(--border)',
            }}
          >
            <Avatar
              name={presenter}
              size={32}
              color="var(--primary)"
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'var(--text)',
                }}
              >
                {presenter}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--text-muted)',
                  marginTop: 1,
                }}
              >
                {date.toLocaleDateString('en-IN', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                })}{' '}
                ·{' '}
                {date.toLocaleTimeString('en-IN', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                })}{' '}
                · {w.durationMin} min
              </div>
            </div>
            {w.priceCents > 0 ? (
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: 'var(--primary)',
                  background: 'var(--primary-tint)',
                  padding: '6px 10px',
                  borderRadius: 999,
                  whiteSpace: 'nowrap',
                }}
              >
                ₹{Math.round(w.priceCents / 100)}
              </span>
            ) : (
              <span
                style={{
                  fontSize: 12,
                  fontWeight: 800,
                  color: '#2A7A4A',
                  background: 'rgba(74,184,116,0.18)',
                  padding: '6px 10px',
                  borderRadius: 999,
                  whiteSpace: 'nowrap',
                }}
              >
                Free
              </span>
            )}
          </div>
        </div>
      </Card>
    </Link>
  )
}

function WorkshopRow({ w }: { w: WorkshopItem }) {
  const presenter = w.presenterName ?? w.instructorName ?? 'Mindset facilitator'
  const date = new Date(w.startsAt)
  const fillRatio = w.capacity ? w.registrationsCount / w.capacity : 0
  const filling = fillRatio >= 0.7

  return (
    <Link
      href={`/user/discover/workshops/${w.id}`}
      style={{ display: 'block' }}
    >
      <Card padding={0} style={{ overflow: 'hidden' }}>
        <div
          style={{
            height: 86,
            background: 'var(--soft-blue)',
            position: 'relative',
            overflow: 'hidden',
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'space-between',
          }}
        >
          {w.coverImageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={w.coverImageUrl}
              alt={w.title}
              style={{
                position: 'absolute',
                inset: 0,
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
                  right: -22,
                  top: -28,
                  width: 110,
                  height: 110,
                }}
              />
            </>
          )}
          <TypeChip kind="workshop" />
          {filling && (
            <span
              style={{
                position: 'relative',
                fontSize: 10.5,
                fontWeight: 800,
                letterSpacing: '0.06em',
                color: 'var(--accent-deep)',
                background: 'rgba(255,255,255,0.85)',
                padding: '4px 8px',
                borderRadius: 999,
              }}
            >
              Filling up · {w.registrationsCount}/{w.capacity}
            </span>
          )}
        </div>
        <div style={{ padding: '14px 16px 16px' }}>
          <div
            className="ms-display"
            style={{
              fontSize: 19,
              color: 'var(--text)',
              lineHeight: 1.15,
            }}
          >
            {w.title}
          </div>
          {w.subtitle && (
            <div
              className="ms-serif"
              style={{
                fontSize: 13.5,
                color: 'var(--text-muted)',
                marginTop: 6,
                lineHeight: 1.45,
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical' as const,
                overflow: 'hidden',
              }}
            >
              {w.subtitle}
            </div>
          )}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginTop: 12,
            }}
          >
            <Avatar name={presenter} size={32} color="var(--navy)" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: 'var(--text)',
                }}
              >
                {presenter}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--text-muted)',
                  marginTop: 1,
                }}
              >
                {date.toLocaleDateString('en-IN', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                })}{' '}
                ·{' '}
                {date.toLocaleTimeString('en-IN', {
                  hour: 'numeric',
                  minute: '2-digit',
                  hour12: true,
                })}{' '}
                · {w.durationMin} min
              </div>
            </div>
            <span
              style={{
                fontSize: 13,
                fontWeight: 800,
                color:
                  w.priceCents > 0 ? 'var(--primary)' : '#2A7A4A',
                background:
                  w.priceCents > 0
                    ? 'var(--primary-tint)'
                    : 'rgba(74,184,116,0.18)',
                padding: '6px 10px',
                borderRadius: 999,
                whiteSpace: 'nowrap',
              }}
            >
              {w.priceCents > 0
                ? `₹${Math.round(w.priceCents / 100)}`
                : 'Free'}
            </span>
          </div>
        </div>
      </Card>
    </Link>
  )
}
