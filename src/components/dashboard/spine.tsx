'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  CalendarDays,
  NotebookPen,
  Compass,
  ShoppingBag,
  UserCircle,
  PenLine,
} from 'lucide-react'
import type { SpineSession } from '@/lib/queries/reflection'

const SPACES = [
  { href: '/user/sessions', label: 'Sessions', Icon: CalendarDays },
  { href: '/user/practice', label: 'Practice', Icon: NotebookPen },
  { href: '/user/discover', label: 'Discover', Icon: Compass },
  { href: '/user/shop', label: 'Shop', Icon: ShoppingBag },
  { href: '/user/profile', label: 'Profile', Icon: UserCircle },
]

type Props = {
  sessions?: SpineSession[]
}

/** Group sessions by "Month Year" key. */
function groupByMonth(sessions: SpineSession[]) {
  const groups = new Map<string, SpineSession[]>()
  for (const s of sessions) {
    const key = s.date.toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    })
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(s)
  }
  return groups
}

export default function Spine({ sessions = [] }: Props) {
  const pathname = usePathname()
  const { data: authSession } = useSession()

  const userName = authSession?.user?.name ?? 'User'
  const userImage = authSession?.user?.image ?? null
  const userInitials = userName
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  function isSpaceActive(href: string) {
    if (href === '/user') return pathname === '/user'
    return pathname.startsWith(href)
  }

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  const grouped = groupByMonth(sessions)

  return (
    <aside className="spine sticky top-0 h-dvh grid overflow-hidden" style={{ gridTemplateRows: 'auto auto 1fr auto auto' }}>
      {/* Logo */}
      <div className="h-16 flex items-center px-4 shrink-0">
        <Link href="/" className="text-[20px] font-bold text-text tracking-tight">
          Mindset
        </Link>
      </div>

      {/* Today — pinned top item */}
      <div className="px-3 shrink-0">
        <Link
          href="/user"
          className={`spine-item flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-150 ${
            pathname === '/user'
              ? 'spine-item--active bg-primary-tint text-primary'
              : 'text-text hover:bg-white/60'
          }`}
        >
          <PenLine size={18} className={pathname === '/user' ? 'text-primary' : 'text-text-muted'} />
          <div className="min-w-0">
            <p className="text-[14px] font-medium leading-tight">Today</p>
            <p className="text-[11px] text-text-faint leading-tight mt-0.5">{todayStr}</p>
          </div>
        </Link>
      </div>

      {/* Reflection section — scrollable */}
      <div className="px-4 mt-4 overflow-y-auto min-h-0 scrollbar-hide">
        <p className="text-[11px] font-medium text-text-faint uppercase tracking-[0.6px] mb-2">
          Reflection
        </p>
        {sessions.length === 0 ? (
          <p className="text-[12px] text-text-faint px-3 py-2 leading-relaxed">
            Your past sessions will appear here once you&apos;ve had a few
          </p>
        ) : (
          <div className="space-y-3">
            {Array.from(grouped.entries()).map(([month, items]) => (
              <div key={month}>
                <p className="text-[11px] text-text-faint font-medium mb-1 px-1">
                  {month}
                </p>
                <div className="space-y-0.5">
                  {items.map((s) => {
                    const active = pathname === `/user/sessions/${s.id}`
                    const dateLabel = s.date.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                    })
                    const doctorFirst = s.doctorName.split(' ')[0]
                    return (
                      <Link
                        key={s.id}
                        href={`/user/sessions/${s.id}`}
                        className={`spine-item flex items-center gap-2.5 px-3 py-1.5 rounded-lg transition-colors duration-150 group ${
                          active
                            ? 'spine-item--active bg-primary-tint text-primary'
                            : 'text-text hover:bg-white/60'
                        }`}
                      >
                        <span className="text-[13px] font-medium leading-tight">
                          Session, {dateLabel}
                        </span>
                        <span className="text-[11px] text-text-faint opacity-0 group-hover:opacity-100 transition-opacity truncate">
                          {doctorFirst}
                        </span>
                      </Link>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Spaces — main navigation, pinned */}
      <div className="px-4 pt-3 pb-1 shrink-0" style={{ borderTop: '0.5px solid var(--color-border)' }}>
        <p className="text-[11px] font-medium text-text-faint uppercase tracking-[0.6px] mb-2">
          Spaces
        </p>
        <nav className="space-y-0.5">
          {SPACES.map(({ href, label, Icon }) => {
            const active = isSpaceActive(href)
            return (
              <Link
                key={href}
                href={href}
                className={`spine-item flex items-center gap-3 px-3 py-2 rounded-lg transition-colors duration-150 ${
                  active
                    ? 'spine-item--active bg-primary-tint text-primary'
                    : 'text-text hover:bg-white/60'
                }`}
              >
                <Icon size={18} className={active ? 'text-primary' : 'text-text-muted'} />
                <span className="text-[14px] font-medium">{label}</span>
              </Link>
            )
          })}
        </nav>
      </div>

      {/* User profile pill — bottom */}
      <div className="px-3 pb-4 pt-2 shrink-0">
        <Link
          href="/user/profile"
          className="spine-item flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors duration-150 hover:bg-white/60"
        >
          {userImage ? (
            <img
              src={userImage}
              alt=""
              className="w-8 h-8 rounded-full object-cover shrink-0"
            />
          ) : (
            <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center shrink-0">
              <span className="text-[11px] font-medium text-white">{userInitials}</span>
            </div>
          )}
          <span className="text-[14px] font-medium text-text truncate">{userName}</span>
        </Link>
      </div>
    </aside>
  )
}
