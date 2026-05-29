import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import NotificationList from '@/components/dashboard/notification-list'
import MobileNotifications from '@/components/mobile/notifications'

export default async function NotificationsPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  // Snapshot for rendering — captured BEFORE the mark-as-read mutation so the
  // user can still see which notifications were unread on this visit (green
  // dot). On the next navigation, getUnreadNotificationCount runs fresh and
  // the spine bell badge clears.
  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

  const hasUnread = notifications.some((n) => !n.readAt)

  // Mark all unread as read after the snapshot is captured. updateMany is a
  // no-op (0 rows affected) when nothing is unread, so this is cheap to run
  // on every visit. Sprint Pre-Launch H2.
  //
  // No revalidatePath() here: it would run during this Server Component's
  // render, which Next 16 forbids ("revalidatePath during render is
  // unsupported") — that threw and dropped users on the error page when they
  // opened notifications with anything unread. The dashboard is dynamic
  // (auth-gated) and getUnreadNotificationCount is a per-request cache(), so
  // the bell badge recomputes to 0 on the next navigation without a flush.
  if (hasUnread) {
    await prisma.notification.updateMany({
      where: { userId: session.user.id, readAt: null },
      data: { readAt: new Date() },
    })
  }

  const serialized = notifications.map((n) => ({
    id: n.id,
    kind: n.kind,
    title: n.title,
    body: n.body,
    link: n.link,
    createdAt: n.createdAt.toISOString(),
    readAt: n.readAt?.toISOString() ?? null,
  }))

  return (
    <>
      <div className="lg:hidden">
        <MobileNotifications
          notifications={serialized}
          hasUnreadOnLoad={hasUnread}
        />
      </div>
      <div className="hidden lg:block">
        <NotificationList notifications={serialized} hasUnread={hasUnread} />
      </div>
    </>
  )
}
