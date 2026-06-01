import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import MobileAssignmentsList, {
  type AssignmentListItem,
} from '@/components/mobile/assignments-list'
import BAssignmentsList from '@/components/dashboard/desktop/b-assignments-list'

export default async function AssignmentsListPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const params = await searchParams
  const tab = params.tab === 'completed' ? 'completed' : 'pending'

  // Both tabs are fetched up-front: mobile uses the same data for its
  // client-side tab switch, and the new BAssignmentsList renders both
  // counts in its tab chips.
  const [mobilePending, mobileCompleted] = await Promise.all([
    prisma.assignment
      .findMany({
        where: { userId: session.user.id, status: 'PENDING' },
        include: {
          doctor: { include: { user: { select: { name: true } } } },
        },
        orderBy: [{ dueDate: 'asc' }, { createdAt: 'desc' }],
      })
      .catch(() => []),
    prisma.assignment
      .findMany({
        where: {
          userId: session.user.id,
          status: { in: ['COMPLETED', 'SKIPPED', 'SUBMITTED', 'REVIEWED'] },
        },
        include: {
          doctor: { include: { user: { select: { name: true } } } },
        },
        orderBy: [{ updatedAt: 'desc' }],
        take: 50,
      })
      .catch(() => []),
  ])

  const toMobile = (rows: typeof mobilePending): AssignmentListItem[] =>
    rows.map((a) => ({
      id: a.id,
      type: a.type as AssignmentListItem['type'],
      title: a.title,
      description: a.description,
      instructions: a.instructions,
      status: a.status as AssignmentListItem['status'],
      dueDate: a.dueDate?.toISOString() ?? null,
      therapistName: a.doctor.user.name,
    }))

  return (
    <>
      {/* Mobile — Phase 4 ported assignments list with pill tabs. */}
      <div className="lg:hidden">
        <MobileAssignmentsList
          pending={toMobile(mobilePending)}
          completed={toMobile(mobileCompleted)}
        />
      </div>

      {/* Desktop — Phase 3d Direction B port. */}
      <div className="hidden lg:block">
        <BAssignmentsList
          activeTab={tab}
          open={mobilePending.map((a) => ({
            id: a.id,
            title: a.title,
            type: a.type,
            status: a.status,
            dueDate: a.dueDate,
            doctorName: a.doctor.user.name,
          }))}
          completed={mobileCompleted.map((a) => ({
            id: a.id,
            title: a.title,
            type: a.type,
            status: a.status,
            dueDate: a.dueDate,
            doctorName: a.doctor.user.name,
          }))}
        />
      </div>
    </>
  )
}
