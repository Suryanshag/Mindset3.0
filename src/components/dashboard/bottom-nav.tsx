'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  Home,
  CalendarDays,
  NotebookPen,
  Compass,
  UserCircle,
} from 'lucide-react'

const tabs = [
  { href: '/user', label: 'Home', Icon: Home },
  { href: '/user/sessions', label: 'Sessions', Icon: CalendarDays },
  { href: '/user/practice', label: 'Practice', Icon: NotebookPen },
  { href: '/user/discover', label: 'Discover', Icon: Compass },
  { href: '/user/profile', label: 'Profile', Icon: UserCircle },
]

export default function BottomNav() {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/user') return pathname === '/user'
    return pathname.startsWith(href)
  }

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 bg-bg-card lg:max-w-md lg:mx-auto"
      style={{
        borderTop: '0.5px solid var(--color-border)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div
        className="grid h-14 items-center"
        style={{ gridTemplateColumns: 'repeat(5, 1fr)' }}
      >
        {tabs.map(({ href, label, Icon }) => {
          const active = isActive(href)

          return (
            <Link
              key={href}
              href={href}
              className="flex flex-col items-center justify-center gap-0.5"
            >
              <Icon
                size={20}
                strokeWidth={active ? 2.2 : 1.5}
                className={active ? 'text-primary' : 'text-text-faint'}
              />
              <span
                className={`text-[10px] leading-none ${
                  active
                    ? 'text-primary font-medium'
                    : 'text-text-faint font-normal'
                }`}
              >
                {label}
              </span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
