// Phase 5 — Mobile Workshop detail. Ported from app/workshops.jsx
// detail patterns. Reuses the existing WorkshopRegisterButton (paid
// flow from Sprint Workshops-Paid) verbatim — only chrome is mobile-
// specific.

import Link from 'next/link'
import { Card, Avatar, Blob, TypeChip } from './ui'
import { IconArrowLeft, IconCalendar, IconClock, IconVideo } from './icons'
import WorkshopRegisterButton from '@/app/(dashboard)/user/discover/workshops/[id]/register-button'

export type WorkshopDetailItem = {
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
  meetLink: string | null
  whatsappGroupUrl: string | null
}

type MobileWorkshopDetailProps = {
  w: WorkshopDetailItem
  isRegistered: boolean
  isPast: boolean
  isFull: boolean
  /** Live "join window" state from src/lib/workshop-window.ts. */
  joinable: boolean
}

export default function MobileWorkshopDetail({
  w,
  isRegistered,
  isPast,
  isFull,
  joinable,
}: MobileWorkshopDetailProps) {
  const presenter = w.presenterName ?? w.instructorName ?? 'Mindset facilitator'
  const date = new Date(w.startsAt)
  const isFree = w.priceCents === 0
  const fillRatio = w.capacity ? w.registrationsCount / w.capacity : 0
  const filling = !isPast && !isFull && fillRatio >= 0.7

  return (
    <div
      data-mobile-fullbleed
      data-no-mobile-header
      className="screen-scroll"
      style={{
        background: 'var(--bg-app)',
        minHeight: '100%',
        overflowY: 'auto',
        paddingBottom: 130,
      }}
    >
      {/* Hero — image OR primary-tint gradient fallback */}
      <div
        style={{
          background: 'var(--primary-tint)',
          position: 'relative',
          overflow: 'hidden',
          borderBottomLeftRadius: 32,
          borderBottomRightRadius: 32,
          padding: '14px 20px 28px',
        }}
      >
        {w.coverImageUrl && (
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
              opacity: 0.55,
            }}
          />
        )}
        {!w.coverImageUrl && (
          <>
            <Blob
              fill="rgba(255,255,255,0.45)"
              style={{
                position: 'absolute',
                right: -40,
                top: -50,
                width: 200,
                height: 200,
              }}
            />
            <Blob
              fill="rgba(45,90,79,0.10)"
              d="M40 12 C76 8 110 36 100 76 C92 110 40 120 14 92 C-6 70 4 18 40 12 Z"
              style={{
                position: 'absolute',
                left: -40,
                bottom: -60,
                width: 160,
                height: 160,
              }}
            />
          </>
        )}
        <header
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}
        >
          <Link
            href="/user/discover/workshops"
            aria-label="Back to Workshops"
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.7)',
              color: 'var(--navy)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <IconArrowLeft size={16} sw={1.8} />
          </Link>
          <TypeChip kind="workshop" size="lg" />
        </header>
        <div style={{ position: 'relative', marginTop: 22 }}>
          <h1
            className="ms-display"
            style={{
              fontSize: 28,
              color: 'var(--text)',
              lineHeight: 1.1,
              marginBottom: 0,
            }}
          >
            {w.title}
          </h1>
          {w.subtitle && (
            <p
              className="ms-serif"
              style={{
                fontSize: 15,
                color: 'var(--text-muted)',
                marginTop: 8,
                lineHeight: 1.5,
              }}
            >
              {w.subtitle}
            </p>
          )}
        </div>
      </div>

      {/* Presenter + Info */}
      <section style={{ padding: '20px 20px 0' }}>
        <Card padding={16}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <Avatar name={presenter} size={48} color="var(--primary)" />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.10em',
                  textTransform: 'uppercase',
                  color: 'var(--text-muted)',
                }}
              >
                Hosted by
              </div>
              <div
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  color: 'var(--text)',
                  marginTop: 2,
                }}
              >
                {presenter}
              </div>
            </div>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 10,
              marginTop: 16,
            }}
          >
            <InfoCell
              icon={<IconCalendar size={14} sw={1.7} />}
              label={date.toLocaleDateString('en-IN', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
              })}
              sub={date.toLocaleTimeString('en-IN', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true,
              })}
            />
            <InfoCell
              icon={<IconClock size={14} sw={1.7} />}
              label={`${w.durationMin} min`}
              sub="Live · Google Meet"
            />
          </div>

          {filling && (
            <div
              style={{
                marginTop: 14,
                fontSize: 12,
                fontWeight: 800,
                color: 'var(--accent-deep)',
                background: 'var(--accent-tint)',
                padding: '8px 12px',
                borderRadius: 12,
                letterSpacing: '0.04em',
              }}
            >
              Filling up · {w.registrationsCount}/{w.capacity} seats taken
            </div>
          )}

          {isFull && !isRegistered && (
            <div
              style={{
                marginTop: 14,
                fontSize: 12,
                fontWeight: 800,
                color: '#7A1F12',
                background: 'rgba(154,52,18,0.10)',
                padding: '8px 12px',
                borderRadius: 12,
              }}
            >
              Sold out — registrations closed.
            </div>
          )}
        </Card>
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
          What you'll get
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
          {w.description}
        </p>
      </section>

      {/* Poster — reuses coverImageUrl per Mobile-Polish-1 T4. The
          hero up top renders the same asset at 55% opacity behind a
          tint; this section renders it again at full opacity as a
          standalone "card" beneath the description so users who only
          scan can see the workshop's promotional artwork clearly. */}
      {w.coverImageUrl && (
        <section style={{ padding: '20px 20px 0' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={w.coverImageUrl}
            alt={`${w.title} poster`}
            style={{
              width: '100%',
              height: 'auto',
              borderRadius: 18,
              boxShadow: 'var(--shadow-card)',
              display: 'block',
            }}
          />
        </section>
      )}

      {/* Meet link card — registered + joinable */}
      {isRegistered && joinable && w.meetLink && (
        <section style={{ padding: '20px 20px 0' }}>
          <a
            href={w.meetLink}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              width: '100%',
              padding: '14px 18px',
              borderRadius: 18,
              background: 'var(--primary)',
              color: 'var(--on-dark)',
              fontSize: 14,
              fontWeight: 800,
              boxShadow: 'var(--shadow-pop)',
              justifyContent: 'center',
            }}
          >
            <IconVideo size={16} sw={2} /> Join Google Meet
          </a>
        </section>
      )}

      {/* Registered confirmation when not yet joinable */}
      {isRegistered && !joinable && !isPast && (
        <section style={{ padding: '20px 20px 0' }}>
          <Card padding={16} bg="var(--bg-cream)">
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                letterSpacing: '0.10em',
                color: 'var(--primary)',
                textTransform: 'uppercase',
              }}
            >
              You're registered
            </div>
            <p
              className="ms-serif"
              style={{
                fontSize: 14,
                color: 'var(--text)',
                lineHeight: 1.55,
                marginTop: 6,
                marginBottom: 0,
              }}
            >
              The Google Meet link will appear here 15 minutes before the
              session starts.
            </p>
          </Card>
        </section>
      )}

      {/* Sticky bottom register pill — hidden when past/already registered */}
      {!isRegistered && !isPast && (
        <div
          style={{
            position: 'fixed',
            left: 14,
            right: 14,
            bottom: 'calc(env(safe-area-inset-bottom) + 76px)',
            zIndex: 12,
          }}
        >
          <div
            style={{
              background: 'var(--bg-card)',
              borderRadius: 999,
              padding: '8px 8px 8px 18px',
              display: 'flex',
              alignItems: 'center',
              boxShadow: 'var(--shadow-pop)',
            }}
          >
            <div style={{ flex: 1 }}>
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--text-muted)',
                  fontWeight: 700,
                  letterSpacing: '0.10em',
                  textTransform: 'uppercase',
                }}
              >
                Price
              </div>
              <div
                className="ms-display"
                style={{ fontSize: 22, color: 'var(--text)' }}
              >
                {isFree ? 'Free' : `₹${Math.round(w.priceCents / 100)}`}
              </div>
            </div>
            <div style={{ minWidth: 160 }}>
              <WorkshopRegisterButton
                workshopId={w.id}
                workshopTitle={w.title}
                isPast={isPast}
                isFull={isFull}
                isFree={isFree}
                isRegistered={isRegistered}
                whatsappUrl={w.whatsappGroupUrl}
                price={Math.round(w.priceCents / 100)}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function InfoCell({
  icon,
  label,
  sub,
}: {
  icon: React.ReactNode
  label: string
  sub: string
}) {
  return (
    <div
      style={{
        padding: 12,
        background: 'var(--bg-app)',
        borderRadius: 14,
      }}
    >
      <div
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          fontSize: 13,
          fontWeight: 700,
          color: 'var(--text)',
        }}
      >
        {icon} {label}
      </div>
      <div
        style={{
          fontSize: 11,
          color: 'var(--text-muted)',
          marginTop: 4,
        }}
      >
        {sub}
      </div>
    </div>
  )
}
