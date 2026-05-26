import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import NotificationList from '@/components/dashboard/notification-list'
import DoctorNotificationsMobile from './notifications-mobile'

export default async function DoctorNotificationsPage() {
  const session = await auth()
  if (!session?.user) redirect('/login')

  const role = session.user.role as string
  if (role !== 'DOCTOR' && role !== 'ADMIN') redirect('/')

  const notifications = await prisma.notification.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: 'desc' },
    take: 50,
  })

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
      {/* ═══ Mobile ═══ */}
      <div className="lg:hidden">
        <DoctorNotificationsMobile notifications={serialized} />
      </div>

      {/* ═══ Desktop (unchanged) ═══ */}
      <div className="hidden lg:block p-4 lg:p-8 max-w-3xl mx-auto">
        <NotificationList
          notifications={serialized}
          hasUnread={serialized.some((n) => !n.readAt)}
        />
      </div>
    </>
  )
}
