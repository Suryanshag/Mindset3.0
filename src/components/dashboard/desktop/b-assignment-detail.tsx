import { BCap, BCard, BChip } from './b-atoms'
import BPageHeader from './b-page-header'
import AssignmentResponseSurface from '@/components/dashboard/assignments/assignment-response'

// Phase 3d — Single assignment detail (Direction B port).
// Server wrapper, lifts the existing AssignmentResponseSurface client
// component for the response zone so behaviour is preserved.

type Props = {
  assignment: {
    id: string
    title: string
    description: string | null
    instructions: string
    type: string
    status: string
    dueDate: Date | null
    createdAt: Date
    doctor: { user: { name: string } }
  }
  response: { responseText: string | null; completedAt: Date } | null
}

const TYPE_CHIP: Record<string, 'journal' | 'breath' | 'workshop' | 'neutral'> = {
  JOURNAL_PROMPT: 'journal',
  READING: 'neutral',
  WORKSHEET: 'workshop',
  BREATHING: 'breath',
  CUSTOM: 'neutral',
}

export default function BAssignmentDetail({ assignment, response }: Props) {
  const isCompleted =
    assignment.status === 'COMPLETED' ||
    assignment.status === 'SUBMITTED' ||
    assignment.status === 'REVIEWED'

  const chipKind = TYPE_CHIP[assignment.type] ?? 'neutral'
  const breadcrumbTitle = assignment.title.slice(0, 36).toUpperCase()
  const breadcrumb = [
    { label: 'PRACTICE', href: '/user/practice' },
    { label: 'ASSIGNMENTS', href: '/user/practice/assignments' },
    { label: breadcrumbTitle },
  ]

  const dueDays = assignment.dueDate
    ? Math.ceil((assignment.dueDate.getTime() - Date.now()) / 86400000)
    : null
  const dueLabel = dueDays === null
    ? null
    : dueDays < 0
      ? `${Math.abs(dueDays)} DAY${Math.abs(dueDays) === 1 ? '' : 'S'} OVERDUE`
      : dueDays === 0
        ? 'DUE TODAY'
        : `DUE IN ${dueDays} DAY${dueDays === 1 ? '' : 'S'}`

  const sub = `From ${assignment.doctor.user.name} · assigned ${assignment.createdAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}${assignment.dueDate ? ` · due ${assignment.dueDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}` : ''}`

  return (
    <>
      <BPageHeader title={assignment.title} breadcrumb={breadcrumb} back="/user/practice/assignments" sub={sub} ctas={['search']} />

      {/* Status row */}
      <div className="flex gap-2 items-center">
        <BChip kind={chipKind}>{assignment.type.replace('_', ' ')}</BChip>
        {dueLabel && !isCompleted && <BChip kind="accent">{dueLabel}</BChip>}
        {isCompleted && <BChip kind="primary">COMPLETED</BChip>}
        <span
          style={{ fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-faint)' }}
        >
          PRIVATE BY DEFAULT
        </span>
      </div>

      {/* 2-col grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 20 }}>
        {/* LEFT — instructions */}
        <BCard>
          <BCap>The prompt</BCap>
          <div
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 18,
              color: 'var(--text)',
              marginTop: 12,
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap',
            }}
          >
            {assignment.instructions || assignment.description || assignment.title}
          </div>
          {assignment.description && assignment.instructions && (
            <p
              style={{
                fontFamily: 'var(--font-serif)',
                fontStyle: 'italic',
                fontSize: 14,
                color: 'var(--text-muted)',
                marginTop: 16,
                lineHeight: 1.65,
                whiteSpace: 'pre-wrap',
              }}
            >
              {assignment.description}
            </p>
          )}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              marginTop: 16,
              fontSize: 12,
              color: 'var(--text-muted)',
            }}
          >
            From {assignment.doctor.user.name} · {assignment.createdAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
          </div>
        </BCard>

        {/* RIGHT — progress + response */}
        <div className="flex flex-col gap-3.5">
          <BCard>
            <BCap>Your progress</BCap>
            <div className="flex items-center gap-3 mt-2.5">
              <div
                style={{
                  flex: 1,
                  height: 6,
                  background: 'var(--primary-tint)',
                  borderRadius: 3,
                  overflow: 'hidden',
                }}
              >
                <div
                  style={{
                    width: isCompleted ? '100%' : '0%',
                    height: '100%',
                    background: 'var(--primary)',
                  }}
                />
              </div>
              <span
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 11,
                  color: 'var(--text-muted)',
                }}
              >
                {isCompleted ? 'DONE' : 'NOT STARTED'}
              </span>
            </div>
            {!isCompleted && (
              <p
                style={{
                  fontFamily: 'var(--font-serif)',
                  fontStyle: 'italic',
                  fontSize: 12.5,
                  color: 'var(--text-faint)',
                  marginTop: 12,
                }}
              >
                You can save and come back. Nothing leaves your account unless
                you choose.
              </p>
            )}
          </BCard>

          {isCompleted && response ? (
            <BCard accent="var(--primary)">
              <BCap style={{ color: 'var(--primary)' }}>Your response</BCap>
              {response.responseText && (
                <p
                  style={{
                    fontFamily: 'var(--font-serif)',
                    fontSize: 14.5,
                    color: 'var(--text)',
                    marginTop: 10,
                    lineHeight: 1.7,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {response.responseText}
                </p>
              )}
              <p
                style={{
                  fontFamily: 'var(--font-mono)',
                  fontSize: 10.5,
                  color: 'var(--text-faint)',
                  marginTop: 12,
                }}
              >
                COMPLETED {response.completedAt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).toUpperCase()}
              </p>
            </BCard>
          ) : assignment.status === 'PENDING' ? (
            <BCard>
              <BCap>Respond</BCap>
              <div className="mt-3">
                <AssignmentResponseSurface
                  assignmentId={assignment.id}
                  type={assignment.type}
                />
              </div>
            </BCard>
          ) : null}
        </div>
      </div>
    </>
  )
}
