'use client'

// Phase 2 mobile home — ports app/home.jsx (413 LOC). Three engagement-
// aware states: HomeEmpty / HomePartial / HomeEngaged. The parent
// <MobileHome> dispatches based on the server-computed engagementState.
//
// All sub-components live in this file to minimize file churn for a
// design that's reviewed as one cohesive surface. Shared sub-components
// (MoodHero, NextSessionCard, MoodWeek, ReflectionOfDay, WorkshopTeaser)
// are reused across Partial + Engaged.

import { useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { Card, SectionHead, MoodFace, MOOD_INFO, Blob, Avatar } from './ui'
import {
  IconArrowRight,
  IconBook,
  IconCalendar,
  IconChevR,
  IconHeart,
  IconLeaf,
  IconPen,
  IconVideo,
  IconWind,
} from './icons'
import MobileHeader from './header'
import MoodSheet from './mood-sheet'
import { getDailyQuote } from '@/lib/daily-quote'

// Shape from getUpcomingSession() in src/lib/queries/dashboard.ts.
// Inlined so this client component doesn't import the Prisma type and
// stays buildable when the server passes serializable data.
type UpcomingSession = {
  id: string
  doctorName: string
  doctorSpecialty?: string | null
  date: string  // ISO from server
} | null

type PendingAssignment = {
  id: string
  title: string
  type?: string
  dueDate?: Date | string | null
  doctor: { user: { name: string } }
}

type WeekMood = { date: Date | string; mood: 1 | 2 | 3 | 4 | 5 | null }

// Phase 3 — Recent SessionFollowup rows. Used by HomeEngaged's
// "Your last 3 sessions" panel. mood + note are the user's reflection
// captured by the post-session interstitial.
type RecentFollowup = {
  sessionId: string
  doctorName: string
  doctorPhoto: string | null
  sessionDate: string
  postMood: 1 | 2 | 3 | 4 | 5 | null
  homeworkNote: string | null
}

type EngagementState = 'empty' | 'partial' | 'engaged'

// Upcoming workshop shaped for the home teaser. Computed server-side so the
// client component stays serializable (no Date objects).
export type WorkshopTeaserItem = {
  id: string
  title: string
  host: string
  when: string
  coverImageUrl: string | null
  priceLabel: string
}

export type MobileHomeProps = {
  engagementState: EngagementState
  name: string
  unreadCount: number
  todaysMood: 1 | 2 | 3 | 4 | 5 | null
  upcomingSession: UpcomingSession
  pendingAssignments: PendingAssignment[]
  weekMoods: WeekMood[]
  recentFollowups?: RecentFollowup[]
  workshops: WorkshopTeaserItem[]
}

// ────────────────────────────────────────────────────────────────
// Top-level dispatcher
// ────────────────────────────────────────────────────────────────
export default function MobileHome(props: MobileHomeProps) {
  const [sheetMood, setSheetMood] = useState<1 | 2 | 3 | 4 | 5 | null>(null)
  const onMoodOpen = (m?: 1 | 2 | 3 | 4 | 5) => setSheetMood(m ?? props.todaysMood ?? 3)
  const onMoodClose = () => setSheetMood(null)

  const shared = {
    name: props.name,
    unreadCount: props.unreadCount,
    todaysMood: props.todaysMood,
    onMoodOpen,
    upcomingSession: props.upcomingSession,
    weekMoods: props.weekMoods,
    workshops: props.workshops,
  }

  return (
    <div data-mobile-fullbleed data-no-mobile-header>
      {props.engagementState === 'empty' && <HomeEmpty {...shared} />}
      {props.engagementState === 'partial' && <HomePartial {...shared} />}
      {props.engagementState === 'engaged' && (
        <HomeEngaged
          {...shared}
          pendingAssignments={props.pendingAssignments}
          recentFollowups={props.recentFollowups ?? []}
        />
      )}
      <MoodSheet
        open={sheetMood !== null}
        onClose={onMoodClose}
        initialMood={sheetMood ?? undefined}
      />
    </div>
  )
}

// ────────────────────────────────────────────────────────────────
// State 1 — Empty
// ────────────────────────────────────────────────────────────────
type SharedHomeProps = {
  name: string
  unreadCount: number
  todaysMood: 1 | 2 | 3 | 4 | 5 | null
  onMoodOpen: (m?: 1 | 2 | 3 | 4 | 5) => void
  upcomingSession: UpcomingSession
  weekMoods: WeekMood[]
  workshops: WorkshopTeaserItem[]
}

function HomeEmpty({ name }: SharedHomeProps) {
  return (
    <div
      className="screen-scroll"
      style={{
        background: 'var(--bg-app)',
        minHeight: '100%',
        overflowY: 'auto',
        paddingBottom: 110,
      }}
    >
      <MobileHeader name={name} showBell={false} />

      <section style={{ padding: '12px 20px 0', animation: 'fadeUp .6s both' }}>
        <p
          className="ms-serif"
          style={{
            fontSize: 17,
            color: 'var(--text-muted)',
            lineHeight: 1.55,
            margin: 0,
          }}
        >
          Mindset is a space for the work you do between sessions — and a place
          to look back on it as your journey unfolds.
        </p>
      </section>

      <section style={{ padding: '32px 20px 0' }}>
        <div
          style={{
            fontSize: 11,
            fontWeight: 800,
            letterSpacing: '0.16em',
            color: 'var(--text-muted)',
            textTransform: 'uppercase',
          }}
        >
          First steps
        </div>
        <div style={{ display: 'grid', gap: 12, marginTop: 14 }}>
          <FirstStepCard
            accent="var(--accent)"
            primary
            href="/user/sessions/book"
            title="Find a therapist"
            sub="Browse our therapists and book your first session."
            delay={120}
          />
          <FirstStepCard
            accent="var(--primary)"
            href="/user/practice/journal/new"
            title="Write your first entry"
            sub="Journal anything you'd like to remember or work through."
            delay={220}
          />
          <FirstStepCard
            accent="var(--navy)"
            href="/user/discover/workshops"
            title="Browse workshops"
            sub="Free and paid workshops on different aspects of wellness."
            delay={320}
          />
        </div>
      </section>

      <section style={{ padding: '32px 20px 0' }}>
        <Card padding={18} bg="var(--bg-cream)" radius={22}>
          <div
            className="ms-serif"
            style={{
              fontSize: 15,
              lineHeight: 1.55,
              color: 'var(--text)',
            }}
          >
            “Small steps, kept close. There’s no rush — you’re already here.”
          </div>
        </Card>
      </section>
    </div>
  )
}

function FirstStepCard({
  accent,
  href,
  title,
  sub,
  primary,
  delay = 0,
}: {
  accent: string
  href: string
  title: string
  sub: string
  primary?: boolean
  delay?: number
}) {
  return (
    <Link
      href={href}
      style={{
        width: '100%',
        textAlign: 'left',
        background: 'var(--bg-card)',
        borderRadius: 22,
        padding: 18,
        boxShadow: 'var(--shadow-card)',
        borderLeft: `4px solid ${accent}`,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        animation: `slideIn .55s ${delay}ms both`,
      }}
    >
      <div style={{ flex: 1 }}>
        <div
          className="ms-display"
          style={{ fontSize: 20, color: 'var(--text)', lineHeight: 1.15 }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 13,
            color: 'var(--text-muted)',
            marginTop: 6,
            lineHeight: 1.45,
          }}
        >
          {sub}
        </div>
      </div>
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: primary ? accent : 'var(--bg-app)',
          color: primary ? 'var(--on-dark)' : accent,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexShrink: 0,
        }}
      >
        <IconArrowRight size={16} sw={2.4} />
      </div>
    </Link>
  )
}

