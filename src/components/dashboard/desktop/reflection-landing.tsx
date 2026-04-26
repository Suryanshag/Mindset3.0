import Link from 'next/link'
import { Video, Search, PenLine, Compass } from 'lucide-react'
import type { ReflectionLandingData } from '@/lib/queries/reflection'
import type { EngagementState } from '@/lib/queries/dashboard'

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  if (h < 21) return 'Good evening'
  return 'Hi'
}

function lastSessionPhrase(daysSince: number, doctorName: string, isFirst: boolean): string {
  const firstName = doctorName.split(' ')[0]
  if (isFirst) {
    if (daysSince <= 3) return `You had your first session with ${firstName} ${daysSince <= 1 ? 'yesterday' : `${daysSince} days ago`}.`
    if (daysSince <= 7) return `You had your first session with ${firstName} earlier this week.`
    if (daysSince <= 14) return `You had your first session with ${firstName} last week.`
    return `You had your first session with ${firstName} a little while ago.`
  }
  if (daysSince <= 1) return `You met with ${firstName} yesterday.`
  if (daysSince <= 3) return `Your last session with ${firstName} was ${daysSince} days ago.`
  if (daysSince <= 7) return `Your last session with ${firstName} was earlier this week.`
  if (daysSince <= 14) return `Your last session with ${firstName} was last week.`
  if (daysSince <= 30) return `It\u2019s been a few weeks since your session with ${firstName}.`
  if (daysSince <= 60) return `It\u2019s been over a month since your last session.`
  return `It\u2019s been a while since you last met with ${firstName}.`
}

