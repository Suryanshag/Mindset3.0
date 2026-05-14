'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Search, PenLine, Compass } from 'lucide-react'
import type { UpcomingItem } from '@/lib/queries/upcoming'

// ─── Date utilities ────────────────────────────────────────────────────────

export function formatRelativeDay(d: Date): string {
  const now = new Date()
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const target = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return 'Today'
  if (diffDays === 1) return 'Tomorrow'
  return d.toLocaleDateString('en-US', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

export function formatTimeShort(d: Date): string {
  return d.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

export function formatCountdown(d: Date): string {
  const ms = d.getTime() - Date.now()
  if (ms <= 5 * 60 * 1000) return 'starting soon'
  const minutes = Math.floor(ms / 60000)
  if (minutes < 60) return `in ${minutes} min`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `in ${hours} ${hours === 1 ? 'hour' : 'hours'}`
  const days = Math.floor(hours / 24)
  return `in ${days} ${days === 1 ? 'day' : 'days'}`
}

/** Join window: 15 min before start through 60 min after start. */
// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function isJoinWindowOpen(startsAt: Date, _durationMin: number): boolean {
  const now = Date.now()
  const start = startsAt.getTime()
  return now >= start - 15 * 60 * 1000 && now <= start + 60 * 60 * 1000
}

// ─── Chip styling ──────────────────────────────────────────────────────────

const CHIP: Record<UpcomingItem['kind'], { label: string; cls: string }> = {
  session: {
    label: 'Session',
    cls: 'bg-primary-tint text-primary',
  },
  workshop: {
    label: 'Workshop',
    cls: 'bg-accent-tint text-accent',
  },
  circle: {
    label: 'Circle',
    cls: 'bg-tan-tint text-amber-700',
  },
}

// ─── Rail ──────────────────────────────────────────────────────────────────

type Props = {
  items: UpcomingItem[]
  showFirstSteps: boolean
}

export default function ComingUpRail({ items, showFirstSteps }: Props) {
  if (items.length === 0) {
    if (!showFirstSteps) return null
    return <FirstStepsRail />
  }

  return (
    <div className="space-y-3">
      <p className="text-[11px] font-medium text-text-faint uppercase tracking-[0.6px]">
        Coming up
      </p>
      <div className="space-y-2.5">
        {items.map((item) => (
          <ItemCard key={`${item.kind}-${item.id}`} item={item} />
        ))}
      </div>
    </div>
  )
}

function ItemCard({ item }: { item: UpcomingItem }) {
  const router = useRouter()
  // Dates may arrive as ISO strings depending on serialization edges — coerce defensively.
  const startsAt = item.startsAt instanceof Date ? item.startsAt : new Date(item.startsAt)
  const chip = CHIP[item.kind]
  const canJoin = isJoinWindowOpen(startsAt, item.durationMin) && !!item.meetLink

  function handleCardClick(e: React.MouseEvent<HTMLDivElement>) {
    // Don't navigate if the click target is the Join button (anchor)
    if ((e.target as HTMLElement).closest('a[data-join]')) return
    router.push(item.href)
  }

  function handleKey(e: React.KeyboardEvent<HTMLDivElement>) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      router.push(item.href)
    }
  }

  return (
    <div
      role="link"
      tabIndex={0}
      onClick={handleCardClick}
      onKeyDown={handleKey}
      className="block rounded-xl p-4 bg-bg-card cursor-pointer transition-all duration-150 lg:hover:shadow-sm lg:hover:-translate-y-0.5"
      style={{ border: '0.5px solid var(--color-border)' }}
    >
      <div className="flex items-center gap-2 mb-2">
        <span
          className={`text-[10px] font-medium uppercase tracking-[0.5px] px-2 py-0.5 rounded ${chip.cls}`}
        >
          {chip.label}
        </span>
      </div>

      <p className="text-[15px] font-medium text-text leading-tight">{item.title}</p>

      <p className="text-[13px] text-text-muted mt-1.5">
        {formatRelativeDay(startsAt)}, {formatTimeShort(startsAt)}
      </p>

      {item.counterpartyName && (
        <p className="text-[12px] text-text-faint mt-0.5">
          {item.kind === 'session' ? 'with' : 'by'} {item.counterpartyName}
        </p>
      )}

      <div className="mt-3">
        {canJoin && item.meetLink ? (
          <a
            data-join
            href={item.meetLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center px-3 py-1.5 rounded-lg text-[13px] font-medium text-white"
            style={{ background: 'var(--color-primary, var(--coral))' }}
          >
            Join
          </a>
        ) : (
          <p className="text-[12px] text-text-faint">{formatCountdown(startsAt)}</p>
        )}
      </div>
    </div>
  )
}

// ─── First-steps fallback (empty engagement on /user) ──────────────────────

function FirstStepsRail() {
  return (
    <div className="space-y-5">
      <p className="text-[11px] font-medium text-text-faint uppercase tracking-[0.6px]">
        First steps
      </p>
      <div className="space-y-2">
        <FirstStepCard href="/doctors" icon={Search} label="Find a therapist" />
        <FirstStepCard
          href="/user/practice/journal/new"
          icon={PenLine}
          label="Write your first entry"
        />
        <FirstStepCard
          href="/user/discover/workshops"
          icon={Compass}
          label="Browse workshops"
        />
      </div>
    </div>
  )
}

function FirstStepCard({
  href,
  icon: Icon,
  label,
}: {
  href: string
  icon: React.ComponentType<{ size?: number; className?: string }>
  label: string
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-[13px] text-text transition-colors duration-150 hover:bg-white/60"
      style={{ border: '0.5px solid var(--color-border)' }}
    >
      <Icon size={16} className="text-text-faint shrink-0" />
      {label}
    </Link>
  )
}
