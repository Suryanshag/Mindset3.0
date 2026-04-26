import Link from 'next/link'
import { Video } from 'lucide-react'
import type { ReflectionLandingData } from '@/lib/queries/reflection'

function getGreeting(): string {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  if (h < 21) return 'Good evening'
  return 'Hi'
}

function daysAgo(date: Date): string {
  const diff = Math.floor(
    (Date.now() - date.getTime()) / (1000 * 60 * 60 * 24)
  )
  if (diff === 0) return 'today'
  if (diff === 1) return 'yesterday'
  return `${diff} days ago`
}

function daysUntil(date: Date): string {
  const diff = Math.ceil(
    (date.getTime() - Date.now()) / (1000 * 60 * 60 * 24)
  )
  if (diff <= 0) {
    // Today — show time
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
}: {
  data: ReflectionLandingData
}) {
  const greeting = getGreeting()
  const firstName = data.userName.split(' ')[0]

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  // Build the "last session" prose
  let lastSessionProse = ''
  if (data.lastSession) {
    const ago = daysAgo(data.lastSession.date)
    lastSessionProse = `Your last session was ${ago} with ${data.lastSession.doctorName}.`
    if (data.entriesSinceLastSession > 0) {
      lastSessionProse += ` You wrote ${data.entriesSinceLastSession} ${data.entriesSinceLastSession === 1 ? 'entry' : 'entries'} since.`
    }
    if (data.completedSinceLastSession > 0) {
      lastSessionProse += ` Completed ${data.completedSinceLastSession} ${data.completedSinceLastSession === 1 ? 'exercise' : 'exercises'}.`
    }
  }

  // Join window check for next session
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

  // Pending items list
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
      {data.lastSession ? (
        <div className="mb-10">
          <div className="h-px bg-border mb-8" style={{ backgroundColor: 'var(--color-border)' }} />
          <p className="text-[16px] font-serif text-text-muted leading-[1.7]">
            {lastSessionProse}
          </p>
          <Link
            href={`/user/sessions/${data.lastSession.id}`}
            className="inline-block text-[14px] text-primary font-medium mt-4 hover:underline"
          >
            Open chapter ↗
          </Link>
        </div>
      ) : (
        <div className="mb-10">
          <div className="h-px bg-border mb-8" style={{ backgroundColor: 'var(--color-border)' }} />
          <p className="text-[16px] font-serif text-text-muted leading-[1.7]">
            You haven&apos;t had a session yet. Find a therapist who fits you.
          </p>
          <Link
            href="/doctors"
            className="inline-flex items-center mt-4 px-5 py-2.5 rounded-full bg-primary text-white text-[14px] font-medium"
          >
            Find a therapist
          </Link>
        </div>
      )}

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
        <div>
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
                  • {item.label}
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
    </div>
  )
}
