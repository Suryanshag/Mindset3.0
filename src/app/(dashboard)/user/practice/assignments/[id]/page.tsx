import { auth } from '@/lib/auth'
import { redirect, notFound } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import AssignmentResponseSurface from '@/components/dashboard/assignments/assignment-response'

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
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/user/practice/assignments" className="p-1">
          <ArrowLeft size={20} className="text-text-muted" />
        </Link>
        <div className="flex-1 min-w-0">
          <h1 className="text-[16px] font-medium text-text line-clamp-1">
            {assignment.title}
          </h1>
          <p className="text-[12px] text-text-faint">
            {assignment.doctor.user.name}
          </p>
        </div>
      </div>

      {assignment.dueDate && (
        <p className="text-[12px] text-text-faint">
          Due{' '}
          {assignment.dueDate.toLocaleDateString('en-IN', {
            weekday: 'short',
            day: 'numeric',
            month: 'short',
          })}
        </p>
      )}

      {/* Instructions */}
      {assignment.instructions && (
        <div
          className="bg-bg-card rounded-2xl p-4"
          style={{ border: '0.5px solid var(--color-border)' }}
        >
          <p className="text-[11px] font-medium text-text-faint uppercase tracking-wider mb-2">
            Instructions
          </p>
          <p className="text-[14px] text-text whitespace-pre-wrap">
            {assignment.instructions}
          </p>
        </div>
      )}

      {assignment.description && !assignment.instructions && (
        <div
          className="bg-bg-card rounded-2xl p-4"
          style={{ border: '0.5px solid var(--color-border)' }}
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
            <p className="text-[14px] text-text whitespace-pre-wrap">
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
  )
}
