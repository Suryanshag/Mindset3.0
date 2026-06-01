'use client'

import Link from 'next/link'
import Image from 'next/image'
import BPageHeader from './b-page-header'
import type { EngagementState } from '@/lib/queries/dashboard'
import type { SpineTherapist } from '@/lib/queries/reflection'

// Phase 2 — Today page, Direction B port.
// Single component, three sub-views switched by engagementState. All
// data passed in from the server page so this stays a pure client
// component and the queries stay where they were.
//
// "Engaged" is what most returning users see. Layout matches
// direction-b.jsx:
//   1) Greeting row (CTAs Phase 3)
//   2) Hero card: next-session block + therapist mini + week strip
//   3) "Before you see Meera" — assignments + mood quick-log (3 col)
//   4) Footer band: workshop card + reflection pointer (2 col)

type AssignmentLite = {
  id: string
  title: string
  type?: string | null
  dueDate?: Date | null
}

type WorkshopLite = {
  id: string
  title: string
  host: string
  when: string
  priceLabel: string
}

type UpcomingSession = {
  id: string
  date: Date
  meetLink: string | null
  doctor: { user: { name: string }; photo?: string | null; designation?: string }
} | null

export type BTodayProps = {
  engagementState: EngagementState
  userName: string
  upcomingSession: UpcomingSession
  todaysMood: 1 | 2 | 3 | 4 | 5 | null
  weekMoods: { date: Date; mood: 1 | 2 | 3 | 4 | 5 | null }[]
  weekEntryDateSet: Set<string>
  pendingAssignments: AssignmentLite[]
  upcomingWorkshops: WorkshopLite[]
  therapist: SpineTherapist | null
  entriesSinceLastSession: number
}

export default function BToday(props: BTodayProps) {
  if (props.engagementState === 'empty') return <BTodayEmpty {...props} />
  if (props.engagementState === 'partial') return <BTodayPartial {...props} />
  return <BTodayEngaged {...props} />
}

// ─── shared atoms ─────────────────────────────────────────────────────

function Cap({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      style={{
        fontSize: 10.5,
        letterSpacing: '0.10em',
        textTransform: 'uppercase',
        fontWeight: 500,
        color: 'var(--text-faint)',
        fontFamily: 'var(--font-heading)',
        ...style,
      }}
    >
      {children}
    </div>
  )
}

function Chip({
  children,
  bg,
  fg,
}: {
  children: React.ReactNode
  bg: string
  fg: string
}) {
  return (
    <span
      style={{
        fontFamily: 'var(--font-heading)',
        fontSize: 10,
        padding: '3px 8px',
        borderRadius: 999,
        background: bg,
        color: fg,
        letterSpacing: '0.08em',
        display: 'inline-block',
      }}
    >
      {children}
    </span>
  )
}

function GreetingRow({ userName }: { userName: string }) {
  const now = new Date()
  const hour = now.getHours()
  const dayPart = hour < 12 ? 'morning' : hour < 17 ? 'afternoon' : 'evening'
  const todayLabel = now.toLocaleDateString('en-IN', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })
  const firstName = userName.split(' ')[0] ?? userName

  return (
    <BPageHeader
      title={`Good ${dayPart}, ${firstName}.`}
      sub={`${todayLabel} · IST`}
      ctas={['search', 'write']}
    />
  )
}

// ─── ENGAGED — the primary surface ───────────────────────────────────

function BTodayEngaged(props: BTodayProps) {
  const { userName, upcomingSession, todaysMood, weekMoods, weekEntryDateSet,
          pendingAssignments, upcomingWorkshops, therapist, entriesSinceLastSession } = props

  return (
    <div className="flex flex-col gap-[18px]">
      <GreetingRow userName={userName} />
      <Hero
        upcomingSession={upcomingSession}
        therapist={therapist}
        weekMoods={weekMoods}
        weekEntryDateSet={weekEntryDateSet}
      />
      <OpenItems
        pendingAssignments={pendingAssignments}
        todaysMood={todaysMood}
      />
      <FooterBand
        workshop={upcomingWorkshops[0]}
        entriesSinceLastSession={entriesSinceLastSession}
      />
    </div>
  )
}

