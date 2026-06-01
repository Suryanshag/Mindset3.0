import Link from 'next/link'
import Image from 'next/image'
import { BCap, BCard, BChip } from './b-atoms'
import BPageHeader from './b-page-header'

// Phase 3f — Discover hub (Direction B port).
// Aggregates the existing four sections (workshops, library, shop,
// community/NGO visits) into the B chrome. The codebase keeps this
// page as a hub even though the design's BDiscover focuses on
// workshops alone — preserving routes is non-negotiable.

type WorkshopPreview = {
  id: string
  title: string
  subtitle: string | null
  startsAt: Date
  durationMin: number
  priceCents: number
  capacity: number | null
  registrationsCount: number
  presenterName: string | null
}

type LibraryItem = {
  id: string
  title: string
  type: 'FREE' | 'PAID'
  price: string | null
  coverImage: string | null
}

type ShopItem = {
  id: string
  name: string
  price: string
  image: string | null
}

type NgoVisit = {
  id: string
  ngoName: string
  location: string
  visitDate: Date
}

type Props = {
  upcomingWorkshopCount: number
  libraryMaterialCount: number
  nextWorkshop: WorkshopPreview | null
  libraryPreview: LibraryItem[]
  shopPreview: ShopItem[]
  nextNgoVisit: NgoVisit | null
}

