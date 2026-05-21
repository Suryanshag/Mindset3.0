// Phase 5 — Mobile NGO visits list. Ported from app/ngo.jsx.
// Reuses existing registerForNgoVisit action via the existing
// /user/discover/ngo-visits/[id] detail page.

import Link from 'next/link'
import { Card } from './ui'
import {
  IconArrowLeft,
  IconCalendar,
  IconChevR,
  IconMapPin,
} from './icons'

export type NgoVisitListItem = {
  id: string
  ngoName: string
  location: string
  description: string
  photos: string[]
  visitDate: string // ISO
  isRegistered: boolean
}

type MobileNgoListProps = {
  upcoming: NgoVisitListItem[]
}

export default function MobileNgoList({ upcoming }: MobileNgoListProps) {
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
            NGO visits
          </div>
          <div
            style={{
              fontSize: 12,
              color: 'var(--text-muted)',
              marginTop: 2,
            }}
          >
            One Saturday a month, with intention
          </div>
        </div>
      </header>

      <section style={{ padding: '12px 20px 0' }}>
        {upcoming.length === 0 ? (
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
              No upcoming visits scheduled. We run drives every 4–6 weeks.
            </p>
          </Card>
        ) : (
          <div style={{ display: 'grid', gap: 14 }}>
            {upcoming.map((v) => (
              <NgoVisitCard key={v.id} v={v} />
            ))}
          </div>
        )}
      </section>
    </div>
  )
}

function NgoVisitCard({ v }: { v: NgoVisitListItem }) {
  const date = new Date(v.visitDate)
  const cover = v.photos[0]
  return (
    <Link
      href={`/user/discover/ngo-visits/${v.id}`}
      style={{ display: 'block' }}
    >
      <Card padding={0} style={{ overflow: 'hidden' }}>
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt={v.ngoName}
            style={{
              width: '100%',
              height: 160,
              objectFit: 'cover',
              display: 'block',
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: 120,
              background:
                'linear-gradient(135deg, var(--accent-tint) 0%, var(--primary-tint) 100%)',
            }}
          />
        )}
        <div style={{ padding: 16 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              marginBottom: 10,
            }}
          >
            <span
              style={{
                fontSize: 10.5,
                fontWeight: 800,
                letterSpacing: '0.10em',
                textTransform: 'uppercase',
                color: 'var(--primary)',
                background: 'var(--primary-tint)',
                padding: '4px 10px',
                borderRadius: 999,
              }}
            >
              NGO visit
            </span>
            {v.isRegistered && (
              <span
                style={{
                  marginLeft: 'auto',
                  fontSize: 11,
                  fontWeight: 800,
                  color: '#2A7A4A',
                  background: 'rgba(74,184,116,0.18)',
                  padding: '4px 10px',
                  borderRadius: 999,
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 4,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                }}
              >
                ✓ Registered
              </span>
            )}
          </div>

          <div
            className="ms-display"
            style={{
              fontSize: 20,
              color: 'var(--text)',
              lineHeight: 1.2,
            }}
          >
            {v.ngoName}
          </div>
          <p
            style={{
              fontSize: 13,
              color: 'var(--text-muted)',
              lineHeight: 1.5,
              margin: '8px 0 0',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical' as const,
              overflow: 'hidden',
            }}
          >
            {v.description}
          </p>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              marginTop: 12,
              paddingTop: 12,
              borderTop: '1px solid var(--border)',
              fontSize: 12,
              color: 'var(--text-muted)',
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <IconCalendar size={14} sw={1.7} />{' '}
              {date.toLocaleDateString('en-IN', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
              })}
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <IconMapPin size={14} sw={1.7} /> {v.location}
            </span>
            <IconChevR
              size={18}
              sw={1.7}
              style={{
                marginLeft: 'auto',
                color: 'var(--text-muted)',
              }}
            />
          </div>
        </div>
      </Card>
    </Link>
  )
}
