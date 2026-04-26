import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ArrowLeft, ClipboardList, BookOpen, FileText, Wind, Wrench } from 'lucide-react'
import AssignmentTabs from '@/components/dashboard/assignments/assignment-tabs'

const TYPE_CONFIG: Record<string, { Icon: typeof BookOpen; color: string; bg: string }> = {
  JOURNAL_PROMPT: { Icon: BookOpen, color: 'text-primary', bg: 'bg-primary-tint' },
  READING: { Icon: FileText, color: 'text-blue-600', bg: 'bg-blue-50' },
  WORKSHEET: { Icon: ClipboardList, color: 'text-amber-600', bg: 'bg-amber-50' },
  BREATHING: { Icon: Wind, color: 'text-purple-600', bg: 'bg-purple-50' },
  CUSTOM: { Icon: Wrench, color: 'text-text-muted', bg: 'bg-bg-app' },
}

export default async function AssignmentsListPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const session = await auth()
  if (!session?.user?.id) redirect('/login')

  const params = await searchParams
  const tab = params.tab === 'completed' ? 'completed' : 'pending'

  const assignments = await prisma.assignment
    .findMany({
      where: {
        userId: session.user.id,
        status: tab === 'pending' ? 'PENDING' : { in: ['COMPLETED', 'SKIPPED', 'SUBMITTED', 'REVIEWED'] },
      },
      include: {
        doctor: { include: { user: { select: { name: true } } } },
      },
      orderBy: tab === 'pending'
        ? [{ dueDate: 'asc' }, { createdAt: 'desc' }]
        : [{ updatedAt: 'desc' }],
    })
    .catch(() => [])

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link href="/user/practice" className="p-1">
          <ArrowLeft size={20} className="text-text-muted" />
        </Link>
        <h1 className="text-[16px] font-medium text-text">Assignments</h1>
      </div>

      <AssignmentTabs currentTab={tab} />

      {assignments.length === 0 ? (
        <div className="flex flex-col items-center py-12">
          <ClipboardList size={28} className="text-text-faint mb-2" />
          <p className="text-[14px] text-text-muted">
            {tab === 'pending'
              ? 'No pending assignments'
              : 'No completed assignments yet'}
          </p>
        </div>
      ) : (
        <div className="space-y-2.5">
          {assignments.map((a) => {
            const cfg = TYPE_CONFIG[a.type] ?? TYPE_CONFIG.CUSTOM
            const isOverdue = a.dueDate && new Date(a.dueDate) < new Date() && a.status === 'PENDING'

            return (
              <Link
                key={a.id}
                href={`/user/practice/assignments/${a.id}`}
                className="flex items-center gap-3 bg-bg-card rounded-2xl p-3.5"
                style={{ border: '0.5px solid var(--color-border)' }}
              >
                <div
                  className={`w-9 h-9 rounded-lg ${cfg.bg} flex items-center justify-center shrink-0`}
                >
                  <cfg.Icon size={16} className={cfg.color} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[14px] font-medium text-text line-clamp-1">
                    {a.title}
                  </p>
                  <p className="text-[12px] text-text-faint">
                    {a.doctor.user.name}
                    {a.dueDate && (
                      <>
                        {' · '}
                        <span className={isOverdue ? 'text-red-500' : ''}>
                          Due{' '}
                          {new Date(a.dueDate).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                          })}
                        </span>
                      </>
                    )}
                  </p>
                </div>
                <div
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    a.status === 'PENDING'
                      ? isOverdue
                        ? 'bg-red-500'
                        : 'bg-amber-400'
                      : a.status === 'COMPLETED'
                        ? 'bg-green-500'
                        : 'bg-gray-300'
                  }`}
                />
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
