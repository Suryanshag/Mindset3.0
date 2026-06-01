import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import MobileAssignmentDetail, {
  type AssignmentDetailItem,
} from '@/components/mobile/assignment-detail'
import BAssignmentDetail from '@/components/dashboard/desktop/b-assignment-detail'

export default async function AssignmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const assignment = await prisma.assignment.findFirst({
    where: { id, userId: session.user.id },
    include: {
      doctor: { include: { user: { select: { name: true } } } },
      responses: {
        orderBy: { completedAt: 'desc' },
        take: 1,
      },
    },
  })

  if (!assignment) notFound()

  const response = assignment.responses[0] ?? null

  const mobileItem: AssignmentDetailItem = {
    id: assignment.id,
    type: assignment.type as AssignmentDetailItem['type'],
    title: assignment.title,
    description: assignment.description,
    instructions: assignment.instructions,
    status: assignment.status as AssignmentDetailItem['status'],
    dueDate: assignment.dueDate?.toISOString() ?? null,
    therapistName: assignment.doctor.user.name,
    responseText: response?.responseText ?? null,
    responseCompletedAt: response?.completedAt.toISOString() ?? null,
  }

  return (
    <>
      {/* Mobile — Phase 4 ported assignment detail with type-specific
          completion zone. */}
      <div className="lg:hidden">
        <MobileAssignmentDetail a={mobileItem} />
      </div>

      {/* Desktop — Phase 3d Direction B port. */}
      <div className="hidden lg:block">
        <BAssignmentDetail
          assignment={{
            id: assignment.id,
            title: assignment.title,
            description: assignment.description,
            instructions: assignment.instructions,
            type: assignment.type,
            status: assignment.status,
            dueDate: assignment.dueDate,
            createdAt: assignment.createdAt,
            doctor: { user: { name: assignment.doctor.user.name } },
          }}
          response={
            response
              ? { responseText: response.responseText, completedAt: response.completedAt }
              : null
          }
        />
      </div>
    </>
  )
}
