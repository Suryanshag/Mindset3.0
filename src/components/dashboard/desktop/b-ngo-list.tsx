import Link from 'next/link'
import Image from 'next/image'
import { BCap, BCard } from './b-atoms'
import BPageHeader from './b-page-header'

// Phase 3f — NGO visits list (Direction B port).

type NgoVisit = {
  id: string
  ngoName: string
  location: string
  description: string
  photos: string[]
  visitDate: Date
  capacity: number | null
  isRegistered: boolean
  goingCount: number
}

type Props = {
  upcoming: NgoVisit[]
  totalAttended: number
}

export default function BNgoList({ upcoming, totalAttended }: Props) {
  return (
    <>
      <BPageHeader
        title="NGO visits."
        breadcrumb={[
          { label: 'DISCOVER', href: '/user/discover' },
          { label: 'NGO VISITS' },
        ]}
        back="/user/discover"
        sub="Once a month, Mindset hosts a quiet community visit. No fundraising, no photos, no posting."
        ctas={['search']}
      />

      {/* Manifesto + history */}
      <BCard padding={0}>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 230px',
            gap: 28,
            alignItems: 'center',
            padding: '18px 26px',
          }}
        >
          <div>
            <BCap>What this is and isn&rsquo;t</BCap>
            <p
              style={{
                fontFamily: 'var(--font-serif)',
                fontSize: 17,
                color: 'var(--text)',
                marginTop: 10,
                lineHeight: 1.6,
              }}
            >
              We visit a partner organisation with the people who work there. No
              volunteering certificate, no Instagram story, no donation
              pressure on you.
            </p>
            <p
              style={{
                fontFamily: 'var(--font-serif)',
                fontStyle: 'italic',
                fontSize: 14,
                color: 'var(--text-muted)',
                marginTop: 8,
                lineHeight: 1.55,
              }}
            >
              Showing up matters. So does leaving when you said you would.
            </p>
          </div>
          <div
            style={{
              background: 'var(--bg-paper)',
              borderRadius: 12,
              padding: '16px 18px',
              border: '1px solid var(--border)',
            }}
          >
            <BCap>Your history</BCap>
            <p
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 26,
                fontWeight: 500,
                marginTop: 4,
                color: 'var(--text)',
              }}
            >
              {totalAttended} {totalAttended === 1 ? 'visit' : 'visits'}
            </p>
            <p style={{ fontSize: 11.5, color: 'var(--text-faint)', marginTop: 4 }}>
              {totalAttended === 0 ? 'first time?' : 'thank you'}
            </p>
          </div>
        </div>
      </BCard>

      {/* Visits */}
      <div>
        <div
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 17,
            fontWeight: 500,
            marginBottom: 12,
            color: 'var(--text)',
          }}
        >
          Upcoming
        </div>
        {upcoming.length === 0 ? (
          <BCard style={{ textAlign: 'center', padding: '48px 24px' }}>
            <p
              style={{
                fontFamily: 'var(--font-serif)',
                fontStyle: 'italic',
                fontSize: 14,
                color: 'var(--text-muted)',
              }}
            >
              No visits scheduled right now. We run new ones every 4–6 weeks.
            </p>
          </BCard>
        ) : (
          <div className="flex flex-col gap-3">
            {upcoming.map((v) => (
              <VisitRow key={v.id} visit={v} />
            ))}
          </div>
        )}
      </div>

      <p
        style={{
          fontFamily: 'var(--font-serif)',
          fontStyle: 'italic',
          fontSize: 13,
          color: 'var(--text-faint)',
          textAlign: 'center',
        }}
      >
        If you can&rsquo;t make it, it&rsquo;s genuinely fine. Tell us 24 h
        before so we can free your spot.
      </p>
    </>
  )
}

function VisitRow({ visit }: { visit: NgoVisit }) {
  const isFull = visit.capacity != null && visit.goingCount >= visit.capacity
  const dateLine = visit.visitDate
    .toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
    .toUpperCase()
  const timeLine = visit.visitDate
    .toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })
    .toLowerCase()
  const firstPhoto = visit.photos[0] ?? null

  return (
    <Link
      href={`/user/discover/ngo-visits/${visit.id}`}
      style={{
        background: 'var(--bg-card)',
        borderRadius: 12,
        border: '1px solid var(--border)',
        padding: '16px 20px',
        display: 'grid',
        gridTemplateColumns: '80px 100px 1fr 160px',
        gap: 18,
        alignItems: 'center',
        opacity: isFull ? 0.78 : 1,
      }}
    >
      <div
        style={{
          position: 'relative',
          width: 80,
          height: 80,
          borderRadius: 10,
          overflow: 'hidden',
          background: 'var(--accent-tint)',
          display: 'grid',
          placeItems: 'center',
        }}
      >
        {firstPhoto ? (
          <Image
            fill
            src={firstPhoto}
            alt={visit.ngoName}
            sizes="80px"
            style={{ objectFit: 'cover' }}
            unoptimized
          />
        ) : (
          <span
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 28,
              fontWeight: 600,
              color: 'var(--accent)',
            }}
          >
            {visit.ngoName.charAt(0).toUpperCase()}
          </span>
        )}
      </div>
      <div>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10.5,
            color: 'var(--primary)',
            letterSpacing: '0.06em',
          }}
        >
          {dateLine}
        </div>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 9.5,
            color: 'var(--text-faint)',
            marginTop: 4,
          }}
        >
          {timeLine}
        </div>
      </div>
      <div>
        <div
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 16,
            fontWeight: 500,
            color: 'var(--text)',
          }}
        >
          {visit.ngoName}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
          {visit.location}
        </div>
        <p
          style={{
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
            fontSize: 13.5,
            color: 'var(--text)',
            marginTop: 6,
            lineHeight: 1.55,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {visit.description}
        </p>
      </div>
      <div className="text-right">
        <BCap>{isFull ? 'Going' : 'Spots'}</BCap>
        <div
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 14,
            fontWeight: 500,
            marginTop: 4,
            color: 'var(--text)',
          }}
        >
          {visit.capacity
            ? `${visit.goingCount} / ${visit.capacity}${isFull ? ' · full' : ''}`
            : `${visit.goingCount} going`}
        </div>
        <span
          style={{
            display: 'inline-block',
            marginTop: 10,
            fontFamily: 'var(--font-heading)',
            fontSize: 12,
            color: visit.isRegistered ? 'var(--primary)' : 'var(--primary)',
            fontWeight: 500,
          }}
        >
          {visit.isRegistered ? '✓ Going' : 'I&rsquo;ll come ›'}
        </span>
      </div>
    </Link>
  )
}