// ────────────────────────────────────────────────────────────────
// State 2 — Partial
// ────────────────────────────────────────────────────────────────
function HomePartial({
  name,
  unreadCount,
  todaysMood,
  onMoodOpen,
  upcomingSession,
  weekMoods,
  workshops,
}: SharedHomeProps) {
  return (
    <div
      className="screen-scroll"
      style={{
        background: 'var(--bg-app)',
        minHeight: '100%',
        overflowY: 'auto',
        paddingBottom: 110,
      }}
    >
      <MobileHeader name={name} unreadCount={unreadCount} />

      <section style={{ padding: '16px 20px 0' }}>
        <MoodHero mood={todaysMood} onMoodOpen={onMoodOpen} />
      </section>

      <section style={{ padding: '24px 20px 0' }}>
        <SectionHead title="Take your next step" />
        <Card padding={0}>
          <NextStepLink
            icon={<IconPen size={16} />}
            label="Write a journal entry"
            href="/user/practice/journal/new"
          />
          <NextStepLink
            icon={<IconBook size={16} />}
            label="Browse the library"
            href="/user/discover"
            last
          />
        </Card>
      </section>

      <section style={{ padding: '24px 20px 0' }}>
        <SectionHead
          title="Your next session"
          action="See all"
          onAction={() => (window.location.href = '/user/sessions')}
        />
        <NextSessionCard session={upcomingSession} />
      </section>

      <section style={{ padding: '24px 20px 0' }}>
        <SectionHead title="For today" />
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 10,
          }}
        >
          <QuickTile
            icon={<IconWind size={20} />}
            label="Breathe"
            sub="3 min"
            bg="var(--soft-blue)"
            fg="var(--navy)"
            href="/user/practice/breathe"
          />
          <QuickTile
            icon={<IconPen size={20} />}
            label="Journal"
            sub="Today"
            bg="var(--accent-tint)"
            fg="var(--accent-deep)"
            href="/user/practice/journal/new"
          />
          <QuickTile
            icon={<IconHeart size={20} />}
            label="SOS"
            sub="Talk"
            bg="var(--soft-pink)"
            fg="#7A1F12"
            href="/user/sos"
          />
        </div>
      </section>

      <section style={{ padding: '24px 20px 0' }}>
        <ReflectionOfDay />
      </section>

      <section style={{ padding: '24px 20px 0' }}>
        <SectionHead
          title="Your week"
          action="See all"
          onAction={() => (window.location.href = '/user/practice')}
        />
        <Card padding={18}>
          <MoodWeek weekMoods={weekMoods} />
          <div
            className="ms-serif"
            style={{
              fontSize: 13,
              color: 'var(--text-muted)',
              marginTop: 14,
              textAlign: 'center',
            }}
          >
            Your week will fill in as you check in.
          </div>
        </Card>
      </section>

      <WorkshopTeaser workshops={workshops} />
    </div>
  )
}

