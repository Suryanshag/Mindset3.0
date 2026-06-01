import Link from 'next/link'
import { BCap, BCard, BChip } from './b-atoms'
import BPageHeader from './b-page-header'

// Phase 3d — Assignments index (Direction B port).
// Server component: receives pre-fetched open + completed lists.
// The existing `?tab=` URL param is preserved by linking the filter
// chips back to the same route with the param set, so the page-level
// query is unchanged.

type Assignment = {
  id: string
  title: string
  type: string
  status: string
  dueDate: Date | null
  doctorName: string
}

type Props = {
  open: Assignment[]
  completed: Assignment[]
  activeTab: 'pending' | 'completed'
}

const TYPE_CHIP: Record<string, 'journal' | 'breath' | 'workshop' | 'neutral'> = {
  JOURNAL_PROMPT: 'journal',
  READING: 'neutral',
  WORKSHEET: 'workshop',
  BREATHING: 'breath',
  CUSTOM: 'neutral',
}

export default function BAssignmentsList({ open, completed, activeTab }: Props) {
  const nextDue = open
    .filter((a) => a.dueDate)
    .sort((a, b) => (a.dueDate!.getTime() - b.dueDate!.getTime()))[0]
  const nextDueLabel = nextDue?.dueDate
    ? `NEXT DEADLINE · ${nextDue.dueDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase()}`
    : null

  const sub = `${open.length} open · ${completed.length} completed`

  return (
    <>
      <BPageHeader
        title="Assignments from your therapist."
        breadcrumb={[
          { label: 'PRACTICE', href: '/user/practice' },
          { label: 'ASSIGNMENTS' },
        ]}
        back="/user/practice"
        sub={sub}
        ctas={['search']}
      />

      {/* Tab chips */}
      <div className="flex items-center gap-2">
        <Link
          href="/user/practice/assignments"
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 12,
            padding: '6px 12px',
            borderRadius: 999,
            background: activeTab === 'pending' ? 'var(--ink)' : 'transparent',
            color: activeTab === 'pending' ? '#fff' : 'var(--text-muted)',
            border: activeTab === 'pending' ? 'none' : '1px solid var(--border)',
          }}
        >
          Open{' '}
          <span style={{ opacity: 0.65, fontFamily: 'var(--font-mono)', fontSize: 10 }}>
            · {open.length}
          </span>
        </Link>
        <Link
          href="/user/practice/assignments?tab=completed"
          style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 12,
            padding: '6px 12px',
            borderRadius: 999,
            background: activeTab === 'completed' ? 'var(--ink)' : 'transparent',
            color: activeTab === 'completed' ? '#fff' : 'var(--text-muted)',
            border: activeTab === 'completed' ? 'none' : '1px solid var(--border)',
          }}
        >
          Completed{' '}
          <span style={{ opacity: 0.65, fontFamily: 'var(--font-mono)', fontSize: 10 }}>
            · {completed.length}
          </span>
        </Link>
        <div style={{ flex: 1 }} />
        {activeTab === 'pending' && nextDueLabel && (
          <span style={{ fontFamily: 'var(--font-mono)', fontSize: 10.5, color: 'var(--text-faint)' }}>
            {nextDueLabel}
          </span>
        )}
      </div>

      {/* Open list */}
      {activeTab === 'pending' && (
        <div>
          <BCap>Open</BCap>
          <BCard padding={0} style={{ overflow: 'hidden', marginTop: 10 }}>
            {open.length === 0 ? (
              <p
                style={{
                  padding: '40px 24px',
                  textAlign: 'center',
                  fontFamily: 'var(--font-serif)',
                  fontStyle: 'italic',
                  fontSize: 13.5,
                  color: 'var(--text-muted)',
                }}
              >
                No open assignments — well-paced.
              </p>
            ) : (
              open.map((a, i) => <OpenRow key={a.id} a={a} first={i === 0} />)
            )}
          </BCard>
        </div>
      )}

      {/* Completed list */}
      {activeTab === 'completed' && (
        <div>
          <BCap>Completed · most recent</BCap>
          <BCard padding={0} style={{ overflow: 'hidden', marginTop: 10 }}>
            {completed.length === 0 ? (
              <p
                style={{
                  padding: '40px 24px',
                  textAlign: 'center',
                  fontFamily: 'var(--font-serif)',
                  fontStyle: 'italic',
                  fontSize: 13.5,
                  color: 'var(--text-muted)',
                }}
              >
                No completed assignments yet.
              </p>
            ) : (
              completed.map((a, i) => <DoneRow key={a.id} a={a} first={i === 0} />)
            )}
          </BCard>
        </div>
      )}

      <p
        style={{
          fontFamily: 'var(--font-serif)',
          fontStyle: 'italic',
          fontSize: 13,
          color: 'var(--text-faint)',
          textAlign: 'center',
          marginTop: 4,
        }}
      >
        Skipped assignments aren&rsquo;t lost. Your therapist can see them on
        their side, gently.
      </p>
    </>
  )
}

function OpenRow({ a, first }: { a: Assignment; first: boolean }) {
  const chipKind = TYPE_CHIP[a.type] ?? 'neutral'
  const isOverdue = a.dueDate && a.dueDate < new Date()
  return (
    <Link
      href={`/user/practice/assignments/${a.id}`}
      style={{
        display: 'grid',
        gridTemplateColumns: '120px 1fr 160px 90px',
        gap: 16,
        padding: '16px 20px',
        alignItems: 'center',
        borderTop: first ? 'none' : '1px solid var(--border)',
      }}
    >
      <BChip kind={chipKind}>{a.type.replace('_', ' ')}</BChip>
      <div>
        <div
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 15,
            color: 'var(--text)',
            lineHeight: 1.4,
          }}
        >
          {a.title}
        </div>
        <div style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 4 }}>
          From {a.doctorName}
        </div>
      </div>
      <div>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: isOverdue ? 'var(--accent-deep)' : 'var(--accent)',
          }}
        >
          {a.dueDate
            ? `${isOverdue ? 'OVERDUE · ' : 'DUE '}${a.dueDate
                .toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })
                .toUpperCase()}`
            : 'NO DUE DATE'}
        </div>
      </div>
      <span
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 12,
          color: 'var(--primary)',
          textAlign: 'right',
        }}
      >
        Open ›
      </span>
    </Link>
  )
}

function DoneRow({ a, first }: { a: Assignment; first: boolean }) {
  return (
    <Link
      href={`/user/practice/assignments/${a.id}`}
      style={{
        display: 'grid',
        gridTemplateColumns: '100px 1fr 130px 24px',
        gap: 16,
        padding: '11px 20px',
        alignItems: 'center',
        borderTop: first ? 'none' : '1px solid var(--border)',
      }}
    >
      <BChip kind="neutral">{a.type.replace('_', ' ')}</BChip>
      <div style={{ fontSize: 13.5, color: 'var(--text-muted)' }}>{a.title}</div>
      <div style={{ fontSize: 11.5, color: 'var(--text-faint)' }}>From {a.doctorName}</div>
      <span style={{ color: 'var(--text-muted)' }}>›</span>
    </Link>
  )
}