// ─── Hero card: next session + therapist + week strip ─────────────────

function Hero({
  upcomingSession,
  therapist,
  weekMoods,
  weekEntryDateSet,
}: {
  upcomingSession: UpcomingSession
  therapist: SpineTherapist | null
  weekMoods: BTodayProps['weekMoods']
  weekEntryDateSet: Set<string>
}) {
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        borderRadius: 16,
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-card)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '1.5fr 1fr',
        }}
      >
        <NextSessionBlock session={upcomingSession} />
        <TherapistBlock therapist={therapist} />
      </div>
      <WeekStrip weekMoods={weekMoods} weekEntryDateSet={weekEntryDateSet} upcomingSession={upcomingSession} />
    </div>
  )
}

function NextSessionBlock({ session }: { session: UpcomingSession }) {
  if (!session) {
    return (
      <div
        style={{
          padding: '26px 28px',
          borderRight: '1px solid var(--border)',
        }}
      >
        <Cap>No session booked yet</Cap>
        <p
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 22,
            fontWeight: 500,
            lineHeight: 1.2,
            marginTop: 12,
            color: 'var(--text)',
          }}
        >
          Pick up the rhythm.
        </p>
        <p
          style={{
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
            fontSize: 14.5,
            color: 'var(--text-muted)',
            marginTop: 8,
            lineHeight: 1.55,
          }}
        >
          The next thirty minutes is yours, whenever you can carve it out.
        </p>
        <Link
          href="/user/sessions/book"
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 13,
            padding: '10px 20px',
            borderRadius: 999,
            background: 'var(--primary)',
            color: '#fff',
            display: 'inline-block',
            marginTop: 16,
            fontWeight: 500,
          }}
        >
          Book your next session
        </Link>
      </div>
    )
  }

  const date = new Date(session.date)
  const now = new Date()
  const daysUntil = Math.round((date.getTime() - now.getTime()) / 86400000)
  const dayLabel = date.toLocaleDateString('en-IN', { weekday: 'short' }).toUpperCase()
  const dayNum = date.getDate().toString().padStart(2, '0')
  const monthTime = `${date.toLocaleDateString('en-IN', { month: 'short' }).toUpperCase()} · ${date.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}`
  const joinOpensTime = new Date(date.getTime() - 15 * 60 * 1000).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', hour12: true }).toLowerCase()

  const inLabel =
    daysUntil <= 0 ? 'today' :
    daysUntil === 1 ? 'tomorrow' :
    `in ${daysUntil} days`

  return (
    <div
      style={{
        padding: '26px 28px',
        borderRight: '1px solid var(--border)',
      }}
    >
      <Cap>Next session · {inLabel}</Cap>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 22, marginTop: 14 }}>
        <div
          style={{
            background: 'var(--primary)',
            color: '#fff',
            borderRadius: 14,
            padding: '14px 0',
            textAlign: 'center',
            width: 94,
            flexShrink: 0,
          }}
        >
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 11, opacity: 0.72, letterSpacing: '0.14em' }}>
            {dayLabel}
          </div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 44, lineHeight: 1, marginTop: 2, fontWeight: 500 }}>
            {dayNum}
          </div>
          <div style={{ fontFamily: 'var(--font-heading)', fontSize: 10.5, opacity: 0.72, letterSpacing: '0.08em', marginTop: 2 }}>
            {monthTime}
          </div>
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 22,
              fontWeight: 500,
              lineHeight: 1.15,
              color: 'var(--text)',
            }}
          >
            Session with {session.doctor.user.name}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              flexWrap: 'wrap',
              gap: 12,
              marginTop: 16,
            }}
          >
            <Link
              href={`/user/sessions/${session.id}`}
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 13,
                padding: '10px 20px',
                borderRadius: 999,
                background: 'var(--primary)',
                color: '#fff',
                fontWeight: 500,
              }}
            >
              View details
            </Link>
            <Link
              href="/user/sessions/book"
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 13,
                padding: '10px 18px',
                borderRadius: 999,
                background: 'transparent',
                color: 'var(--text)',
                border: '1px solid var(--border)',
              }}
            >
              Reschedule
            </Link>
            <span style={{ fontSize: 11.5, color: 'var(--text-faint)', marginLeft: 4 }}>
              {session.meetLink ? `Join opens ${joinOpensTime} IST · Google Meet` : 'Meet link arrives 24h before'}
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