function daysUntil(date: Date): string {
  const diff = Math.ceil(
    (date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )
  if (diff <= 0) {
    return `today at ${date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })}`
  }
  if (diff === 1) return 'tomorrow'
  return `in ${diff} days`
}

const ASSIGNMENT_VERBS: Record<string, string> = {
  JOURNAL_PROMPT: 'Write',
  READING: 'Read',
  WORKSHEET: 'Complete',
  BREATHING: 'Practice',
  CUSTOM: 'Complete',
}

export default function ReflectionLanding({
  data,
  engagementState,
}: {
  data: ReflectionLandingData
  engagementState: EngagementState
}) {
  const greeting = getGreeting()
  const firstName = data.userName.split(' ')[0]

  if (engagementState === 'empty') {
    return <EmptyState greeting={greeting} firstName={firstName} />
  }

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  const isPartial = engagementState === 'partial'
  const isFirstSession = isPartial && data.lastSession !== null

  // Adaptive prose
  const daysSinceLastSession = data.lastSession
    ? Math.floor((Date.now() - new Date(data.lastSession.date).getTime()) / (1000 * 60 * 60 * 24))
    : null
  const sessionProse = data.lastSession && daysSinceLastSession !== null
    ? lastSessionPhrase(daysSinceLastSession, data.lastSession.doctorName, isFirstSession)
    : null
  const entriesProse = data.entriesSinceLastSession > 0
    ? `You\u2019ve written ${data.entriesSinceLastSession} ${data.entriesSinceLastSession === 1 ? 'entry' : 'entries'} since.`
    : null
  const completedProse = data.completedSinceLastSession > 0
    ? `You\u2019ve completed ${data.completedSinceLastSession} ${data.completedSinceLastSession === 1 ? 'exercise' : 'exercises'}.`
    : null
  const showSchedulePrompt = daysSinceLastSession !== null && daysSinceLastSession > 30

  // Join window
  const joinWindowOpen = data.nextSession
    ? (() => {
        const now = Date.now()
        const start = new Date(data.nextSession.date).getTime()
        const end = start + 60 * 60 * 1000
        const fifteenMin = 15 * 60 * 1000
        return (
          data.nextSession.status === 'CONFIRMED' &&
          data.nextSession.meetLink &&
          now >= start - fifteenMin &&
          now <= end + fifteenMin
        )
      })()
    : false

  // Pending items
  const pendingItems: { label: string; href: string }[] = []
  for (const a of data.pendingAssignments) {
    const verb = ASSIGNMENT_VERBS[a.type] ?? 'Complete'
    pendingItems.push({
      label: `${verb}: ${a.title}`,
      href: `/user/practice/assignments/${a.id}`,
    })
  }
  if (data.upcomingWorkshop) {
    const wsDate = data.upcomingWorkshop.startsAt.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
    })
    pendingItems.push({
      label: `Attending: ${data.upcomingWorkshop.title}, ${wsDate}`,
      href: `/user/discover/workshops/${data.upcomingWorkshop.id}`,
    })
  }
  const morePending = Math.max(0, data.totalPendingCount - data.pendingAssignments.length)

  return (
    <div className="py-4">
      {/* Greeting */}
      <div className="mb-10">
        <h1 className="text-[22px] font-medium text-text">
          {greeting}, {firstName}
        </h1>
        <p className="text-[14px] text-text-faint mt-1">{todayStr}</p>
      </div>

      {/* Last session reflection */}
      {data.lastSession && sessionProse ? (
        <div className="mb-10">
          <div className="h-px mb-8" style={{ backgroundColor: 'var(--color-border)' }} />
          <p className="text-[16px] font-serif text-text-muted leading-[1.7]">
            {sessionProse}
          </p>
          {isPartial && !entriesProse && !completedProse && (
            <p className="text-[16px] font-serif text-text-muted leading-[1.7] mt-2">
              As you continue, this space will fill with what comes between your sessions.
            </p>
          )}
          {entriesProse && (
            <p className="text-[16px] font-serif text-text-muted leading-[1.7] mt-2">
              {entriesProse}
            </p>
          )}
          {completedProse && (
            <p className="text-[16px] font-serif text-text-muted leading-[1.7] mt-2">
              {completedProse}
            </p>
          )}
          <div className="flex items-center gap-4 mt-4">
            <Link
              href={`/user/sessions/${data.lastSession.id}`}
              className="text-[14px] text-primary font-medium hover:underline"
            >
              Open chapter ↗
            </Link>
            {showSchedulePrompt && (
              <Link
                href={`/user/sessions/book?doctorId=${data.lastSession.doctorId}`}
                className="text-[14px] text-text-muted hover:text-primary transition-colors duration-150"
              >
                Want to schedule another?
              </Link>
            )}
          </div>
        </div>
      ) : !data.lastSession ? (
        <div className="mb-10">
          <div className="h-px mb-8" style={{ backgroundColor: 'var(--color-border)' }} />
          <p className="text-[16px] font-serif text-text-muted leading-[1.7]">
            You haven{'\u2019'}t had a session yet. Find a therapist who fits you.
          </p>
          <Link
            href="/doctors"
            className="inline-flex items-center mt-4 px-5 py-2.5 rounded-full bg-primary text-white text-[14px] font-medium"
          >
            Find a therapist
          </Link>
        </div>
      ) : null}

      {/* Next up */}
      {data.nextSession && (
        <div className="mb-10">
          <div className="h-px mb-8" style={{ backgroundColor: 'var(--color-border)' }} />
          <p className="text-[11px] font-medium text-text-faint uppercase tracking-[0.6px] mb-3">
            Next up
          </p>
          <p className="text-[15px] text-text">
            Your next session is {daysUntil(data.nextSession.date)}
          </p>
          <p className="text-[14px] text-text-muted mt-1">
            {new Date(data.nextSession.date).toLocaleDateString('en-US', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
            })}
            {' '}&middot;{' '}
            {new Date(data.nextSession.date).toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            })}
          </p>
          <div className="mt-4">
            {joinWindowOpen && data.nextSession.meetLink ? (
              <a
                href={data.nextSession.meetLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary text-white text-[14px] font-medium"
              >
                <Video size={16} />
                Join session
              </a>
            ) : (
              <p className="text-[13px] text-text-faint">
                Join opens 15 min before your session
              </p>
            )}
          </div>
        </div>
      )}

      {/* A few things to do */}
      {pendingItems.length > 0 && (
        <div className="mb-10">
          <div className="h-px mb-8" style={{ backgroundColor: 'var(--color-border)' }} />
          <p className="text-[11px] font-medium text-text-faint uppercase tracking-[0.6px] mb-3">
            A few things to do
          </p>
          <ul className="space-y-2">
            {pendingItems.map((item, i) => (
              <li key={i}>
                <Link
                  href={item.href}
                  className="text-[14px] text-text hover:text-primary transition-colors duration-150"
                >
                  {'\u2022'} {item.label}
                </Link>
              </li>
            ))}
          </ul>
          {morePending > 0 && (
            <Link
              href="/user/practice"
              className="text-[13px] text-primary font-medium mt-3 inline-block hover:underline"
            >
              and {morePending} more in Practice
            </Link>
          )}
        </div>
      )}

      {/* Partial state: take your next step */}
      {isPartial && (
        <div>
          <div className="h-px mb-8" style={{ backgroundColor: 'var(--color-border)' }} />
          <p className="text-[11px] font-medium text-text-faint uppercase tracking-[0.6px] mb-3">
            Take your next step
          </p>
          <div className="space-y-2">
            <Link
              href="/user/practice/journal/new"
              className="text-[14px] text-text hover:text-primary transition-colors duration-150"
            >
              {'\u2022'} Write a journal entry
            </Link>
            <Link
              href="/user/discover"
              className="block text-[14px] text-text hover:text-primary transition-colors duration-150"
            >
              {'\u2022'} Browse the library
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}

/** Empty state: brand new user, no activity */
function EmptyState({ greeting, firstName }: { greeting: string; firstName: string }) {
  return (
    <div className="py-4">
      {/* Greeting — no date line for empty state */}
      <div className="mb-10">
        <h1 className="text-[22px] font-medium text-text">
          {greeting}, {firstName}
        </h1>
      </div>

      <div className="mb-10">
        <div className="h-px mb-8" style={{ backgroundColor: 'var(--color-border)' }} />
        <p className="text-[16px] font-serif italic text-text-muted leading-[1.7]">
          Mindset is a space for the work you do between sessions{'\u2009'}{'\u2014'}{'\u2009'}and
          a place to look back on it as your journey unfolds.
        </p>
      </div>

      {/* First steps */}
      <div className="h-px mb-8" style={{ backgroundColor: 'var(--color-border)' }} />
      <p className="text-[11px] font-medium text-text-faint uppercase tracking-[0.6px] mb-5">
        First steps
      </p>

      <div className="space-y-3">
        {/* Find a therapist — primary card with accent */}
        <Link
          href="/doctors"
          className="block rounded-xl p-5 bg-bg-card transition-colors duration-150 hover:bg-white/80"
          style={{ border: '0.5px solid var(--color-border)', borderLeft: '3px solid var(--color-accent)' }}
        >
          <div className="flex items-start gap-3">
            <Search size={18} className="text-accent shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-medium text-text">Find a therapist</p>
              <p className="text-[13px] text-text-muted mt-1 leading-relaxed">
                Browse our therapists and book your first session.
              </p>
            </div>
          </div>
          <p className="text-[13px] text-primary font-medium mt-3 ml-[30px]">
            Begin →
          </p>
        </Link>

        {/* Write first entry */}
        <Link
          href="/user/practice/journal/new"
          className="block rounded-xl p-5 bg-bg-card transition-colors duration-150 hover:bg-white/80"
          style={{ border: '0.5px solid var(--color-border)' }}
        >
          <div className="flex items-start gap-3">
            <PenLine size={18} className="text-text-muted shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-medium text-text">Write your first entry</p>
              <p className="text-[13px] text-text-muted mt-1 leading-relaxed">
                Journal anything you{'\u2019'}d like to remember or work through.
              </p>
            </div>
          </div>
          <p className="text-[13px] text-primary font-medium mt-3 ml-[30px]">
            Begin →
          </p>
        </Link>

        {/* Browse workshops */}
        <Link
          href="/user/discover/workshops"
          className="block rounded-xl p-5 bg-bg-card transition-colors duration-150 hover:bg-white/80"
          style={{ border: '0.5px solid var(--color-border)' }}
        >
          <div className="flex items-start gap-3">
            <Compass size={18} className="text-text-muted shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <p className="text-[15px] font-medium text-text">Browse workshops</p>
              <p className="text-[13px] text-text-muted mt-1 leading-relaxed">
                Free and paid workshops on different aspects of wellness.
              </p>
            </div>
          </div>
        </Link>
      </div>
    </div>
  )
}
