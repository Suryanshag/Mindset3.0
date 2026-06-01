import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import MobilePractice from '@/components/mobile/practice'
import BPractice from '@/components/dashboard/desktop/b-practice'
import { decryptField } from '@/lib/encryption'

export default async function PracticeHubPage() {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const userId = session.user.id

  const [
    latestEntry,
    pendingCount,
    completedCount,
    totalEntries,
    recentEntries,
    pendingAssignments,
  ] = await Promise.all([
    prisma.journalEntry
      .findFirst({ where: { userId }, orderBy: { entryDate: 'desc' }, select: { entryDate: true } })
      .catch(() => null),
    prisma.assignment.count({ where: { userId, status: 'PENDING' } }).catch(() => 0),
    prisma.assignment
      .count({
        where: {
          userId,
          status: { in: ['COMPLETED', 'SUBMITTED', 'REVIEWED'] },
        },
      })
      .catch(() => 0),
    prisma.journalEntry.count({ where: { userId, isDraft: false } }).catch(() => 0),
    prisma.journalEntry
      .findMany({
        where: { userId, isDraft: false },
        orderBy: { entryDate: 'desc' },
        take: 4,
        select: {
          id: true,
          titleEncrypted: true,
          bodyEncrypted: true,
          mood: true,
          entryDate: true,
        },
      })
      .then((rows) =>
        rows.map((r) => ({
          id: r.id,
          title: decryptField(r.titleEncrypted),
          body: decryptField(r.bodyEncrypted) ?? '',
          mood: r.mood,
          entryDate: r.entryDate,
        })),
      )
      .catch(
        () =>
          [] as {
            id: string
            title: string | null
            body: string
            mood: number | null
            entryDate: Date
          }[],
      ),
    prisma.assignment
      .findMany({
        where: { userId, status: 'PENDING' },
        orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
        take: 3,
        include: { doctor: { include: { user: { select: { name: true } } } } },
      })
      .catch(() => []),
  ])

  const lastEntryDays = latestEntry
    ? Math.max(0, Math.floor((Date.now() - latestEntry.entryDate.getTime()) / 86400000))
    : null

  return (
    <>
      {/* Mobile — Phase 4 ported Practice hub. */}
      <div className="lg:hidden">
        <MobilePractice
          lastEntryDays={lastEntryDays}
          pendingAssignments={pendingCount}
        />
      </div>

      {/* Desktop — Phase 3d Direction B port. */}
      <div className="hidden lg:block">
        <BPractice
          openAssignments={pendingAssignments.map((a) => ({
            id: a.id,
            title: a.title,
            type: a.type,
            dueDate: a.dueDate,
            doctorName: a.doctor.user.name,
          }))}
          completedAssignmentsCount={completedCount}
          recentEntries={recentEntries}
          totalEntries={totalEntries}
          privateEntriesCount={totalEntries}
        />
      </div>
    </>
  )
}
