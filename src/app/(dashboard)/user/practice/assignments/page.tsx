import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { ClipboardList, BookOpen, FileText, Wind, Wrench } from 'lucide-react'
import AssignmentTabs from '@/components/dashboard/assignments/assignment-tabs'
import PageHeader from '@/components/dashboard/page-header'

const TYPE_CONFIG: Record<string, { Icon: typeof BookOpen; color: string; bg: string }> = {
  JOURNAL_PROMPT: { Icon: BookOpen, color: 'text-primary', bg: 'bg-primary-tint' },
  READING: { Icon: FileText, color: 'text-[#3B82F6]', bg: 'bg-[#E6F1FB]' },
  WORKSHEET: { Icon: ClipboardList, color: 'text-accent', bg: 'bg-accent-tint' },
  BREATHING: { Icon: Wind, color: 'text-[#7C3AED]', bg: 'bg-purple-tint' },
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
    <div>
      <PageHeader title="Assignments" back="/user/practice" />

      <div className="space-y-3.5 pt-3.5">
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
          <div className="space-y-2">
            {assignments.map((a) => {
              const cfg = TYPE_CONFIG[a.type] ?? TYPE_CONFIG.CUSTOM
              const isOverdue = a.dueDate && new Date(a.dueDate) < new Date() && a.status === 'PENDING'

              return (
                <Link
                  key={a.id}
                  href={`/user/practice/assignments/${a.id}`}
                  className="flex items-center gap-3 bg-bg-card rounded-2xl py-3 px-3.5"
                  style={{ border: '0.5px solid var(--color-border)' }}
                >
                  <div
                    className={`w-9 h-9 rounded-xl ${cfg.bg} flex items-center justify-center shrink-0`}
                  >
                    <cfg.Icon size={16} className={cfg.color} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[15px] font-medium text-text line-clamp-1">
                      {a.title}
                    </p>
                    <p className="text-[12px] text-text-muted">
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
                          : 'bg-primary-tint'
                        : 'bg-transparent'
                    }`}
                  />
                </Link>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
