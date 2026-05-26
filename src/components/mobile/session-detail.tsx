// Phase 3 — Mobile session detail surface.
// Server Component wrapper that composes the existing Client Components
// (SessionJoinCta, SessionUserNotes, CancelSessionButton) inside a
// mobile-styled hero. Reuses the Phase 1 logic — Meet link state,
// autosave, cancel-after-24h — without duplicating it.
//
// Timeline-of-activity-after-this-session (design feature) is
// deferred; that aggregate would need a journal+assignment+workshop
// join keyed on session.date < event_time < next_session.date.

import Link from 'next/link'
import { Avatar, Blob } from './ui'
import { IconArrowLeft } from './icons'
import SessionJoinCta from '@/app/(dashboard)/user/sessions/[id]/session-join-cta'
import SessionUserNotes from '@/app/(dashboard)/user/sessions/[id]/session-user-notes'
import CancelSessionButton from '@/app/(dashboard)/user/sessions/[id]/cancel-button'

const SESSION_DURATION_MIN = 60

type Status = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'

type Props = {
  session: {
    id: string
    date: Date
    status: Status
    meetLink: string | null
    notes: string | null
    userNotes: string | null
    doctorId: string
    doctor: {
      photo: string | null
      designation: string
      type: 'COUNSELOR' | 'PSYCHOLOGIST'
      user: { name: string }
    }
  }
}

const STATUS_LABEL: Record<Status, string> = {
  PENDING: 'Pending',
  CONFIRMED: 'Confirmed',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
  NO_SHOW: 'Marked no-show',
}

function formatHeroDate(d: Date): string {
  return d.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
}

