import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/lib/prisma'
import NotificationList from '@/components/dashboard/notification-list'

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
  if (hasUnread) {
    await prisma.notification.updateMany({
      where: { userId: session.user.id, readAt: null },
      data: { readAt: new Date() },
    })
    // Invalidate /user so the next render of the spine bell badge sees the
    // updated readAt values and returns 0. The cached getUnreadNotificationCount
    // is per-request React.cache, but Next.js's segment cache can hold the
    // /user output longer — revalidatePath flushes it.
    revalidatePath('/user')
    revalidatePath('/user/notifications')
  }

  return (
    <NotificationList
      notifications={notifications.map((n) => ({
        id: n.id,
        kind: n.kind,
        title: n.title,
        body: n.body,
        link: n.link,
        createdAt: n.createdAt.toISOString(),
        readAt: n.readAt?.toISOString() ?? null,
      }))}
      hasUnread={hasUnread}
    />
  )
}