function NextStepLink({
  icon,
  label,
  href,
  last,
}: {
  icon: React.ReactNode
  label: string
  href: string
  last?: boolean
}) {
  return (
    <Link
      href={href}
      style={{
        width: '100%',
        textAlign: 'left',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: '14px 16px',
        background: 'transparent',
        borderBottom: last ? 'none' : '1px solid var(--border)',
      }}
    >
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 10,
          background: 'var(--primary-tint)',
          color: 'var(--primary)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </div>
      <span
        style={{ flex: 1, fontSize: 14, fontWeight: 700, color: 'var(--text)' }}
      >
        {label}
      </span>
      <IconChevR size={16} sw={1.8} style={{ color: 'var(--text-muted)' }} />
    </Link>
  )
}

// ────────────────────────────────────────────────────────────────
// State 3 — Engaged
// ────────────────────────────────────────────────────────────────
function HomeEngaged({
  name,
  unreadCount,
  todaysMood,
  onMoodOpen,
  upcomingSession,
  weekMoods,
  workshops,
  pendingAssignments,
  recentFollowups,
}: SharedHomeProps & {
  pendingAssignments: PendingAssignment[]
  recentFollowups: RecentFollowup[]
}) {
  return (
    <div
      className="screen-scroll"
      style={{
        background: 'var(--bg-app)',
        minHeight: '100%',
        overflowY: 'auto',
        paddingBottom: 110,
      }}
    >
      <MobileHeader name={name} unreadCount={unreadCount} />

      {recentFollowups.length > 0 ? (
        <section style={{ padding: '14px 20px 0' }}>
          <SectionHead
            kicker="A look back"
            title={`Your last ${recentFollowups.length === 1 ? 'session' : `${recentFollowups.length} sessions`}`}
            action="All sessions"
            onAction={() => (window.location.href = '/user/sessions?tab=past')}
          />
          <div style={{ display: 'grid', gap: 10 }}>
            {recentFollowups.map((f) => (
              <RecentFollowupRow key={f.sessionId} f={f} />
            ))}
          </div>
        </section>
      ) : (
        <section style={{ padding: '14px 20px 0' }}>
          <Card padding={20} bg="var(--bg-cream)" radius={22}>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 11,
                fontWeight: 800,
                letterSpacing: '0.14em',
                color: 'var(--accent)',
                textTransform: 'uppercase',
              }}
            >
              <IconLeaf size={14} sw={1.8} /> A look back
            </div>
            <p
              className="ms-serif"
              style={{
                fontSize: 18,
                lineHeight: 1.55,
                color: 'var(--text)',
                marginTop: 10,
                marginBottom: 0,
              }}
            >
              You’ve been showing up for yourself — keep the small steps coming.
            </p>
          </Card>
        </section>
      )}

      <section style={{ padding: '24px 20px 0' }}>
        <SectionHead
          title="Continue between sessions"
          action="Practice"
          onAction={() => (window.location.href = '/user/practice')}
        />
        <Card padding={0}>
          {pendingAssignments.length === 0 ? (
            <div
              style={{
                padding: 16,
                fontSize: 13,
                color: 'var(--text-muted)',
                textAlign: 'center',
              }}
            >
              All caught up. Your next assignment will appear here.
            </div>
          ) : (
            pendingAssignments.slice(0, 3).map((a, i, arr) => (
              <ContinueRow
                key={a.id}
                title={a.title}
                meta={
                  a.dueDate
                    ? `Due ${format(new Date(a.dueDate), 'EEE')} · From ${a.doctor.user.name}`
                    : `From ${a.doctor.user.name}`
                }
                href={`/user/practice/assignments/${a.id}`}
                last={i === arr.length - 1}
              />
            ))
          )}
        </Card>
      </section>

      <section style={{ padding: '24px 20px 0' }}>
        <SectionHead
          title="Your next session"
          action="See all"
          onAction={() => (window.location.href = '/user/sessions')}
        />
        <NextSessionCard session={upcomingSession} />
      </section>

      <section style={{ padding: '24px 20px 0' }}>
        <MoodHero mood={todaysMood} onMoodOpen={onMoodOpen} />
      </section>

      <section style={{ padding: '24px 20px 0' }}>
        <SectionHead
          title="Your week"
          action="See all"
          onAction={() => (window.location.href = '/user/practice')}
        />
        <Card padding={18}>
          <MoodWeek weekMoods={weekMoods} />
        </Card>
      </section>

      <section style={{ padding: '24px 20px 0' }}>
        <ReflectionOfDay />
      </section>

      <WorkshopTeaser workshops={workshops} />
    </div>
  )
}

