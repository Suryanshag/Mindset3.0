'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LucideIcon } from 'lucide-react'

interface NavItem {
  href: string
  label: string
  icon: LucideIcon
  exact?: boolean
}

interface MobileBottomNavProps {
  items: NavItem[]
}

export default function MobileBottomNav({ items }: MobileBottomNavProps) {
  const pathname = usePathname()

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-2 safe-area-bottom">
      <div
        className="flex items-center justify-around h-16 rounded-2xl backdrop-blur-xl"
        style={{
          background: 'rgba(255,255,255,0.92)',
          boxShadow: '0 4px 24px rgba(30,68,92,0.12)',
        }}
      >
        {items.map(({ href, label, icon: Icon, exact }) => {
          const isActive = exact
            ? pathname === href
            : pathname === href || pathname.startsWith(href + '/')

          return (
            <Link
              key={href}
              href={href}
              className={`
                flex flex-col items-center justify-center
                gap-0.5 px-3 py-2 rounded-2xl
                min-w-[56px] relative
                transition-all duration-200
                active:scale-90
              `}
            >
              <span className="relative z-10">
                <Icon
                  className="w-5 h-5 transition-all duration-200"
                  style={{
                    color: isActive ? 'var(--navy)' : 'rgba(30,68,92,0.35)',
                    strokeWidth: isActive ? 2.5 : 1.5,
                  }}
                />
              </span>
              <span
                className="text-[10px] font-semibold relative z-10 transition-all duration-200"
                style={{ color: isActive ? 'var(--navy)' : 'rgba(30,68,92,0.35)' }}
              >
                {label}
              </span>
              {isActive && (
                <span
                  className="absolute bottom-1 w-1 h-1 rounded-full"
                  style={{ background: 'var(--coral)' }}
                />
              )}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