export default function BDiscoverHub({
  upcomingWorkshopCount,
  libraryMaterialCount,
  nextWorkshop,
  libraryPreview,
  shopPreview,
  nextNgoVisit,
}: Props) {
  const sub = [
    upcomingWorkshopCount > 0
      ? `${upcomingWorkshopCount} workshop${upcomingWorkshopCount > 1 ? 's' : ''} coming up`
      : null,
    libraryMaterialCount > 0
      ? `${libraryMaterialCount} in the library`
      : null,
  ]
    .filter(Boolean)
    .join(' · ')

  return (
    <>
      <BPageHeader
        title="Discover."
        sub={sub || 'Workshops, group spaces, the library and the shop.'}
        ctas={['search']}
      />

      {/* Four-up section tiles */}
      <div className="grid grid-cols-4 gap-3">
        <SectionTile
          href="/user/discover/workshops"
          kind="workshop"
          title="Workshops"
          sub={nextWorkshop ? `Next: ${nextWorkshop.title}` : 'Nothing scheduled yet'}
        />
        <SectionTile
          href="/user/library"
          kind="primary"
          title="Library"
          sub={
            libraryPreview[0]
              ? `Recent: ${libraryPreview[0].title}`
              : 'Slow reading'
          }
        />
        <SectionTile
          href="/user/shop"
          kind="neutral"
          title="Shop"
          sub={shopPreview[0] ? `New: ${shopPreview[0].name}` : 'A small, slow shelf'}
        />
        <SectionTile
          href="/user/discover/ngo-visits"
          kind="accent"
          title="NGO visits"
          sub={
            nextNgoVisit
              ? `${nextNgoVisit.ngoName} · ${nextNgoVisit.visitDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
              : 'Quiet community visits'
          }
        />
      </div>

      {/* Featured workshop — wide card */}
      {nextWorkshop && (
        <div>
          <BCap>Coming up</BCap>
          <Link
            href={`/user/discover/workshops/${nextWorkshop.id}`}
            className="block mt-2.5"
          >
            <BCard accent="var(--accent)">
              <div className="flex items-baseline justify-between">
                <BCap>Featured · this week</BCap>
                <BChip kind="workshop">{nextWorkshop.priceCents === 0 ? 'FREE' : `₹${(nextWorkshop.priceCents / 100).toLocaleString('en-IN')}`}</BChip>
              </div>
              <p
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 26,
                  fontWeight: 500,
                  lineHeight: 1.15,
                  color: 'var(--text)',
                  marginTop: 10,
                }}
              >
                {nextWorkshop.title}
              </p>
              {nextWorkshop.subtitle && (
                <p
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontStyle: 'italic',
                    fontSize: 14,
                    color: 'var(--text-muted)',
                    marginTop: 6,
                  }}
                >
                  {nextWorkshop.subtitle}
                </p>
              )}
              <div
                style={{
                  fontSize: 12.5,
                  color: 'var(--text-muted)',
                  marginTop: 14,
                }}
              >
                {nextWorkshop.startsAt.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}{' · '}
                {nextWorkshop.startsAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}{' · '}
                {nextWorkshop.durationMin} min
                {nextWorkshop.presenterName ? ` · with ${nextWorkshop.presenterName}` : ''}
                {nextWorkshop.capacity ? ` · ${nextWorkshop.registrationsCount} of ${nextWorkshop.capacity} spots filled` : ''}
              </div>
            </BCard>
          </Link>
        </div>
      )}

      {/* Library preview row */}
      {libraryPreview.length > 0 && (
        <div>
          <div className="flex items-baseline justify-between mb-3">
            <BCap>From the library</BCap>
            <Link
              href="/user/library"
              style={{ fontFamily: 'var(--font-heading)', fontSize: 12, color: 'var(--primary)' }}
            >
              Open library ›
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {libraryPreview.slice(0, 3).map((item) => (
              <Link key={item.id} href={`/user/library/${item.id}`}>
                <BCard padding={0} style={{ overflow: 'hidden' }}>
                  <div
                    style={{
                      background: 'var(--bg-paper)',
                      aspectRatio: '3 / 4',
                      borderBottom: '1px solid var(--border)',
                      position: 'relative',
                      display: 'grid',
                      placeItems: 'center',
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
                  </div>
                  <div style={{ padding: 14 }}>
                    <BChip kind={item.type === 'FREE' ? 'primary' : 'workshop'}>
                      {item.type === 'FREE' ? 'FREE' : `₹${item.price ?? ''}`}
                    </BChip>
                    <p
                      style={{
                        fontFamily: 'var(--font-serif)',
                        fontSize: 15,
                        lineHeight: 1.35,
                        color: 'var(--text)',
                        marginTop: 8,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {item.title}
                    </p>
                  </div>
                </BCard>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Shop preview */}
      {shopPreview.length > 0 && (
        <div>
          <div className="flex items-baseline justify-between mb-3">
            <BCap>From the shop</BCap>
            <Link
              href="/user/shop"
              style={{ fontFamily: 'var(--font-heading)', fontSize: 12, color: 'var(--primary)' }}
            >
              Open shop ›
            </Link>
          </div>
          <div className="grid grid-cols-3 gap-3">
            {shopPreview.slice(0, 2).map((p) => (
              <Link key={p.id} href={`/user/shop/${p.id}`}>
                <BCard padding={0} style={{ overflow: 'hidden' }}>
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
                    {p.image ? (
                      <Image
                        fill
                        src={p.image}
                        alt={p.name}
                        sizes="280px"
                        style={{ objectFit: 'cover' }}
                        unoptimized
                      />
                    ) : (
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-faint)' }}>
                        [ PRODUCT ]
                      </span>
                    )}
                  </div>
                  <div style={{ padding: 14 }}>
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
                      {p.name}
                    </p>
                    <p
                      style={{
                        fontFamily: 'var(--font-heading)',
                        fontSize: 13,
                        fontWeight: 500,
                        color: 'var(--primary)',
                        marginTop: 6,
                      }}
                    >
                      ₹{Number(p.price).toLocaleString('en-IN')}
                    </p>
                  </div>
                </BCard>
              </Link>
            ))}
          </div>
        </div>
      )}
    </>
  )
}

function SectionTile({
  href,
  kind,
  title,
  sub,
}: {
  href: string
  kind: 'workshop' | 'primary' | 'neutral' | 'accent'
  title: string
  sub: string
}) {
  return (
    <Link href={href}>
      <BCard padding={18} style={{ minHeight: 130, display: 'flex', flexDirection: 'column', gap: 6 }}>
        <BChip kind={kind}>{title.toUpperCase()}</BChip>
        <p
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 18,
            fontWeight: 500,
            color: 'var(--text)',
            marginTop: 6,
          }}
        >
          {title}
        </p>
        <p
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 13,
            color: 'var(--text-muted)',
            lineHeight: 1.5,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {sub}
        </p>
        <span
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 12,
            color: 'var(--primary)',
            marginTop: 'auto',
          }}
        >
          Open ›
        </span>
      </BCard>
    </Link>
  )
}