function formatHeroTime(d: Date): string {
  return d.toLocaleTimeString('en-IN', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export default function MobileSessionDetail({ session }: Props) {
  const now = new Date()
  const isUpcoming =
    session.date > now &&
    (session.status === 'PENDING' || session.status === 'CONFIRMED')
  const isCancelled = session.status === 'CANCELLED'
  const hoursUntil =
    (session.date.getTime() - now.getTime()) / (1000 * 60 * 60)
  const canCancel = isUpcoming && hoursUntil > 24

  const doctorName = session.doctor.user.name
  const heroTint =
    session.doctor.type === 'PSYCHOLOGIST'
      ? 'var(--primary)'
      : 'var(--accent)'

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
      {/* Hero — therapist-color background with date + name + status. */}
      <div
        style={{
          background: heroTint,
          color: 'var(--on-dark)',
          padding: '14px 20px 28px',
          borderBottomLeftRadius: 32,
          borderBottomRightRadius: 32,
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <Blob
          fill="rgba(255,248,235,0.10)"
          style={{
            position: 'absolute',
            right: -40,
            top: -50,
            width: 200,
            height: 200,
          }}
        />
        <Blob
          fill="rgba(0,0,0,0.10)"
          d="M40 12 C76 8 110 36 100 76 C92 110 40 120 14 92 C-6 70 4 18 40 12 Z"
          style={{
            position: 'absolute',
            left: -40,
            bottom: -60,
            width: 160,
            height: 160,
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
            href="/user/sessions"
            aria-label="Back to sessions"
            style={{
              width: 38,
              height: 38,
              borderRadius: '50%',
              background: 'rgba(255,248,235,0.18)',
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
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              opacity: 0.85,
            }}
          >
            {formatHeroDate(session.date)} · {formatHeroTime(session.date)}
          </span>
        </header>
        <div
          style={{
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            marginTop: 22,
          }}
        >
          <Avatar
            name={doctorName}
            size={64}
            color="var(--primary)"
            ring="rgba(255,248,235,0.35)"
            src={session.doctor.photo ?? undefined}
          />
          <div style={{ flex: 1, minWidth: 0 }}>
            <span
              style={{
                display: 'inline-flex',
                padding: '4px 10px',
                borderRadius: 999,
                background: 'rgba(255,255,255,0.20)',
                color: 'var(--on-dark)',
                fontSize: 10.5,
                fontWeight: 800,
                letterSpacing: '0.10em',
                textTransform: 'uppercase',
              }}
            >
              {STATUS_LABEL[session.status]}
            </span>
            <div
              className="ms-display"
              style={{
                fontSize: 24,
                lineHeight: 1.0,
                marginTop: 8,
                color: 'var(--on-dark)',
              }}
            >
              {doctorName}
            </div>
            <div
              style={{ fontSize: 13, opacity: 0.8, marginTop: 4 }}
            >
              {session.doctor.designation} · {SESSION_DURATION_MIN} min
            </div>
          </div>
        </div>
      </div>

      {/* Body */}
      <div style={{ padding: '24px 20px 0' }}>
        {/* Join CTA — reuses the Phase 1 Client Component which handles
            all five join-window states (cancelled, ended, too_early,
            open-no-link, open-with-link). */}
        <SessionJoinCta
          startsAt={session.date}
          durationMin={SESSION_DURATION_MIN}
          status={session.status}
          meetLink={session.meetLink}
          doctorId={session.doctorId}
          doctorName={doctorName}
        />
      </div>

      {/* User notes — autosaves on blur via the existing Client Component. */}
      <div style={{ padding: '24px 20px 0' }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.16em',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
            marginBottom: 8,
          }}
        >
          Just for you
        </div>
        <div
          className="ms-display"
          style={{
            fontSize: 20,
            color: 'var(--text)',
            marginBottom: 12,
          }}
        >
          Your notes
        </div>
        <SessionUserNotes
          sessionId={session.id}
          initialValue={session.userNotes ?? ''}
        />
      </div>

      {/* Doctor's notes — only when completed AND notes were left. */}
      {session.status === 'COMPLETED' && session.notes && (
        <div style={{ padding: '24px 20px 0' }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.16em',
              color: 'var(--text-muted)',
              textTransform: 'uppercase',
              marginBottom: 8,
            }}
          >
            From your session
          </div>
          <div
            style={{
              background: 'var(--bg-card)',
              borderRadius: 18,
              padding: 16,
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <p
              className="ms-serif"
              style={{
                fontSize: 14,
                lineHeight: 1.55,
                color: 'var(--text)',
                margin: 0,
                whiteSpace: 'pre-wrap',
              }}
            >
              {session.notes}
            </p>
          </div>
        </div>
      )}

      {/* Cancel CTA — only when > 24h before start. The 24h gate is
          enforced server-side too in cancelSession() (Sprint Refund-
          Automation refactor: it now ALLOWS within-24h cancellation
          with a 50% refund, but the UI here keeps the gate to set
          expectations at tap time. Future polish: surface the
          partial-refund message instead of hiding the button.). */}
      {isUpcoming && (
        <div style={{ padding: '32px 20px 0' }}>
          {canCancel ? (
            <CancelSessionButton sessionId={session.id} />
          ) : (
            <p
              style={{
                fontSize: 12,
                color: 'var(--text-muted)',
                textAlign: 'center',
                padding: '8px 0',
              }}
            >
              Can&apos;t cancel within 24 hours of start time.
            </p>
          )}
        </div>
      )}

      {/* Cancelled / past path — surface the Book Again CTA. */}
      {isCancelled && (
        <div style={{ padding: '24px 20px 0' }}>
          <Link
            href={`/user/sessions/book?doctorId=${session.doctorId}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              padding: 16,
              borderRadius: 999,
              background: 'var(--primary)',
              color: 'var(--on-dark)',
              fontSize: 14,
              fontWeight: 800,
              boxShadow: 'var(--shadow-pop)',
            }}
          >
            Book again
          </Link>
        </div>
      )}

      {session.status === 'COMPLETED' && !isCancelled && (
        <div style={{ padding: '24px 20px 0' }}>
          <Link
            href={`/user/sessions/book?doctorId=${session.doctorId}`}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '100%',
              padding: 16,
              borderRadius: 999,
              background: 'var(--primary)',
              color: 'var(--on-dark)',
              fontSize: 14,
              fontWeight: 800,
              boxShadow: 'var(--shadow-pop)',
            }}
          >
            Book a follow-up with {doctorName.split(' ').pop()}
          </Link>
        </div>
      )}
    </div>
  )
}
