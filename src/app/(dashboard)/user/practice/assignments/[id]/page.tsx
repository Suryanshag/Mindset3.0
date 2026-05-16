import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import AssignmentResponseSurface from '@/components/dashboard/assignments/assignment-response'
import PageHeader from '@/components/dashboard/page-header'

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

  const isCompleted = assignment.status === 'COMPLETED' || assignment.status === 'SUBMITTED' || assignment.status === 'REVIEWED'
  const response = assignment.responses[0] ?? null

  return (
    <div>
      <PageHeader title={assignment.title} back="/user/practice/assignments" />

      <div className="space-y-3.5 pt-3.5 lg:max-w-[680px] lg:mx-auto">
        <div className="flex items-center gap-2 text-[12px] text-text-muted">
          <span>{assignment.doctor.user.name}</span>
          {assignment.dueDate && (
            <>
              <span>·</span>
              <span>
                Due{' '}
                {assignment.dueDate.toLocaleDateString('en-IN', {
                  weekday: 'short',
                  day: 'numeric',
                  month: 'short',
                })}
              </span>
            </>
          )}
        </div>

      {/* Instructions */}
      {assignment.instructions && (
        <div
          className="bg-bg-card rounded-2xl p-4"
          style={{ border: '1px solid var(--color-border)' }}
        >
          <p className="text-[11px] font-medium text-text-faint uppercase tracking-wider mb-2">
            Instructions
          </p>
          <p className="text-[14px] lg:text-[16px] text-text whitespace-pre-wrap lg:font-serif lg:leading-relaxed">
            {assignment.instructions}
          </p>
        </div>
      )}

      {assignment.description && !assignment.instructions && (
        <div
          className="bg-bg-card rounded-2xl p-4"
          style={{ border: '1px solid var(--color-border)' }}
        >
          <p className="text-[14px] text-text whitespace-pre-wrap">
            {assignment.description}
          </p>
        </div>
      )}

      {/* Response surface or completed state */}
      {isCompleted && response ? (
        <div
          className="bg-primary-tint rounded-2xl p-4"
        >
          <p className="text-[11px] font-medium text-primary uppercase tracking-wider mb-2">
            Your response
          </p>
          {response.responseText && (
            <p className="text-[14px] lg:text-[16px] text-text whitespace-pre-wrap lg:font-serif lg:leading-relaxed">
              {response.responseText}
            </p>
          )}
          <p className="text-[12px] text-text-faint mt-2">
            Completed{' '}
            {response.completedAt.toLocaleDateString('en-IN', {
              day: 'numeric',
              month: 'short',
              year: 'numeric',
            })}
          </p>
        </div>
      ) : assignment.status === 'PENDING' ? (
        <AssignmentResponseSurface
          assignmentId={assignment.id}
          type={assignment.type}
        />
      ) : null}
      </div>
    </div>
  )
}