function ContinueRow({
  title,
  meta,
  href,
  last,
}: {
  title: string
  meta: string
  href: string
  last?: boolean
}) {
  return (
    <Link
      href={href}
      style={{
        width: '100%',
        textAlign: 'left',
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '14px 16px',
        background: 'transparent',
        borderBottom: last ? 'none' : '1px solid var(--border)',
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: 'var(--primary)',
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: 'var(--text)',
            lineHeight: 1.3,
          }}
        >
          {title}
        </div>
        <div
          style={{
            fontSize: 11.5,
            color: 'var(--text-muted)',
            marginTop: 2,
          }}
        >
          {meta}
        </div>
      </div>
      <IconChevR size={16} sw={1.8} style={{ color: 'var(--text-muted)' }} />
    </Link>
  )
}

// ────────────────────────────────────────────────────────────────
// Shared — MoodHero
// ────────────────────────────────────────────────────────────────
function MoodHero({
  mood,
  onMoodOpen,
}: {
  mood: 1 | 2 | 3 | 4 | 5 | null
  onMoodOpen: (m?: 1 | 2 | 3 | 4 | 5) => void
}) {
  return (
    <div
      style={{
        background: 'var(--primary)',
        color: 'var(--on-dark)',
        borderRadius: 28,
        padding: '22px 22px 18px',
        position: 'relative',
        overflow: 'hidden',
        animation: 'fadeUp .6s both',
      }}
    >
      <Blob
        fill="rgba(255,248,235,0.06)"
        style={{
          position: 'absolute',
          right: -30,
          top: -36,
          width: 180,
          height: 180,
        }}
      />
      <Blob
        fill="rgba(201,120,100,0.18)"
        d="M30 10 C70 6 110 30 100 70 C92 104 50 116 22 96 C-2 78 -6 30 30 10 Z"
        style={{
          position: 'absolute',
          right: -50,
          bottom: -60,
          width: 160,
          height: 160,
        }}
      />
      <div style={{ position: 'relative' }}>
        <div
          style={{
            fontSize: 12,
            fontWeight: 700,
            letterSpacing: '0.16em',
            textTransform: 'uppercase',
            color: 'var(--on-dark-muted)',
          }}
        >
          Daily check-in
        </div>
        <div
          className="ms-display"
          style={{
            fontSize: 30,
            marginTop: 6,
            lineHeight: 1.1,
            maxWidth: 240,
          }}
        >
          How are you feeling today?
        </div>
        <div
          style={{ display: 'flex', gap: 10, marginTop: 22, marginBottom: 6 }}
        >
          {([1, 2, 3, 4, 5] as const).map((i) => {
            const active = mood === i
            return (
              <button
                key={i}
                type="button"
                onClick={() => onMoodOpen(i)}
                aria-label={`Mood ${i}`}
                style={{
                  flex: 1,
                  aspectRatio: '1',
                  borderRadius: 18,
                  background: active
                    ? 'var(--on-dark)'
                    : 'rgba(255,248,235,0.10)',
                  color: active ? 'var(--primary)' : 'var(--on-dark)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: '1px solid rgba(255,248,235,0.18)',
                  transform: active ? 'scale(1.08)' : 'scale(1)',
                  transition: 'transform .15s ease',
                }}
              >
                <MoodFace mood={i} size={28} />
              </button>
            )
          })}
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 4,
            fontSize: 11,
            color: 'var(--on-dark-muted)',
          }}
        >
          <span>Low</span>
          <span>Okay</span>
          <span>Bright</span>
        </div>
      </div>
    </div>
  )
}

