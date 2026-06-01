import Image from 'next/image'
import { BCap, BCard, BChip } from './b-atoms'
import BPageHeader from './b-page-header'
import NgoRegisterButton from '@/components/ngo/register-button'

// Phase 3f — Single NGO visit detail (Direction B port).
// Reuses NgoRegisterButton for the existing register / cancel flow.

type Props = {
  visit: {
    id: string
    ngoName: string
    location: string
    description: string
    photos: string[]
    visitDate: Date
    capacity: number | null
  }
  isRegistered: boolean
  isPast: boolean
  isFull: boolean
  spotsLeft: number | null
  goingCount: number
  whatsappLink: { link: string; label: string } | null
}

export default function BNgoDetail({
  visit,
  isRegistered,
  isPast,
  isFull,
  spotsLeft,
  goingCount,
  whatsappLink,
}: Props) {
  const breadcrumb = [
    { label: 'DISCOVER', href: '/user/discover' },
    { label: 'NGO VISITS', href: '/user/ngo-visits' },
    { label: visit.ngoName.slice(0, 30).toUpperCase() },
  ]
  const dateLong = visit.visitDate.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
  const timeLong = visit.visitDate.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
  const sub = `${dateLong} · ${timeLong} IST · ${visit.location}`
  const firstPhoto = visit.photos[0] ?? null

  return (
    <>
      <BPageHeader title={visit.ngoName} breadcrumb={breadcrumb} back="/user/ngo-visits" sub={sub} ctas={['search']} />

      {/* 2-col grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 20 }}>
        {/* LEFT */}
        <div className="flex flex-col gap-3.5">
          <BCard padding={0} style={{ overflow: 'hidden' }}>
            {firstPhoto ? (
              <div style={{ position: 'relative', height: 240, borderBottom: '1px solid var(--border)' }}>
                <Image
                  fill
                  src={firstPhoto}
                  alt={visit.ngoName}
                  sizes="600px"
                  style={{ objectFit: 'cover' }}
                  unoptimized
                />
              </div>
            ) : (
              <div
                style={{
                  background:
                    'linear-gradient(135deg, var(--accent-tint) 0%, var(--accent) 100%)',
                  height: 220,
                  borderBottom: '1px solid var(--border)',
                  display: 'grid',
                  placeItems: 'center',
                }}
              >
                <span
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: 76,
                    fontWeight: 500,
                    color: '#fff',
                    opacity: 0.9,
                  }}
                >
                  {visit.ngoName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div style={{ padding: '18px 24px' }}>
              <BCap>About {visit.ngoName}</BCap>
              <p
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 15.5,
                  color: 'var(--text)',
                  marginTop: 10,
                  lineHeight: 1.7,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {visit.description}
              </p>
            </div>
          </BCard>

          {visit.photos.length > 1 && (
            <div className="grid grid-cols-3 gap-2">
              {visit.photos.slice(1, 4).map((photo, i) => (
                <div
                  key={i}
                  style={{
                    position: 'relative',
                    aspectRatio: '1 / 1',
                    borderRadius: 12,
                    overflow: 'hidden',
                    border: '1px solid var(--border)',
                  }}
                >
                  <Image
                    fill
                    src={photo}
                    alt={`${visit.ngoName} photo ${i + 2}`}
                    sizes="200px"
                    style={{ objectFit: 'cover' }}
                    unoptimized
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* RIGHT */}
        <div className="flex flex-col gap-3.5">
          {isPast ? (
            <BCard>
              <BCap>Ended</BCap>
              <p
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontStyle: 'italic',
                  fontSize: 13.5,
                  color: 'var(--text-muted)',
                  marginTop: 10,
                  lineHeight: 1.6,
                }}
              >
                This visit has already happened.
              </p>
            </BCard>
          ) : (
            <BCard>
              <BCap>
                {isRegistered ? "You're going" : isFull ? 'All spots filled' : 'Sign up'}
              </BCap>
              <div
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 18,
                  fontWeight: 500,
                  marginTop: 10,
                  color: 'var(--text)',
                }}
              >
                {visit.capacity
                  ? `${goingCount} of ${visit.capacity} going so far.`
                  : `${goingCount} going so far.`}
              </div>
              {!isFull && visit.capacity && spotsLeft !== null && (
                <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>
                  {spotsLeft} {spotsLeft === 1 ? 'spot' : 'spots'} left
                </div>
              )}
              <div style={{ marginTop: 14 }}>
                {isRegistered ? (
                  whatsappLink?.link ? (
                    <>
                      <a
                        href={whatsappLink.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          width: '100%',
                          padding: '12px 16px',
                          borderRadius: 999,
                          background: '#25D366',
                          color: '#fff',
                          fontFamily: 'var(--font-heading)',
                          fontWeight: 500,
                          fontSize: 13,
                        }}
                      >
                        Join the WhatsApp group ›
                      </a>
                      <p
                        style={{
                          fontFamily: 'var(--font-serif)',
                          fontStyle: 'italic',
                          fontSize: 12,
                          color: 'var(--text-muted)',
                          marginTop: 10,
                          lineHeight: 1.55,
                        }}
                      >
                        We&rsquo;ll send reminders before the visit. See you there.
                      </p>
                    </>
                  ) : (
                    <p
                      style={{
                        fontFamily: 'var(--font-serif)',
                        fontStyle: 'italic',
                        fontSize: 13,
                        color: 'var(--text-muted)',
                        lineHeight: 1.55,
                      }}
                    >
                      We&rsquo;ll email you reminders before the visit. See you there.
                    </p>
                  )
                ) : isFull ? (
                  <p
                    style={{
                      fontFamily: 'var(--font-serif)',
                      fontStyle: 'italic',
                      fontSize: 13,
                      color: 'var(--text-muted)',
                      lineHeight: 1.55,
                    }}
                  >
                    All spots are filled for this visit. Check back next time.
                  </p>
                ) : (
                  <NgoRegisterButton ngoVisitId={visit.id} />
                )}
              </div>
              <p
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10,
                  color: 'var(--text-faint)',
                  marginTop: 10,
                  textAlign: 'center',
                  letterSpacing: '0.06em',
                }}
              >
                FREE · TRAVEL ON YOUR OWN · WE SHARE THE PIN 1 DAY BEFORE
              </p>
            </BCard>
          )}

          <BCard accent="var(--accent)" padding={14}>
            <BCap style={{ color: 'var(--accent-deep)' }}>How to be there well</BCap>
            <ul
              style={{
                marginTop: 10,
                paddingLeft: 18,
                display: 'flex',
                flexDirection: 'column',
                gap: 6,
                fontFamily: 'var(--font-serif)',
                fontSize: 13.5,
                color: 'var(--text-muted)',
                lineHeight: 1.55,
              }}
            >
              <li>Phones in your bag. No photos of the people we&rsquo;re visiting.</li>
              <li>Bring a book you&rsquo;ve actually read if you&rsquo;re bringing one.</li>
              <li>Leave when you said you would. Don&rsquo;t linger.</li>
              <li>If you feel uncomfortable at any point — including arriving — step out, no questions asked.</li>
            </ul>
          </BCard>

          {!isPast && (
            <BCard padding={14} style={{ background: 'var(--primary-tint)' }}>
              <BChip kind="primary">REMINDER</BChip>
              <p
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontStyle: 'italic',
                  fontSize: 13,
                  color: 'var(--text)',
                  marginTop: 8,
                  lineHeight: 1.55,
                }}
              >
                If you can&rsquo;t make it, tell us 24 h before so we can free
                your spot for someone else.
              </p>
            </BCard>
          )}
        </div>
      </div>
    </>
  )
}
