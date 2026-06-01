import Image from 'next/image'
import { BCap, BCard, BChip } from './b-atoms'
import BPageHeader from './b-page-header'
import WorkshopRegisterButton from '@/app/(dashboard)/user/discover/workshops/[id]/register-button'
import type { WorkshopWindowState } from '@/lib/workshop-window'

// Phase 3f — Single workshop detail (Direction B port).
// Reuses the existing WorkshopRegisterButton client component for the
// registration / Razorpay flow, so payments behave exactly like before.

type Workshop = {
  id: string
  title: string
  subtitle: string | null
  description: string | null
  coverImageUrl: string | null
  instructorName: string | null
  presenterName: string | null
  startsAt: Date
  durationMin: number
  priceCents: number
  capacity: number | null
  registrationsCount: number
  meetLink: string | null
  whatsappGroupUrl: string | null
  cancelledAt: Date | null
}

type Props = {
  workshop: Workshop
  isRegistered: boolean
  isPast: boolean
  isFull: boolean
  isFree: boolean
  joinWindowState: WorkshopWindowState
  joinable: boolean
}

export default function BWorkshopDetail({
  workshop,
  isRegistered,
  isPast,
  isFull,
  isFree,
  joinWindowState,
  joinable,
}: Props) {
  const dayLetter = workshop.startsAt
    .toLocaleDateString('en-IN', { weekday: 'short' })
    .toUpperCase()
  const dayNum = workshop.startsAt.getDate().toString().padStart(2, '0')
  const monthAbbr = workshop.startsAt
    .toLocaleDateString('en-IN', { month: 'short' })
    .toUpperCase()
  const timeRange = `${workshop.startsAt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })} — ${new Date(workshop.startsAt.getTime() + workshop.durationMin * 60000).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}`
  const presenter = workshop.presenterName ?? workshop.instructorName ?? null
  const priceLabel = isFree ? 'FREE' : `₹${(workshop.priceCents / 100).toLocaleString('en-IN')}`

  const sub = `Workshop · ${workshop.startsAt.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })} · ${timeRange} IST${presenter ? ` · with ${presenter}` : ''}`
  const breadcrumbTitle = workshop.title.slice(0, 40).toUpperCase()
  const breadcrumb = [
    { label: 'DISCOVER', href: '/user/discover' },
    { label: 'WORKSHOPS', href: '/user/workshops' },
    { label: breadcrumbTitle },
  ]

  return (
    <>
      <BPageHeader title={workshop.title} breadcrumb={breadcrumb} back="/user/workshops" sub={sub} ctas={['search']} />

      {/* Status chips */}
      <div className="flex gap-2 items-center">
        {isRegistered ? (
          <BChip kind="workshop">REGISTERED</BChip>
        ) : isPast ? (
          <BChip kind="neutral">ENDED</BChip>
        ) : isFull ? (
          <BChip kind="neutral">FULL</BChip>
        ) : (
          <BChip kind="workshop">OPEN · {priceLabel}</BChip>
        )}
        <BChip kind="primary">
          {workshop.durationMin} MIN · LIVE
          {workshop.capacity ? ` · ${workshop.registrationsCount} / ${workshop.capacity}` : ''}
        </BChip>
        {!isFree && (
          <span
            style={{
              fontFamily: 'var(--font-mono)',
              fontSize: 11,
              color: 'var(--text-faint)',
              alignSelf: 'center',
              marginLeft: 6,
            }}
          >
            {isFree ? 'PAY WHAT YOU CAN' : 'ONE-TIME · REFUNDABLE 48 H BEFORE'}
          </span>
        )}
      </div>

      {/* 2-col grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 20 }}>
        {/* LEFT — description */}
        <BCard padding={0} style={{ overflow: 'hidden' }}>
          {workshop.coverImageUrl ? (
            <div
              style={{
                position: 'relative',
                background: 'var(--bg-paper)',
                height: 260,
                borderBottom: '1px solid var(--border)',
              }}
            >
              <Image
                fill
                src={workshop.coverImageUrl}
                alt={workshop.title}
                sizes="600px"
                style={{ objectFit: 'contain' }}
                unoptimized
              />
            </div>
          ) : (
            <div
              style={{
                background: 'var(--bg-paper)',
                height: 200,
                borderBottom: '1px solid var(--border)',
                display: 'grid',
                placeItems: 'center',
                fontFamily: 'var(--font-mono)',
                fontSize: 11,
                color: 'var(--text-faint)',
              }}
            >
              [ WORKSHOP COVER ]
            </div>
          )}
          <div style={{ padding: '20px 28px' }}>
            {workshop.subtitle && (
              <p
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontStyle: 'italic',
                  fontSize: 16,
                  color: 'var(--text-muted)',
                  lineHeight: 1.6,
                  marginBottom: 16,
                }}
              >
                {workshop.subtitle}
              </p>
            )}
            <BCap>What this is</BCap>
            {workshop.description ? (
              <div
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 15.5,
                  color: 'var(--text)',
                  marginTop: 12,
                  lineHeight: 1.7,
                }}
                className="[&_p]:mb-3 [&_p:last-child]:mb-0"
                dangerouslySetInnerHTML={{ __html: workshop.description }}
              />
            ) : (
              <p
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 14,
                  color: 'var(--text-muted)',
                  marginTop: 12,
                }}
              >
                Description coming soon.
              </p>
            )}
          </div>
        </BCard>

        {/* RIGHT — registration + facilitator */}
        <div className="flex flex-col gap-3.5">
          <BCard>
            <BCap>
              {isRegistered ? 'You&rsquo;re registered' : isPast ? 'This workshop has ended' : 'Join this workshop'}
            </BCap>
            <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginTop: 12 }}>
              <div
                style={{
                  background: 'var(--tan-tint)',
                  color: '#7A4A1F',
                  borderRadius: 10,
                  padding: '10px 0',
                  width: 78,
                  textAlign: 'center',
                }}
              >
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: 10.5, opacity: 0.7 }}>{dayLetter}</div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: 28, lineHeight: 1, marginTop: 1, fontWeight: 500 }}>{dayNum}</div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: 10.5, opacity: 0.7, marginTop: 1 }}>{monthAbbr}</div>
              </div>
              <div>
                <div style={{ fontFamily: 'var(--font-heading)', fontSize: 17, fontWeight: 500 }}>
                  {timeRange}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                  IST · Google Meet
                </div>
                {isRegistered && !isFree && (
                  <div style={{ fontSize: 12, color: 'var(--primary)', marginTop: 2 }}>
                    You paid {priceLabel}
                  </div>
                )}
              </div>
            </div>

            {/* Meeting link surface — only registered, not cancelled */}
            {isRegistered && !workshop.cancelledAt && joinWindowState !== 'ended' && (
              <div style={{ marginTop: 14 }}>
                {joinable && workshop.meetLink ? (
                  <a
                    href={workshop.meetLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-block',
                      fontFamily: 'var(--font-heading)',
                      fontSize: 13,
                      padding: '10px 18px',
                      borderRadius: 999,
                      background: 'var(--primary)',
                      color: '#fff',
                      fontWeight: 500,
                    }}
                  >
                    Join workshop ›
                  </a>
                ) : joinable && !workshop.meetLink ? (
                  <p style={{ fontSize: 13, color: '#9A3412' }}>
                    Meeting link not yet provided. Contact{' '}
                    <a href="mailto:mindset.org.connect@gmail.com" style={{ textDecoration: 'underline' }}>
                      mindset.org.connect@gmail.com
                    </a>{' '}
                    if the workshop starts soon.
                  </p>
                ) : (
                  <p
                    style={{
                      fontFamily: 'var(--font-mono)',
                      fontSize: 10.5,
                      color: 'var(--text-faint)',
                    }}
                  >
                    JOIN LINK ARRIVES 15 MIN BEFORE START
                  </p>
                )}
              </div>
            )}

            <div style={{ marginTop: 14 }}>
              <WorkshopRegisterButton
                workshopId={workshop.id}
                workshopTitle={workshop.title}
                isPast={isPast}
                isFull={isFull && !isRegistered}
                isFree={isFree}
                isRegistered={isRegistered}
                whatsappUrl={workshop.whatsappGroupUrl}
              />
            </div>

            {workshop.capacity && !isPast && (
              <p
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  color: 'var(--text-faint)',
                  marginTop: 8,
                  letterSpacing: '0.06em',
                }}
              >
                {workshop.registrationsCount} / {workshop.capacity} SEATS FILLED
              </p>
            )}
          </BCard>

          {presenter && (
            <BCard>
              <BCap>Facilitator</BCap>
              <div style={{ display: 'flex', gap: 14, alignItems: 'center', marginTop: 12 }}>
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    background:
                      'linear-gradient(160deg, var(--accent-tint), var(--accent))',
                    border: '1px solid var(--border)',
                    flexShrink: 0,
                  }}
                />
                <div>
                  <div
                    style={{
                      fontFamily: 'var(--font-heading)',
                      fontSize: 15,
                      fontWeight: 500,
                      color: 'var(--text)',
                    }}
                  >
                    {presenter}
                  </div>
                </div>
              </div>
            </BCard>
          )}
        </div>
      </div>
    </>
  )
}