// ────────────────────────────────────────────────────────────────
// Shared — NextSessionCard (wired to real upcoming session)
// ────────────────────────────────────────────────────────────────
function NextSessionCard({ session }: { session: UpcomingSession }) {
  if (!session) {
    return (
      <Card padding={18}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div
              style={{
                fontSize: 11,
                fontWeight: 700,
                color: 'var(--text-muted)',
                letterSpacing: '0.10em',
                textTransform: 'uppercase',
              }}
            >
              Nothing scheduled
            </div>
            <div
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: 'var(--text)',
                marginTop: 4,
              }}
            >
              Book a session when you’re ready.
            </div>
          </div>
          <Link
            href="/user/sessions/book"
            style={{
              padding: '8px 14px',
              borderRadius: 999,
              background: 'var(--primary)',
              color: 'var(--on-dark)',
              fontSize: 13,
              fontWeight: 800,
            }}
          >
            Book
          </Link>
        </div>
      </Card>
    )
  }

  const date = new Date(session.date)
  const hoursUntil = (date.getTime() - Date.now()) / 36e5
  const isToday = hoursUntil >= 0 && hoursUntil < 24
  const joinLabel =
    hoursUntil < 0
      ? 'In progress'
      : hoursUntil < 1
      ? `Join in ${Math.max(1, Math.round(hoursUntil * 60))}m`
      : hoursUntil < 24
      ? `Join in ${Math.round(hoursUntil)}h`
      : `Join ${format(date, 'EEE')}`

  return (
    <Card padding={0} style={{ overflow: 'hidden' }}>
      <div style={{ display: 'flex', gap: 14, padding: 14 }}>
        <div style={{ position: 'relative' }}>
          <Avatar
            name={session.doctorName}
            size={62}
            color="var(--accent)"
          />
          {isToday && (
            <div
              style={{
                position: 'absolute',
                bottom: -2,
                right: -2,
                background: 'var(--primary)',
                color: 'var(--on-dark)',
                fontSize: 9,
                fontWeight: 700,
                letterSpacing: '0.08em',
                textTransform: 'uppercase',
                padding: '3px 6px',
                borderRadius: 6,
                border: '2px solid var(--bg-card)',
              }}
            >
              Today
            </div>
          )}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div
            style={{
              fontSize: 11,
              fontWeight: 700,
              color: 'var(--text-muted)',
              letterSpacing: '0.10em',
              textTransform: 'uppercase',
            }}
          >
            Counsellor
          </div>
          <div
            style={{
              fontSize: 17,
              fontWeight: 700,
              color: 'var(--text)',
              marginTop: 2,
            }}
          >
            {session.doctorName}
          </div>
          <div
            style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: 2 }}
          >
            {format(date, "do MMM 'at' h:mma")}
          </div>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              marginTop: 8,
              fontSize: 12,
              color: 'var(--text)',
            }}
          >
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <IconCalendar size={14} sw={1.7} /> {format(date, 'h:mma')}
            </span>
            <span
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              <IconVideo size={14} sw={1.7} /> Video
            </span>
          </div>
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          gap: 0,
          borderTop: '1px solid var(--border)',
        }}
      >
        <Link
          href={`/user/sessions/${session.id}`}
          style={{
            flex: 1,
            padding: '14px 0',
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--text-muted)',
            borderRight: '1px solid var(--border)',
            textAlign: 'center',
          }}
        >
          Details
        </Link>
        <Link
          href={`/user/sessions/${session.id}`}
          style={{
            flex: 1,
            padding: '14px 0',
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--primary)',
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 6,
          }}
        >
          <IconVideo size={15} sw={2} /> {joinLabel}
        </Link>
      </div>
    </Card>
  )
}

