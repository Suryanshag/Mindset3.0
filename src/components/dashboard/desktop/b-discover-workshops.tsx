import Link from 'next/link'
import Image from 'next/image'
import { BCap, BCard, BChip } from './b-atoms'
import BPageHeader from './b-page-header'

// Phase 3f — Workshops list (Direction B port).

type Workshop = {
  id: string
  title: string
  subtitle: string | null
  coverImageUrl: string | null
  instructorName: string | null
  presenterName: string | null
  startsAt: Date
  durationMin: number
  priceCents: number
  capacity: number | null
  registrationsCount: number
}

type Attended = {
  id: string
  title: string
  startsAt: Date
}

type Props = {
  upcoming: Workshop[]
  attended: Attended[]
}

export default function BDiscoverWorkshops({ upcoming, attended }: Props) {
  const sub = upcoming.length > 0
    ? `${upcoming.length} workshop${upcoming.length === 1 ? '' : 's'} coming up`
    : 'No workshops scheduled right now'

  const monthLabel = upcoming[0]
    ? upcoming[0].startsAt.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }).toUpperCase()
    : null

  return (
    <>
      <BPageHeader
        title="Workshops."
        breadcrumb={[
          { label: 'DISCOVER', href: '/user/discover' },
          { label: 'WORKSHOPS' },
        ]}
        back="/user/discover"
        sub={sub}
        ctas={['search']}
      />

      {/* Featured top card if there's an upcoming workshop */}
      {upcoming[0] && <FeaturedWorkshop workshop={upcoming[0]} />}

      {/* Grid of the rest */}
      {upcoming.length > 1 && (
        <div>
          <div className="flex items-baseline justify-between mb-3">
            <div
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 17,
                fontWeight: 500,
                color: 'var(--text)',
              }}
            >
              The next few weeks
            </div>
            {monthLabel && (
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10.5,
                  color: 'var(--text-faint)',
                }}
              >
                {monthLabel} · ALL IST
              </span>
            )}
          </div>
          <div className="grid grid-cols-4 gap-3">
            {upcoming.slice(1).map((w) => (
              <WorkshopTile key={w.id} workshop={w} />
            ))}
          </div>
        </div>
      )}

      {upcoming.length === 0 && (
        <BCard style={{ textAlign: 'center', padding: '48px 24px' }}>
          <p
            style={{
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              fontSize: 14,
              color: 'var(--text-muted)',
            }}
          >
            Nothing on the calendar right now. New workshops land every few weeks.
          </p>
        </BCard>
      )}

      {/* Attended list */}
      {attended.length > 0 && (
        <div>
          <BCap>You&rsquo;ve attended</BCap>
          <BCard padding={0} style={{ overflow: 'hidden', marginTop: 10 }}>
            {attended.map((a, i) => (
              <Link
                key={a.id}
                href={`/user/discover/workshops/${a.id}`}
                style={{
                  display: 'grid',
                  gridTemplateColumns: '170px 1fr 24px',
                  gap: 16,
                  padding: '12px 18px',
                  alignItems: 'center',
                  borderTop: i === 0 ? 'none' : '1px solid var(--border)',
                }}
              >
                <div
                  style={{
                    fontFamily: 'var(--font-mono)',
                    fontSize: 11,
                    color: 'var(--text-faint)',
                    letterSpacing: '0.06em',
                  }}
                >
                  {a.startsAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase()}
                </div>
                <div style={{ fontSize: 13.5, color: 'var(--text)' }}>{a.title}</div>
                <span style={{ color: 'var(--text-muted)' }}>›</span>
              </Link>
            ))}
          </BCard>
        </div>
      )}
    </>
  )
}

function FeaturedWorkshop({ workshop }: { workshop: Workshop }) {
  const presenter = workshop.presenterName ?? workshop.instructorName ?? null
  const priceLabel =
    workshop.priceCents === 0 ? 'FREE' : `₹${(workshop.priceCents / 100).toLocaleString('en-IN')}`
  return (
    <Link href={`/user/discover/workshops/${workshop.id}`}>
      <BCard
        padding={0}
        style={{ overflow: 'hidden', boxShadow: 'var(--shadow-card)' }}
      >
        <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr' }}>
          <div style={{ padding: '26px 28px', borderRight: '1px solid var(--border)' }}>
            <BCap>Featured this week</BCap>
            <p
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 30,
                fontWeight: 500,
                lineHeight: 1.1,
                color: 'var(--text)',
                marginTop: 10,
              }}
            >
              {workshop.title}
            </p>
            {workshop.subtitle && (
              <p
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontStyle: 'italic',
                  fontSize: 15,
                  color: 'var(--text-muted)',
                  marginTop: 10,
                  lineHeight: 1.55,
                  maxWidth: 480,
                }}
              >
                {workshop.subtitle}
              </p>
            )}
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 18 }}>
              <BChip kind="workshop">{priceLabel}</BChip>
              <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {workshop.startsAt.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}{' · '}
                {workshop.startsAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}{' · '}
                {workshop.durationMin} min
                {workshop.capacity ? ` · ${workshop.registrationsCount} of ${workshop.capacity} seats` : ''}
              </span>
            </div>
          </div>
          <div
            style={{
              padding: '26px 28px',
              background: 'var(--bg-paper)',
              display: 'flex',
              flexDirection: 'column',
              gap: 10,
            }}
          >
            <BCap>With</BCap>
            <p
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 18,
                fontWeight: 500,
                color: 'var(--text)',
              }}
            >
              {presenter ?? 'A Mindset facilitator'}
            </p>
            {workshop.coverImageUrl && (
              <div
                style={{
                  position: 'relative',
                  marginTop: 8,
                  width: '100%',
                  aspectRatio: '4 / 3',
                  borderRadius: 8,
                  overflow: 'hidden',
                  border: '1px solid var(--border)',
                }}
              >
                <Image
                  fill
                  src={workshop.coverImageUrl}
                  alt={workshop.title}
                  sizes="300px"
                  style={{ objectFit: 'contain' }}
                  unoptimized
                />
              </div>
            )}
          </div>
        </div>
      </BCard>
    </Link>
  )
}

function WorkshopTile({ workshop }: { workshop: Workshop }) {
  const dateLabel = `${workshop.startsAt.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase()}`
  const priceLabel =
    workshop.priceCents === 0 ? 'FREE' : `₹${(workshop.priceCents / 100).toLocaleString('en-IN')}`
  const presenter = workshop.presenterName ?? workshop.instructorName ?? 'A Mindset facilitator'
  return (
    <Link href={`/user/discover/workshops/${workshop.id}`}>
      <BCard padding={16} style={{ display: 'flex', flexDirection: 'column', gap: 8, minHeight: 160 }}>
        <div className="flex justify-between items-baseline">
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 10.5,
              color: 'var(--primary)',
              letterSpacing: '0.06em',
            }}
          >
            {dateLabel}
          </span>
          <BChip kind="workshop">{priceLabel}</BChip>
        </div>
        <p
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 16,
            fontWeight: 500,
            lineHeight: 1.2,
            color: 'var(--text)',
            marginTop: 4,
          }}
        >
          {workshop.title}
        </p>
        <p
          style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 'auto' }}
        >
          {workshop.startsAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}{' · '}{workshop.durationMin} min
        </p>
        <p style={{ fontSize: 11.5, color: 'var(--text-faint)', fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>
          with {presenter}
        </p>
      </BCard>
    </Link>
  )
}