function TherapistBlock({ therapist }: { therapist: SpineTherapist | null }) {
  if (!therapist) {
    return (
      <div style={{ padding: '22px 24px', background: 'var(--bg-rail)' }}>
        <Cap>Your therapist</Cap>
        <p
          style={{
            fontFamily: 'var(--font-serif)',
            fontStyle: 'italic',
            fontSize: 13.5,
            color: 'var(--text-muted)',
            marginTop: 12,
            lineHeight: 1.55,
          }}
        >
          Once you book a session, your therapist&apos;s details will live here.
        </p>
      </div>
    )
  }

  const sinceMonth = therapist.sinceDate
    ? therapist.sinceDate.toLocaleDateString('en-IN', { month: 'long' })
    : null

  return (
    <div style={{ padding: '22px 24px', background: 'var(--bg-rail)' }}>
      <Cap>Your therapist</Cap>
      <div style={{ display: 'flex', gap: 14, marginTop: 14, alignItems: 'center' }}>
        {therapist.photo ? (
          <Image
            src={therapist.photo}
            alt={therapist.name}
            width={64}
            height={64}
            className="rounded-full object-cover"
            style={{ border: '1px solid var(--border)', flexShrink: 0 }}
          />
        ) : (
          <div
            style={{
              width: 64,
              height: 64,
              borderRadius: '50%',
              background:
                'linear-gradient(160deg, var(--accent-tint), var(--accent))',
              border: '1px solid var(--border)',
              flexShrink: 0,
            }}
          />
        )}
        <div>
          <div
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 18,
              fontWeight: 500,
              color: 'var(--text)',
            }}
          >
            {therapist.name}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>
            {therapist.designation}
          </div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 1 }}>
            {therapist.sessionCount} session{therapist.sessionCount === 1 ? '' : 's'} together
            {sinceMonth ? ` · since ${sinceMonth}` : ''}
          </div>
        </div>
      </div>
    </div>
  )
}