// ────────────────────────────────────────────────────────────────
// Shared — QuickTile, MoodWeek, ReflectionOfDay, WorkshopTeaser
// ────────────────────────────────────────────────────────────────
function QuickTile({
  icon,
  label,
  sub,
  bg,
  fg,
  href,
}: {
  icon: React.ReactNode
  label: string
  sub: string
  bg: string
  fg: string
  href: string
}) {
  return (
    <Link
      href={href}
      style={{
        textAlign: 'left',
        background: bg,
        color: fg,
        borderRadius: 22,
        padding: '16px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        minHeight: 104,
      }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          borderRadius: '50%',
          background: 'rgba(255,255,255,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 14, fontWeight: 800, lineHeight: 1.1 }}>
          {label}
        </div>
        <div style={{ fontSize: 11, opacity: 0.75, marginTop: 2 }}>{sub}</div>
      </div>
    </Link>
  )
}

function MoodWeek({ weekMoods }: { weekMoods: WeekMood[] }) {
  const heights: Record<1 | 2 | 3 | 4 | 5, number> = { 1: 18, 2: 32, 3: 50, 4: 68, 5: 86 }
  const todayKey = new Date().toISOString().slice(0, 10)
  // Single-letter weekday labels Mon..Sun matching the date.
  const days = weekMoods.map((d) => {
    const dt = new Date(d.date)
    const letter = dt
      .toLocaleDateString('en-IN', { weekday: 'short' })
      .charAt(0)
    return {
      d: letter,
      mood: d.mood,
      today: dt.toISOString().slice(0, 10) === todayKey,
    }
  })

  const filledMoods = days.map((d) => d.mood).filter((m): m is 1|2|3|4|5 => m !== null)
  const avg =
    filledMoods.length > 0
      ? filledMoods.reduce((s, m) => s + m, 0) / filledMoods.length
      : 0
  const avgLabel =
    avg === 0 ? '—' : (MOOD_INFO[Math.round(avg) as 1 | 2 | 3 | 4 | 5]?.label ?? '—')

  return (
    <div>
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          gap: 10,
          height: 100,
        }}
      >
        {days.map((day, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'flex-end',
              height: '100%',
            }}
          >
            {day.mood ? (
              <div
                style={{
                  width: '100%',
                  height: heights[day.mood],
                  borderRadius: 8,
                  background: MOOD_INFO[day.mood]?.color,
                  opacity: 0.85,
                }}
              />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: 86,
                  borderRadius: 8,
                  border: '1.5px dashed var(--border-strong)',
                }}
              />
            )}
          </div>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
        {days.map((day, i) => (
          <div
            key={i}
            style={{
              flex: 1,
              textAlign: 'center',
              fontSize: 11,
              fontWeight: 700,
              color: day.today ? 'var(--primary)' : 'var(--text-muted)',
            }}
          >
            {day.d}
          </div>
        ))}
      </div>
      {filledMoods.length > 1 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            marginTop: 14,
            paddingTop: 12,
            borderTop: '1px solid var(--border)',
          }}
        >
          <div style={{ fontSize: 13, color: 'var(--text)' }}>
            Avg this week:{' '}
            <b style={{ color: 'var(--primary)' }}>{avgLabel}</b>
          </div>
        </div>
      )}
    </div>
  )
}

