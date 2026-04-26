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

const SPACES = [
  { href: '/user/sessions', label: 'Sessions', Icon: CalendarDays },
  { href: '/user/practice', label: 'Practice', Icon: NotebookPen },
  { href: '/user/discover', label: 'Discover', Icon: Compass },
  { href: '/user/shop', label: 'Shop', Icon: ShoppingBag },
  { href: '/user/profile', label: 'Profile', Icon: UserCircle },
]

export default function Spine() {
  const pathname = usePathname()
  const { data: session } = useSession()

  const userName = session?.user?.name ?? 'User'
  const userImage = session?.user?.image ?? null
  const userInitials = userName
    .split(' ')
    .map((w: string) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2)

  function isActive(href: string) {
    if (href === '/user') return pathname === '/user'
    return pathname.startsWith(href)
  }

  const todayStr = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  return (
    <aside className="spine sticky top-0 h-dvh flex flex-col overflow-y-auto">
      {/* Logo */}
      <div className="h-16 flex items-center px-4">
        <Link href="/" className="text-[20px] font-bold text-text tracking-tight">
          Mindset
        </Link>
      </div>

      {/* Today — pinned top item */}
      <div className="px-3">
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

      {/* Reflection section — stubbed for sprint 7 */}
      <div className="px-4 mt-5">
        <p className="text-[11px] font-medium text-text-faint uppercase tracking-[0.6px] mb-2">
          Reflection
        </p>
        <p className="text-[12px] text-text-faint px-3 py-2 leading-relaxed">
          Your past sessions will appear here once you&apos;ve had a few
        </p>
      </div>

      {/* Spaces — main navigation */}
      <div className="px-4 mt-5 flex-1">
        <p className="text-[11px] font-medium text-text-faint uppercase tracking-[0.6px] mb-2">
          Spaces
        </p>
        <nav className="space-y-0.5 px-0">
          {SPACES.map(({ href, label, Icon }) => {
            const active = isActive(href)
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
      <div className="px-3 pb-4 mt-auto">
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