function WeekStrip({
  weekMoods,
  weekEntryDateSet,
  upcomingSession,
}: {
  weekMoods: BTodayProps['weekMoods']
  weekEntryDateSet: Set<string>
  upcomingSession: UpcomingSession
}) {
  const todayIso = new Date().toISOString().slice(0, 10)
  const sessionIso = upcomingSession
    ? new Date(upcomingSession.date).toISOString().slice(0, 10)
    : null

  const dateRangeLabel =
    weekMoods.length > 0
      ? `${weekMoods[0].date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })} — ${weekMoods[weekMoods.length - 1].date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}`
      : ''

  return (
    <div
      style={{
        padding: '12px 28px 14px',
        borderTop: '1px solid var(--border)',
        background: 'var(--bg-card)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'baseline', justifyContent: 'space-between' }}>
        <Cap>The week between</Cap>
        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-faint)' }}>
          {dateRangeLabel.toUpperCase()} · IST
        </span>
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(7, 1fr)',
          gap: 10,
          marginTop: 8,
        }}
      >
        {weekMoods.map((m) => {
          const iso = m.date.toISOString().slice(0, 10)
          const isToday = iso === todayIso
          const isSession = iso === sessionIso
          const hasEntry = weekEntryDateSet.has(iso)
          const moodVal = m.mood ?? 0
          const barHeight = moodVal === 0 ? 8 : 14 + moodVal * 6
          const dayLetter = m.date.toLocaleDateString('en-IN', { weekday: 'narrow' })
          const dayNum = m.date.getDate().toString().padStart(2, '0')

          const barColor = isToday
            ? 'var(--accent)'
            : isSession
              ? 'var(--primary)'
              : hasEntry
                ? 'var(--primary-tint)'
                : 'var(--tan-tint)'

          const label = isToday ? 'TODAY' : isSession ? 'Session' : hasEntry ? 'Entry' : 'Quiet'

          return (
            <div
              key={iso}
              style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}
            >
              <div style={{ fontFamily: 'var(--font-mono)', fontSize: 9.5, color: 'var(--text-faint)' }}>
                {dayLetter}
                {dayNum}
              </div>
              <div style={{ width: '100%', height: 44, display: 'flex', alignItems: 'flex-end' }}>
                <div
                  style={{
                    flex: 1,
                    height: barHeight,
                    borderRadius: 4,
                    background: barColor,
                    opacity: isToday ? 1 : isSession ? 1 : 0.85,
                  }}
                />
              </div>
              <div
                style={{
                  fontSize: 10,
                  color: isToday ? 'var(--accent)' : 'var(--text-muted)',
                  fontFamily: 'var(--font-heading)',
                  fontWeight: isToday ? 600 : 400,
                }}
              >
                {label}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ─── Open items: assignments + mood card ─────────────────────────────

function OpenItems({
  pendingAssignments,
  todaysMood,
}: {
  pendingAssignments: AssignmentLite[]
  todaysMood: 1 | 2 | 3 | 4 | 5 | null
}) {
  const first = pendingAssignments[0]
  const second = pendingAssignments[1]
  const remaining = Math.max(0, pendingAssignments.length - 2)

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'baseline',
          justifyContent: 'space-between',
          marginBottom: 12,
        }}
      >
        <div
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 17,
            fontWeight: 500,
            color: 'var(--text)',
          }}
        >
          Before your next session
        </div>
        {remaining > 0 && (
          <Link
            href="/user/practice"
            style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-faint)' }}
          >
            +{remaining} more in Practice ›
          </Link>
        )}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr 1fr', gap: 12 }}>
        {first ? <AssignmentCard a={first} accent="var(--accent)" /> : <EmptyCard label="No assignments — well-paced" />}
        {second ? <AssignmentCard a={second} /> : <EmptyCard label="Nothing else open" />}
        <MoodCard todaysMood={todaysMood} />
      </div>
    </div>
  )
}

function AssignmentCard({ a, accent }: { a: AssignmentLite; accent?: string }) {
  const due = a.dueDate
    ? `DUE ${a.dueDate.toLocaleDateString('en-IN', { weekday: 'short' }).toUpperCase()}`
    : null
  const typeLabel = (a.type ?? 'CUSTOM').replace('_', ' ')

  return (
    <div
      style={{
        background: 'var(--bg-card)',
        borderRadius: 12,
        border: '1px solid var(--border)',
        borderLeft: accent ? `3px solid ${accent}` : '1px solid var(--border)',
        padding: 16,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Chip bg="var(--accent-tint)" fg="var(--accent-deep)">
          {typeLabel}
        </Chip>
        {due && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--accent)' }}>
            {due}
          </span>
        )}
      </div>
      <p
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 16,
          color: 'var(--text)',
          marginTop: 10,
          lineHeight: 1.4,
        }}
      >
        {a.title}
      </p>
      <Link
        href={`/user/practice/assignments/${a.id}`}
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 12.5,
          marginTop: 12,
          padding: '8px 14px',
          borderRadius: 999,
          background: 'var(--primary)',
          color: '#fff',
          display: 'inline-block',
        }}
      >
        Begin ›
      </Link>
    </div>
  )
}