function ReflectionOfDay() {
  const quote = getDailyQuote()
  return (
    <Card padding={20} bg="var(--bg-cream)" radius={22}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.16em',
          textTransform: 'uppercase',
          color: 'var(--accent)',
        }}
      >
        <IconLeaf size={14} sw={1.8} /> Reflection of the day
      </div>
      <p
        className="ms-serif"
        style={{
          fontSize: 19,
          lineHeight: 1.4,
          color: 'var(--text)',
          marginTop: 10,
          marginBottom: 0,
        }}
      >
        &ldquo;{quote.text}&rdquo;
      </p>
      <div
        style={{
          fontSize: 12,
          color: 'var(--text-muted)',
          marginTop: 6,
        }}
      >
        &mdash; {quote.author}
      </div>
      <Link
        href="/user/practice/journal/new"
        style={{
          marginTop: 14,
          fontSize: 13,
          fontWeight: 700,
          color: 'var(--primary)',
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
        }}
      >
        Write a response <IconArrowRight size={14} sw={2} />
      </Link>
    </Card>
  )
}

// WorkshopTeaser renders real upcoming workshops passed from the server.
// Returns null (renders nothing) when there are none, so the home doesn't
// show an empty section. Cards link to the workshop detail.
function WorkshopTeaser({ workshops }: { workshops: WorkshopTeaserItem[] }) {
  if (workshops.length === 0) return null
  return (
    <section style={{ padding: '24px 20px 0' }}>
      <SectionHead
        title="Upcoming workshops"
        action="Browse"
        onAction={() => (window.location.href = '/user/discover/workshops')}
      />
      <div style={{ display: 'grid', gap: 10 }}>
        {workshops.map((w) => (
          <WorkshopTeaserCard key={w.id} {...w} />
        ))}
      </div>
    </section>
  )
}

