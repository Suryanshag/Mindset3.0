import Link from 'next/link'
import { BCap, BCard, BChip } from './b-atoms'
import BPageHeader from './b-page-header'
import SessionJoinCta from '@/app/(dashboard)/user/sessions/[id]/session-join-cta'
import SessionUserNotes from '@/app/(dashboard)/user/sessions/[id]/session-user-notes'
import CancelSessionButton from '@/app/(dashboard)/user/sessions/[id]/cancel-button'

// Phase 3b — Single-session detail (Direction B port).
// Server-renderable wrapper: it receives already-shaped data + the
// existing client child components (SessionJoinCta, SessionUserNotes,
// CancelSessionButton) so functionality is preserved 1:1, only the
// chrome and layout change. The "right column" of the design lives in
// a 2-col grid; the user's autosave notes + doctor's notes live on the
// left.

type Status = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'

type Props = {
  session: {
    id: string
    date: Date
    status: Status
    meetLink: string | null
    doctorId: string
    notes: string | null
    userNotes: string | null
    doctor: {
      photo: string | null
      designation: string
      user: { name: string }
    }
  }
  /** 1-indexed position in the user's session history. */
  ordinal: number
  prevSessionId: string | null
  nextSessionId: string | null
  /** Assignments created within 48h of this session — only relevant for
   *  past sessions, but we accept the prop regardless and skip rendering
   *  if empty. */
  relatedAssignments: { id: string; title: string; status: string }[]
}

const SESSION_DURATION_MIN = 50

