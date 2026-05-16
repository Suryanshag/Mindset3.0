'use client'

import { useRouter } from 'next/navigation'
import { useTransition } from 'react'
import {
  CalendarDays,
  Users,
  Package,
  Star,
  Bell,
} from 'lucide-react'
import { markNotificationRead, markAllNotificationsRead } from '@/lib/actions/notifications'

type Notification = {
  id: string
  kind: string
  title: string
  body: string
  link: string | null
  createdAt: string
  readAt: string | null
}

type Props = {
  notifications: Notification[]
  hasUnread: boolean
}

const kindIcons: Record<string, typeof Bell> = {
  SESSION_REMINDER: CalendarDays,
  WORKSHOP: Users,
  ORDER: Package,
  REVIEW_PROMPT: Star,
  SYSTEM: Bell,
}

function relativeDay(iso: string): string {
  const d = new Date(iso)
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate())
  const diff = Math.round(
    (startOfToday.getTime() - startOfDay.getTime()) / (1000 * 60 * 60 * 24)
  )

  if (diff === 0) return 'Today'
  if (diff === 1) return 'Yesterday'
  if (diff < 7) return 'This week'
  return 'Earlier'
}

function groupByDay(items: Notification[]): [string, Notification[]][] {
  const groups: Map<string, Notification[]> = new Map()
  for (const n of items) {
    const label = relativeDay(n.createdAt)
    const group = groups.get(label) ?? []
    group.push(n)
    groups.set(label, group)
  }
  return Array.from(groups.entries())
}

export default function NotificationList({ notifications, hasUnread }: Props) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function handleTap(n: Notification) {
    startTransition(async () => {
      if (!n.readAt) {
        await markNotificationRead(n.id)
      }
      if (n.link) {
        router.push(n.link)
      }
    })
  }

  function handleMarkAllRead() {
    startTransition(async () => {
      await markAllNotificationsRead()
    })
  }

  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Bell size={32} className="text-text-faint mb-3" />
        <p className="text-[14px] font-medium text-text">You're all caught up</p>
        <p className="text-[12px] text-text-muted mt-1">No notifications yet</p>
      </div>
    )
  }

  const grouped = groupByDay(notifications)

  return (
    <div>
      {/* Header row */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-[16px] font-medium text-text">Notifications</h1>
        {hasUnread && (
          <button
            onClick={handleMarkAllRead}
            disabled={isPending}
            className="text-[12px] font-medium text-primary disabled:opacity-50"
          >
            Mark all read
          </button>
        )}
      </div>

      {grouped.map(([label, items]) => (
        <div key={label} className="mb-4">
          <p className="text-[11px] font-medium text-text-faint uppercase tracking-wider mb-2">
            {label}
          </p>
          <div className="space-y-1.5">
            {items.map((n) => {
              const Icon = kindIcons[n.kind] ?? Bell
              const isUnread = !n.readAt

              return (
                <button
                  key={n.id}
                  onClick={() => handleTap(n)}
                  className="flex items-start gap-3 w-full text-left rounded-2xl p-3 transition-colors active:bg-bg-app"
                  style={{ border: '1px solid var(--color-border)' }}
                >
                  {/* Unread dot */}
                  <div className="flex flex-col items-center pt-1.5 shrink-0 w-2">
                    {isUnread && (
                      <span className="w-2 h-2 rounded-full bg-primary" />
                    )}
                  </div>

                  <div className="w-8 h-8 rounded-full bg-primary-tint flex items-center justify-center shrink-0">
                    <Icon size={14} className="text-primary" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-[13px] leading-tight truncate ${
                        isUnread ? 'font-medium text-text' : 'text-text-muted'
                      }`}
                    >
                      {n.title}
                    </p>
                    <p className="text-[12px] text-text-faint mt-0.5 line-clamp-2">
                      {n.body}
                    </p>
                    <p className="text-[10px] text-text-faint mt-1">
                      {new Date(n.createdAt).toLocaleString('en-US', {
                        hour: 'numeric',
                        minute: '2-digit',
                        hour12: true,
                      })}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}