function EmptyCard({ label }: { label: string }) {
  return (
    <div
      style={{
        background: 'transparent',
        borderRadius: 12,
        border: '1px dashed var(--border-strong)',
        padding: 16,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <p
        style={{
          fontFamily: 'var(--font-serif)',
          fontStyle: 'italic',
          fontSize: 13,
          color: 'var(--text-faint)',
          textAlign: 'center',
        }}
      >
        {label}
      </p>
    </div>
  )
}

function MoodCard({ todaysMood }: { todaysMood: 1 | 2 | 3 | 4 | 5 | null }) {
  return (
    <div
      style={{
        background: 'var(--bg-card)',
        borderRadius: 12,
        border: '1px solid var(--border)',
        padding: 16,
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
        <Cap>{todaysMood ? `Today · ${todaysMood}/5` : 'How is today sitting'}</Cap>
        {!todaysMood && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10, color: 'var(--text-faint)' }}>
            OPTIONAL
          </span>
        )}
      </div>
      <Link href="/user/reflection/today">
        <div style={{ display: 'flex', gap: 4, marginTop: 14 }}>
          {[1, 2, 3, 4, 5].map((n) => {
            const isCurrent = todaysMood === n
            return (
              <div
                key={n}
                style={{
                  flex: 1,
                  height: 26,
                  borderRadius: 4,
                  background: isCurrent ? 'var(--primary)' : 'var(--primary-tint)',
                  opacity: isCurrent ? 1 : 0.55,
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 10,
                  color: isCurrent ? '#fff' : 'var(--primary)',
                  fontWeight: 500,
                }}
              >
                {n}
              </div>
            )
          })}
        </div>
        <div style={{ fontSize: 11, color: 'var(--text-faint)', marginTop: 8 }}>
          {todaysMood ? 'Edit or note something more ›' : 'Tap a number, or write instead ›'}
        </div>
      </Link>
    </div>
  )
}

// ─── Footer band: workshop + reflection pointer ──────────────────────

function FooterBand({
  workshop,
  entriesSinceLastSession,
}: {
  workshop: WorkshopLite | undefined
  entriesSinceLastSession: number
}) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: 12 }}>
      {workshop ? (
        <Link
          href={`/user/discover/workshops/${workshop.id}`}
          style={{
            background: 'var(--bg-card)',
            borderRadius: 12,
            border: '1px solid var(--border)',
            padding: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <Chip bg="var(--tan-tint)" fg="#7A4A1F">
            WORKSHOP
          </Chip>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 16,
                fontWeight: 500,
                color: 'var(--text)',
              }}
            >
              {workshop.title}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              {workshop.when} · {workshop.host} · {workshop.priceLabel}
            </div>
          </div>
          <span style={{ fontSize: 12, color: 'var(--primary)' }}>Details ›</span>
        </Link>
      ) : (
        <Link
          href="/user/discover"
          style={{
            background: 'var(--bg-card)',
            borderRadius: 12,
            border: '1px solid var(--border)',
            padding: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <Chip bg="var(--tan-tint)" fg="#7A4A1F">
            WORKSHOPS
          </Chip>
          <div style={{ flex: 1 }}>
            <div
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 16,
                fontWeight: 500,
                color: 'var(--text)',
              }}
            >
              Browse what&apos;s coming up
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              Therapist-led, small-group, pay-what-you-can
            </div>
          </div>
          <span style={{ fontSize: 12, color: 'var(--primary)' }}>Open ›</span>
        </Link>
      )}

      <Link
        href="/user/reflection/today"
        style={{
          background: 'transparent',
          borderRadius: 12,
          border: '1px dashed var(--border-strong)',
          padding: 16,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        <div>
          <Cap>Quiet room</Cap>
          <div
            style={{
              fontFamily: 'var(--font-serif)',
              fontStyle: 'italic',
              fontSize: 14,
              color: 'var(--text-muted)',
              marginTop: 6,
              lineHeight: 1.45,
            }}
          >
            {entriesSinceLastSession === 0
              ? 'Nothing written since your last session yet.'
              : entriesSinceLastSession === 1
                ? 'One entry since you saw your therapist.'
                : `${entriesSinceLastSession} entries since you saw your therapist.`}
          </div>
        </div>
        <span style={{ fontFamily: 'var(--font-heading)', fontSize: 12.5, color: 'var(--primary)' }}>
          Open reflection ›
        </span>
      </Link>
    </div>
  )
}

// ─── EMPTY ───────────────────────────────────────────────────────────