// Horizontal card: portrait poster thumbnail (left, uncropped shape) + text.
function WorkshopTeaserCard({
  id,
  title,
  host,
  when,
  coverImageUrl,
  priceLabel,
}: WorkshopTeaserItem) {
  const isFree = priceLabel.toLowerCase() === 'free'
  return (
    <div
      onClick={() => (window.location.href = `/user/discover/workshops/${id}`)}
      style={{
        display: 'flex',
        gap: 12,
        background: 'var(--bg-card)',
        borderRadius: 18,
        boxShadow: 'var(--shadow-card)',
        padding: 10,
        cursor: 'pointer',
      }}
    >
      <div
        style={{
          width: 70,
          flexShrink: 0,
          aspectRatio: '1 / 1.414',
          borderRadius: 12,
          overflow: 'hidden',
          background: 'var(--primary-tint)',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coverImageUrl}
            alt={title}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <IconCalendar size={22} sw={1.6} />
        )}
      </div>

      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 5,
        }}
      >
        <div
          style={{
            fontSize: 14,
            fontWeight: 800,
            lineHeight: 1.25,
            color: 'var(--text)',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical' as const,
            overflow: 'hidden',
          }}
        >
          {title}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-muted)', lineHeight: 1.35 }}>
          {host}
          <br />
          {when}
        </div>
        <div>
          <span
            style={{
              fontSize: 11,
              fontWeight: 800,
              color: isFree ? '#2A7A4A' : 'var(--primary)',
              background: isFree ? 'rgba(74,184,116,0.18)' : 'var(--primary-tint)',
              padding: '3px 9px',
              borderRadius: 999,
            }}
          >
            {priceLabel}
          </span>
        </div>
      </div>
    </div>
  )
}

function RecentFollowupRow({ f }: { f: RecentFollowup }) {
  const date = new Date(f.sessionDate)
  const moodInfo = f.postMood ? MOOD_INFO[f.postMood] : null
  return (
    <Link
      href={`/user/sessions/${f.sessionId}`}
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        background: 'var(--bg-card)',
        borderRadius: 18,
        padding: 14,
        boxShadow: 'var(--shadow-card)',
      }}
    >
      <Avatar
        name={f.doctorName}
        size={42}
        color="var(--accent)"
        src={f.doctorPhoto ?? undefined}
      />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
            {f.doctorName}
          </div>
          {moodInfo && (
            <span
              style={{
                marginLeft: 'auto',
                display: 'inline-flex',
                alignItems: 'center',
                gap: 4,
                fontSize: 11,
                color: moodInfo.color,
                fontWeight: 700,
              }}
            >
              <MoodFace mood={f.postMood as 1 | 2 | 3 | 4 | 5} size={16} />{' '}
              {moodInfo.label}
            </span>
          )}
        </div>
        <div
          style={{
            fontSize: 11,
            color: 'var(--text-muted)',
            marginTop: 2,
            letterSpacing: '0.04em',
          }}
        >
          {date.toLocaleDateString('en-IN', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
          })}
        </div>
        {f.homeworkNote && (
          <p
            className="ms-serif"
            style={{
              fontSize: 13,
              lineHeight: 1.5,
              color: 'var(--text-muted)',
              marginTop: 6,
              marginBottom: 0,
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical' as const,
              overflow: 'hidden',
            }}
          >
            {f.homeworkNote}
          </p>
        )}
      </div>
    </Link>
  )
}
