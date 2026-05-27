'use client'

import { useRouter } from 'next/navigation'
import { useTransition, useState } from 'react'
import DoctorMobileTopBar from '@/components/dashboard/doctor/mobile-top-bar'
import NotificationRow from '@/components/dashboard/doctor/mobile/notification-row'
import {
  markNotificationRead,
  markAllNotificationsRead,
} from '@/lib/actions/notifications'
import { startOfDayIST } from '@/lib/format-date'

interface Notification {
  id: string
  kind: string
  title: string
  body: string
  link: string | null
  createdAt: string
  readAt: string | null
}

type GroupKey = 'today' | 'yesterday' | 'week' | 'earlier'

const GROUP_LABELS: Record<GroupKey, string> = {
  today: 'Today',
  yesterday: 'Yesterday',
  week: 'This week',
  earlier: 'Earlier',
}

function groupOf(iso: string): GroupKey {
  const d = new Date(iso)
  // IST boundaries — server-rendered timestamps would otherwise group
  // late-evening notifications under "Yesterday" while the user reads
  // them in the following IST day.
  const startOfToday = startOfDayIST(new Date()).getTime()
  const startOfYesterday = startOfToday - 24 * 60 * 60 * 1000
  const sevenDaysAgo = startOfToday - 7 * 24 * 60 * 60 * 1000
  const t = d.getTime()
  if (t >= startOfToday) return 'today'
  if (t >= startOfYesterday) return 'yesterday'
  if (t >= sevenDaysAgo) return 'week'
  return 'earlier'
}

interface Props {
  notifications: Notification[]
}

export default function DoctorNotificationsMobile({ notifications: initial }: Props) {
  const router = useRouter()
  const [items, setItems] = useState(initial)
  const [isPending, startTransition] = useTransition()
  const unreadCount = items.filter((n) => !n.readAt).length

  const grouped: Record<GroupKey, Notification[]> = {
    today: [], yesterday: [], week: [], earlier: [],
  }
  for (const n of items) grouped[groupOf(n.createdAt)].push(n)
  const orderedGroups: GroupKey[] = ['today', 'yesterday', 'week', 'earlier']

  function handleTap(n: Notification) {
    // Optimistic mark-as-read for instant feedback; revalidatePath in
    // the server action keeps cache truth.
    setItems((prev) => prev.map((x) => x.id === n.id && !x.readAt ? { ...x, readAt: new Date().toISOString() } : x))
    startTransition(async () => {
      if (!n.readAt) {
        await markNotificationRead(n.id)
      }
      if (n.link) router.push(n.link)
    })
  }

  function handleMarkAll() {
    setItems((prev) => prev.map((x) => x.readAt ? x : { ...x, readAt: new Date().toISOString() }))
    startTransition(async () => {
      await markAllNotificationsRead()
    })
  }

  const markAllSlot = unreadCount > 0 ? (
    <button
      onClick={handleMarkAll}
      disabled={isPending}
      className="text-[11.5px] font-extrabold px-2.5 py-1.5 disabled:opacity-50"
      style={{ color: 'var(--primary)' }}
    >
      Mark all read
    </button>
  ) : null

  return (
    <div>
      <DoctorMobileTopBar showBack title="Notifications" rightSlot={markAllSlot} />

      {items.length === 0 ? (
        <section className="px-4 pt-4">
          <div
            className="text-center rounded-[18px]"
            style={{
              background: 'var(--bg-card)',
              boxShadow: 'var(--shadow-card)',
              padding: '40px 24px',
            }}
          >
            <div className="ms-display text-[18px]" style={{ color: 'var(--text)' }}>
              You&apos;re all caught up.
            </div>
            <p className="ms-serif italic mt-2 text-[13.5px]" style={{ color: 'var(--text-muted)' }}>
              We&apos;ll let you know when something needs your attention.
            </p>
          </div>
        </section>
      ) : (
        <div className="px-4 pt-1">
          {orderedGroups.map((g) => {
            const list = grouped[g]
            if (list.length === 0) return null
            return (
              <section key={g}>
                <div
                  className="text-[10.5px] font-extrabold uppercase mt-4 mb-2 px-1.5"
                  style={{ letterSpacing: '0.14em', color: 'var(--text-muted)' }}
                >
                  {GROUP_LABELS[g]}
                </div>
                <div className="grid gap-1.5">
                  {list.map((n) => (
                    <NotificationRow
                      key={n.id}
                      notification={n}
                      onClick={() => handleTap(n)}
                    />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      )}
    </div>
  )
}
