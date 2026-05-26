'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { useSession } from 'next-auth/react'
import { ArrowLeft, Bell } from 'lucide-react'
import ProfileSheet from '@/components/dashboard/doctor/mobile/profile-sheet'

interface Props {
  title: string
  kicker?: string
  /** Optional override; falls back to the next-auth session name. */
  doctorName?: string
  /** When true, renders a back arrow that calls router.back(). */
  showBack?: boolean
  /** Optional element rendered to the left of the bell — e.g. "Mark all read". */
  rightSlot?: React.ReactNode
}

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/)
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
  return name.slice(0, 2).toUpperCase()
}

export default function DoctorMobileTopBar({ title, kicker, doctorName, showBack, rightSlot }: Props) {
  const pathname = usePathname()
  const router = useRouter()
  const { data: authSession } = useSession()
  const resolvedName = doctorName ?? authSession?.user?.name ?? 'Doctor'
  const [unread, setUnread] = useState(0)
  const [profileOpen, setProfileOpen] = useState(false)

  useEffect(() => {
    fetch('/api/doctor/notifications/unread-count')
      .then((r) => r.json())
      .then((d) => { if (d.success) setUnread(d.data.count) })
      .catch(() => {})
  }, [pathname])

  return (
    <header className="lg:hidden flex items-center gap-2.5 px-4 pt-3 pb-2">
      {showBack ? (
        <button
          onClick={() => router.back()}
          aria-label="Back"
          className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
          style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}
        >
          <ArrowLeft size={16} strokeWidth={1.8} style={{ color: 'var(--text)' }} />
        </button>
      ) : (
        <div className="w-9 shrink-0" />
      )}

      <div className="flex-1 min-w-0">
        {kicker && (
          <div
            className="text-[10.5px] font-extrabold uppercase truncate"
            style={{ letterSpacing: '0.12em', color: 'var(--text-muted)' }}
          >
            {kicker}
          </div>
        )}
        <div
          className="ms-display text-[22px] leading-tight truncate"
          style={{ color: 'var(--text)' }}
        >
          {title}
        </div>
      </div>

      {rightSlot}

      <Link
        href="/doctor/notifications"
        aria-label="Notifications"
        className="w-9 h-9 rounded-full flex items-center justify-center relative shrink-0"
        style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}
      >
        <Bell size={16} strokeWidth={1.8} style={{ color: 'var(--text)' }} />
        {unread > 0 && (
          <span
            className="absolute top-[7px] right-[8px] w-[7px] h-[7px] rounded-full"
            style={{
              background: 'var(--accent)',
              border: '1.5px solid var(--bg-card)',
            }}
          />
        )}
      </Link>

      {/* Avatar opens the profile sheet (Sprint 2B). The sheet itself
          shows static "More on desktop" copy — no direct link to the
          desktop-only /doctor/profile page. */}
      <button
        type="button"
        onClick={() => setProfileOpen(true)}
        aria-label="Open profile menu"
        className="w-[34px] h-[34px] rounded-full flex items-center justify-center text-[12px] font-extrabold shrink-0"
        style={{ background: 'var(--accent)', color: 'var(--on-dark, var(--cream))' }}
      >
        {getInitials(resolvedName)}
      </button>

      <ProfileSheet open={profileOpen} onClose={() => setProfileOpen(false)} />
    </header>
  )
}