function BTodayEmpty({ userName, upcomingWorkshops }: BTodayProps) {
  const firstName = userName.split(' ')[0] ?? userName

  return (
    <div className="flex flex-col gap-[18px]">
      <BPageHeader
        title={`Welcome, ${firstName}.`}
        sub="Let&rsquo;s begin where it feels right."
        ctas={['search']}
      />

      {/* Manifesto */}
      <div
        style={{
          background: 'var(--bg-card)',
          borderRadius: 16,
          border: '1px solid var(--border)',
          padding: '30px 32px',
          boxShadow: 'var(--shadow-card)',
        }}
      >
        <Cap>What this is</Cap>
        <p
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 24,
            lineHeight: 1.3,
            color: 'var(--text)',
            marginTop: 10,
            maxWidth: 760,
          }}
        >
          Mindset is a quiet room for the work you do{' '}
          <em style={{ fontFamily: 'var(--font-serif)', fontStyle: 'italic' }}>between</em>{' '}
          sessions — and a place to look back on it as your journey unfolds.
        </p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 18, marginTop: 22 }}>
          <Link
            href="/user/sessions/book"
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 13.5,
              padding: '12px 22px',
              borderRadius: 999,
              background: 'var(--primary)',
              color: '#fff',
              fontWeight: 500,
            }}
          >
            Find a therapist ›
          </Link>
          <span style={{ fontSize: 12, color: 'var(--text-faint)' }}>
            Verified therapists · all India
          </span>
        </div>
      </div>

      {/* First steps */}
      <div>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            justifyContent: 'space-between',
            marginBottom: 12,
          }}
        >
          <div
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 17,
              fontWeight: 500,
              color: 'var(--text)',
            }}
          >
            First steps
          </div>
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--text-faint)' }}>
            NO RUSH · ONE AT A TIME
          </span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          <FirstStep
            tag="BEGIN"
            title="Browse our therapists"
            body="Their training, how they work, who they tend to work with. Pick at your own pace."
            cta="Browse ›"
            href="/user/sessions/book"
            accent="var(--accent)"
          />
          <FirstStep
            tag="WRITE"
            title="Try a private entry"
            body="You can write a journal entry without booking anything. Nothing is shared with anyone."
            cta="Write ›"
            href="/user/reflection/today"
          />
          <FirstStep
            tag="READ"
            title="The library"
            body="Short readings curated by therapists. No paywall on the basics."
            cta="Open ›"
            href="/user/library"
          />
        </div>
      </div>

      {/* Optional workshop teaser */}
      {upcomingWorkshops[0] && (
        <Link
          href={`/user/discover/workshops/${upcomingWorkshops[0].id}`}
          style={{
            background: 'var(--bg-card)',
            borderRadius: 12,
            border: '1px solid var(--border)',
            padding: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 16,
          }}
        >
          <Chip bg="var(--tan-tint)" fg="#7A4A1F">
            WORKSHOP · OPEN TO ALL
          </Chip>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 16,
                fontWeight: 500,
                color: 'var(--text)',
              }}
            >
              {upcomingWorkshops[0].title}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
              {upcomingWorkshops[0].when} · {upcomingWorkshops[0].host}
            </div>
          </div>
          <span style={{ fontSize: 12, color: 'var(--primary)' }}>Details ›</span>
        </Link>
      )}
    </div>
  )
}

function FirstStep({
  tag,
  title,
  body,
  cta,
  href,
  accent,
}: {
  tag: string
  title: string
  body: string
  cta: string
  href: string
  accent?: string
}) {
  return (
    <Link
      href={href}
      style={{
        background: 'var(--bg-card)',
        borderRadius: 12,
        border: '1px solid var(--border)',
        borderLeft: accent ? `3px solid ${accent}` : '1px solid var(--border)',
        padding: 18,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
      }}
    >
      <Chip
        bg={accent ? 'var(--accent-tint)' : 'rgba(0,0,0,0.04)'}
        fg={accent ? 'var(--accent-deep)' : 'var(--text-muted)'}
      >
        {tag}
      </Chip>
      <div
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 18,
          fontWeight: 500,
          marginTop: 4,
          color: 'var(--text)',
        }}
      >
        {title}
      </div>
      <p
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 14,
          color: 'var(--text-muted)',
          lineHeight: 1.55,
        }}
      >
        {body}
      </p>
      <span
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 12,
          color: 'var(--primary)',
          marginTop: 4,
        }}
      >
        {cta}
      </span>
    </Link>
  )
}

