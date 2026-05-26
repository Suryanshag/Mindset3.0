'use client'

import {
  Bell,
  Calendar,
  CalendarOff,
  ClipboardList,
  IndianRupee,
} from 'lucide-react'

interface Notification {
  id: string
  kind: string
  title: string
  body: string
  link: string | null
  createdAt: string
  readAt: string | null
}

interface CfgEntry {
  bg: string
  fg: string
  icon: typeof Bell
}

const CFG: Record<string, CfgEntry> = {
  SESSION_BOOKED:            { bg: 'var(--primary-tint)',     fg: 'var(--primary)',     icon: Calendar },
  SESSION_CANCELLED_BY_USER: { bg: 'rgba(170,40,20,0.10)',     fg: '#A53A1F',            icon: CalendarOff },
  ASSIGNMENT_SUBMITTED:      { bg: 'var(--accent-tint)',       fg: 'var(--accent-deep)', icon: ClipboardList },
  EARNING_PAID:              { bg: 'var(--soft-blue)',          fg: 'var(--navy)',        icon: IndianRupee },
}

function ago(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime()
  const min = Math.round(ms / 60000)
  if (min < 1) return 'now'
  if (min < 60) return `${min}m`
  const hr = Math.round(min / 60)
  if (hr < 24) return `${hr}h`
  const d = Math.round(hr / 24)
  if (d < 7) return `${d}d`
  const w = Math.round(d / 7)
  return `${w}w`
}

interface Props {
  notification: Notification
  onClick: () => void
}

export default function NotificationRow({ notification, onClick }: Props) {
  const cfg = CFG[notification.kind] ?? { bg: 'var(--bg-app)', fg: 'var(--text-muted)', icon: Bell }
  const Icon = cfg.icon
  const isUnread = !notification.readAt

  return (
    <button
      onClick={onClick}
      className="w-full text-left flex items-center gap-3 rounded-2xl px-3.5 py-3"
      style={{
        background: 'var(--bg-card)',
        boxShadow: 'var(--shadow-card)',
        borderLeft: `4px solid ${isUnread ? cfg.fg : 'transparent'}`,
        opacity: isUnread ? 1 : 0.7,
      }}
    >
      <div
        className="w-8 h-8 rounded-[10px] flex items-center justify-center shrink-0"
        style={{ background: cfg.bg, color: cfg.fg }}
      >
        <Icon size={16} strokeWidth={1.8} />
      </div>

      <div className="flex-1 min-w-0">
        <div
          className="text-[13.5px] font-bold truncate"
          style={{ color: 'var(--text)' }}
        >
          {notification.title}
        </div>
        <div
          className="text-[11.5px] truncate mt-0.5"
          style={{ color: 'var(--text-muted)' }}
        >
          {notification.body}
        </div>
      </div>

      <div className="text-[11px] shrink-0" style={{ color: 'var(--text-faint)' }}>
        {ago(notification.createdAt)}
      </div>
    </button>
  )
}