export default function BSessionDetail({
  session,
  ordinal,
  prevSessionId,
  nextSessionId,
  relatedAssignments,
}: Props) {
  const now = new Date()
  const isPast = session.status === 'COMPLETED' || session.status === 'NO_SHOW' || session.date < now
  const isUpcoming =
    session.date > now && (session.status === 'PENDING' || session.status === 'CONFIRMED')
  const isCancelled = session.status === 'CANCELLED'
  const hoursUntil = (session.date.getTime() - now.getTime()) / (1000 * 60 * 60)
  const canCancel = isUpcoming && hoursUntil > 24

  const dateLabel = session.date.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
  const timeLabel = session.date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
  const subLabel = `Session ${ordinal} · ${dateLabel} · ${timeLabel} IST · with ${session.doctor.user.name}`

  const titleCopy = isCancelled ? `Session ${ordinal} — cancelled` : `Session ${ordinal}`
  const breadcrumb = [
    { label: 'SESSIONS', href: '/user/sessions' },
    { label: String(ordinal).padStart(2, '0') },
  ]

  const statusChipKind: 'primary' | 'neutral' | 'accent' =
    session.status === 'COMPLETED' ? 'primary' :
    session.status === 'CONFIRMED' ? 'primary' :
    session.status === 'CANCELLED' || session.status === 'NO_SHOW' ? 'neutral' :
    'accent'
  const statusChipLabel =
    session.status === 'COMPLETED' ? `COMPLETED · ${SESSION_DURATION_MIN} MIN` :
    session.status === 'CONFIRMED' ? 'CONFIRMED' :
    session.status === 'CANCELLED' ? 'CANCELLED' :
    session.status === 'NO_SHOW' ? 'NO-SHOW' :
    'PENDING'

  return (
    <>
      <BPageHeader
        title={titleCopy}
        breadcrumb={breadcrumb}
        back="/user/sessions"
        sub={subLabel}
        ctas={['search']}
      />

      {/* Status row */}
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <BChip kind={statusChipKind}>{statusChipLabel}</BChip>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--text-faint)',
          }}
        >
          RECORDED · NO · YOUR CHOICE
        </span>
        <div style={{ flex: 1 }} />
        {prevSessionId ? (
          <Link
            href={`/user/sessions/${prevSessionId}`}
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 12,
              padding: '7px 12px',
              borderRadius: 999,
              background: 'transparent',
              color: 'var(--text-muted)',
              border: '1px solid var(--border)',
            }}
          >
            ‹ previous
          </Link>
        ) : (
          <span
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 12,
              padding: '7px 12px',
              color: 'var(--text-faint)',
            }}
          >
            ‹ previous
          </span>
        )}
        {nextSessionId ? (
          <Link
            href={`/user/sessions/${nextSessionId}`}
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 12,
              padding: '7px 12px',
              borderRadius: 999,
              background: 'transparent',
              color: 'var(--text-muted)',
              border: '1px solid var(--border)',
            }}
          >
            next ›
          </Link>
        ) : (
          <span
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 12,
              padding: '7px 12px',
              color: 'var(--text-faint)',
            }}
          >
            next ›
          </span>
        )}
      </div>

      {/* 2-col grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 20 }}>
        {/* LEFT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          {/* Doctor's note — only if completed and present */}
          {session.status === 'COMPLETED' && session.notes && (
            <BCard>
              <BCap>{session.doctor.user.name.split(' ').slice(-1)[0]}&rsquo;s note to you</BCap>
              <div
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontSize: 15.5,
                  color: 'var(--text)',
                  marginTop: 12,
                  lineHeight: 1.7,
                  whiteSpace: 'pre-wrap',
                }}
              >
                {session.notes}
              </div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginTop: 18,
                }}
              >
                <span style={{ fontSize: 12.5, color: 'var(--text-muted)' }}>
                  posted {session.date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                </span>
              </div>
            </BCard>
          )}

          {/* User's own notes — autosaves on blur, kept as the existing
              client component so behaviour is unchanged. */}
          <BCard>
            <BCap>What you wrote {isPast ? 'going in' : 'about this session'}</BCap>
            <div style={{ marginTop: 10 }}>
              <SessionUserNotes
                sessionId={session.id}
                initialValue={session.userNotes ?? ''}
              />
            </div>
          </BCard>

          {/* Join CTA — drives off the existing window-state helper. */}
          {!isPast && !isCancelled && (
            <SessionJoinCta
              startsAt={session.date}
              durationMin={SESSION_DURATION_MIN}
              status={session.status}
              meetLink={session.meetLink}
              doctorId={session.doctorId}
              doctorName={session.doctor.user.name}
            />
          )}
        </div>

        {/* RIGHT */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Doctor card — minimal, links to book follow-up */}
          <BCard padding={16}>
            <BCap>Your therapist</BCap>
            <div
              style={{
                display: 'flex',
                gap: 12,
                alignItems: 'center',
                marginTop: 12,
              }}
            >
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
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: 15,
                    fontWeight: 500,
                    color: 'var(--text)',
                  }}
                >
                  {session.doctor.user.name}
                </div>
                <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {session.doctor.designation}
                </div>
              </div>
            </div>
            <Link
              href={`/user/sessions/book?doctorId=${session.doctorId}`}
              style={{
                display: 'block',
                marginTop: 12,
                textAlign: 'center',
                fontFamily: 'var(--font-heading)',
                fontSize: 13,
                padding: '9px 16px',
                borderRadius: 999,
                background: 'var(--primary)',
                color: '#fff',
                fontWeight: 500,
              }}
            >
              Book follow-up
            </Link>
            {isUpcoming && canCancel && (
              <div style={{ marginTop: 10 }}>
                <CancelSessionButton sessionId={session.id} />
              </div>
            )}
            {isUpcoming && !canCancel && (
              <p
                style={{
                  fontSize: 11.5,
                  color: 'var(--text-muted)',
                  textAlign: 'center',
                  marginTop: 10,
                }}
              >
                Can&rsquo;t cancel within 24 hours of start time.
              </p>
            )}
            {isCancelled && (
              <Link
                href={`/user/sessions/book?doctorId=${session.doctorId}`}
                style={{
                  display: 'block',
                  marginTop: 10,
                  textAlign: 'center',
                  fontFamily: 'var(--font-heading)',
                  fontSize: 12.5,
                  padding: '8px 14px',
                  borderRadius: 999,
                  background: 'transparent',
                  color: 'var(--primary)',
                  border: '1px solid var(--border)',
                }}
              >
                Book again
              </Link>
            )}
          </BCard>

          {/* Assignments from / around this session */}
          {relatedAssignments.length > 0 && (
            <BCard padding={16} accent="var(--accent)">
              <BCap style={{ color: 'var(--accent-deep)' }}>
                Assigned this session
              </BCap>
              <div style={{ marginTop: 10, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {relatedAssignments.map((a) => (
                  <Link
                    key={a.id}
                    href={`/user/practice/assignments/${a.id}`}
                    style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}
                  >
                    <BChip kind="journal">{a.status.toLowerCase()}</BChip>
                    <div style={{ flex: 1, fontSize: 13.5, color: 'var(--text)' }}>
                      {a.title}
                    </div>
                    <span
                      style={{
                        fontFamily: 'var(--font-heading)',
                        fontSize: 12,
                        color: 'var(--primary)',
                      }}
                    >
                      Open ›
                    </span>
                  </Link>
                ))}
              </div>
            </BCard>
          )}
        </div>
      </div>
    </>
  )
}