// ─── PARTIAL — one session in ────────────────────────────────────────

function BTodayPartial(props: BTodayProps) {
  const { userName, therapist, todaysMood, pendingAssignments } = props
  const firstName = userName.split(' ')[0] ?? userName
  const firstAssignment = pendingAssignments[0]

  return (
    <div className="flex flex-col gap-[18px]">
      <BPageHeader
        title={`Hi, ${firstName}.`}
        sub="One session in."
        ctas={['search', 'write']}
      />

      {/* Hero — soft, since they only have 1 session */}
      <div
        style={{
          background: 'var(--bg-card)',
          borderRadius: 16,
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-card)',
          padding: '24px 28px',
          display: 'grid',
          gridTemplateColumns: '1fr 240px',
          gap: 28,
          alignItems: 'center',
        }}
      >
        <div>
          <Cap>You&apos;ve met your therapist</Cap>
          <p
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 20,
              color: 'var(--text)',
              marginTop: 10,
              lineHeight: 1.4,
              maxWidth: 540,
            }}
          >
            {therapist ? (
              <>
                You met with <b style={{ fontWeight: 500 }}>{therapist.name}</b> recently.{' '}
                <em style={{ fontStyle: 'italic' }}>
                  As you continue, this room will fill with what comes between your sessions.
                </em>
              </>
            ) : (
              <em style={{ fontStyle: 'italic' }}>
                Your first session is in. This room will fill with what comes between the next ones.
              </em>
            )}
          </p>
          <div style={{ display: 'flex', gap: 12, marginTop: 18 }}>
            <Link
              href="/user/sessions/book"
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 13,
                padding: '10px 18px',
                borderRadius: 999,
                background: 'var(--primary)',
                color: '#fff',
              }}
            >
              Book your next session
            </Link>
            <Link
              href="/user/sessions"
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 13,
                padding: '10px 16px',
                borderRadius: 999,
                background: 'transparent',
                color: 'var(--text)',
                border: '1px solid var(--border)',
              }}
            >
              Open last session
            </Link>
          </div>
        </div>
        {therapist && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10 }}>
            {therapist.photo ? (
              <Image
                src={therapist.photo}
                alt={therapist.name}
                width={86}
                height={86}
                className="rounded-full object-cover"
                style={{ border: '1px solid var(--border)' }}
              />
            ) : (
              <div
                style={{
                  width: 86,
                  height: 86,
                  borderRadius: '50%',
                  background:
                    'linear-gradient(160deg, var(--accent-tint), var(--accent))',
                  border: '1px solid var(--border)',
                }}
              />
            )}
            <div
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 14,
                fontWeight: 500,
                color: 'var(--text)',
              }}
            >
              {therapist.name}
            </div>
            <div style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>
              {therapist.designation}
            </div>
          </div>
        )}
      </div>

      {/* Next steps row */}
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
          Take your next step
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
          {firstAssignment ? (
            <AssignmentCard a={firstAssignment} accent="var(--accent)" />
          ) : (
            <FirstStep
              tag="WRITE"
              title="A short page"
              body="Try a single page on what you came in carrying."
              cta="Begin ›"
              href="/user/reflection/today"
              accent="var(--accent)"
            />
          )}
          <FirstStep
            tag="SUGGESTED"
            title="Book your second session"
            body="Most people book the second within ten days."
            cta="Book ›"
            href="/user/sessions/book"
          />
          <FirstStep
            tag="EXPLORE"
            title="Browse the library"
            body="Short readings curated by our therapists. No paywall on the basics."
            cta="Open library ›"
            href="/user/library"
          />
        </div>
      </div>

      {/* Mood */}
      <MoodCard todaysMood={todaysMood} />
    </div>
  )
}
