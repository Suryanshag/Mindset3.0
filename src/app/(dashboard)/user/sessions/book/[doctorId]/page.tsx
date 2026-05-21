import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Card, Avatar, Blob } from '@/components/mobile/ui'
import {
  IconArrowLeft,
  IconArrowRight,
  IconHeart,
} from '@/components/mobile/icons'

// Phase 3 — Therapist detail page (mobile-first).
// Renders a rich hero + bio + qualifications + "Book a session" CTA
// that navigates to the existing /user/sessions/book?doctorId=… flow
// (the Razorpay-integrated booking page, untouched this phase).
//
// Desktop renders the same content; the existing booking page already
// surfaces doctor info during the slot picker, so this detail page
// is primarily a mobile affordance. No SlotPicker inline (per kickoff
// decision — payment logic preserved).

export default async function TherapistDetailPage({
  params,
}: {
  params: Promise<{ doctorId: string }>
}) {
  const { doctorId } = await params
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const doctor = await prisma.doctor.findUnique({
    where: { id: doctorId, isActive: true },
    select: {
      id: true,
      photo: true,
      designation: true,
      type: true,
      specialization: true,
      qualification: true,
      experience: true,
      bio: true,
      sessionPrice: true,
      user: { select: { name: true } },
    },
  })
  if (!doctor) notFound()

  const price = Math.round(Number(doctor.sessionPrice))
  const typeLabel = doctor.type === 'COUNSELOR' ? 'Counsellor' : 'Psychologist'
  const heroTint =
    doctor.type === 'PSYCHOLOGIST' ? 'var(--primary-tint)' : 'var(--accent-tint)'
  const heroAccent =
    doctor.type === 'PSYCHOLOGIST' ? 'var(--primary)' : 'var(--accent)'

  return (
    <div data-mobile-fullbleed data-no-mobile-header>
      <div
        className="screen-scroll"
        style={{
          background: 'var(--bg-app)',
          minHeight: '100%',
          overflowY: 'auto',
          paddingBottom: 130,
        }}
      >
        {/* Hero — tinted background, back button + heart, large avatar */}
        <div
          style={{
            background: heroTint,
            padding: '14px 20px 28px',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
          <Blob
            fill="rgba(255,255,255,0.4)"
            style={{
              position: 'absolute',
              right: -30,
              top: -30,
              width: 160,
              height: 160,
            }}
          />
          <header
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              position: 'relative',
            }}
          >
            <Link
              href="/user/sessions?tab=find"
              aria-label="Back to therapists"
              style={{
                width: 40,
                height: 40,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.7)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <IconArrowLeft size={18} sw={1.8} />
            </Link>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              {/* Heart is decorative — favourite-therapist isn't backed
                  by a schema field yet. Phase 4 candidate. */}
              <button
                type="button"
                aria-label="Favourite (coming soon)"
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.7)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <IconHeart size={18} sw={1.8} />
              </button>
            </div>
          </header>
          <div
            style={{
              display: 'flex',
              gap: 16,
              marginTop: 18,
              alignItems: 'center',
              position: 'relative',
            }}
          >
            <Avatar
              name={doctor.user.name}
              size={84}
              color={heroAccent}
              ring="rgba(255,255,255,0.55)"
              src={doctor.photo ?? undefined}
            />
            <div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: 700,
                  letterSpacing: '0.14em',
                  textTransform: 'uppercase',
                  color: heroAccent,
                }}
              >
                {typeLabel}
              </div>
              <div
                className="ms-display"
                style={{
                  fontSize: 26,
                  color: 'var(--text)',
                  marginTop: 2,
                }}
              >
                {doctor.user.name}
              </div>
              <div
                style={{
                  fontSize: 13,
                  color: 'var(--text)',
                  opacity: 0.7,
                  marginTop: 2,
                }}
              >
                {doctor.specialization}
              </div>
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: 20 }}>
          {/* Stats — only real fields rendered. The design had a
              "Sessions: 420+" and "Rating: 4.9 ★" stat tiles; we don't
              have those aggregates yet, so they're omitted. */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: 10,
              marginBottom: 18,
            }}
          >
            <Stat label="Experience" value={`${doctor.experience} yrs`} />
            <Stat label="Session" value={`₹${price}`} />
          </div>

          <div
            className="ms-display"
            style={{
              fontSize: 20,
              color: 'var(--text)',
              marginBottom: 8,
            }}
          >
            About
          </div>
          <p
            style={{
              fontSize: 14,
              lineHeight: 1.55,
              color: 'var(--text)',
              marginBottom: 0,
            }}
          >
            {doctor.bio}
          </p>

          {doctor.qualification && (
            <>
              <div
                className="ms-display"
                style={{
                  fontSize: 20,
                  color: 'var(--text)',
                  marginTop: 24,
                  marginBottom: 8,
                }}
              >
                Qualifications
              </div>
              <Card padding={14}>
                <p
                  style={{
                    fontSize: 13,
                    lineHeight: 1.55,
                    color: 'var(--text-muted)',
                    margin: 0,
                  }}
                >
                  {doctor.qualification}
                </p>
              </Card>
            </>
          )}

          {/* Approach chips — derived from specialization. We don't have
              a structured "approaches" field (CBT / ACT / etc) on
              Doctor, so we surface specialization split as light tags.
              Deferred for richer modeling in Phase 4. */}
          {doctor.specialization && (
            <>
              <div
                className="ms-display"
                style={{
                  fontSize: 20,
                  color: 'var(--text)',
                  marginTop: 24,
                  marginBottom: 12,
                }}
              >
                Focus
              </div>
              <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                {doctor.specialization
                  .split(/[·,]/)
                  .map((s) => s.trim())
                  .filter(Boolean)
                  .map((k) => (
                    <span
                      key={k}
                      style={{
                        padding: '7px 12px',
                        borderRadius: 999,
                        background: 'var(--bg-card)',
                        fontSize: 12,
                        fontWeight: 600,
                        color: 'var(--text-muted)',
                        boxShadow: 'var(--shadow-card)',
                      }}
                    >
                      {k}
                    </span>
                  ))}
              </div>
            </>
          )}
        </div>

        {/* Sticky book bar — pill with price + Book CTA. */}
        <div
          style={{
            position: 'fixed',
            left: 16,
            right: 16,
            bottom: 90, // clearance for the BottomNav (56) + safe-area
            zIndex: 30,
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
                From
              </div>
              <div
                className="ms-display"
                style={{ fontSize: 22, color: 'var(--text)' }}
              >
                ₹{price}
                <span
                  style={{
                    fontSize: 11,
                    fontFamily: 'var(--font-body)',
                    color: 'var(--text-muted)',
                    fontWeight: 600,
                  }}
                >
                  {' '}
                  / session
                </span>
              </div>
            </div>
            <Link
              href={`/user/sessions/book?doctorId=${doctor.id}`}
              style={{
                background: 'var(--primary)',
                color: 'var(--on-dark)',
                padding: '14px 22px',
                borderRadius: 999,
                fontSize: 14,
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
              }}
            >
              Book a session <IconArrowRight size={16} sw={2} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        borderRadius: 16,
        padding: 12,
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: 'var(--text-muted)',
          letterSpacing: '0.10em',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>
      <div
        className="ms-display"
        style={{ fontSize: 20, color: 'var(--text)', marginTop: 4 }}
      >
        {value}
      </div>
    </div>
  )
}
