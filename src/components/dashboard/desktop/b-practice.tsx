import Link from 'next/link'
import { BCap, BCard, BChip } from './b-atoms'
import BPageHeader from './b-page-header'

// Phase 3d — Practice hub (Direction B port).
// Two lanes: open assignments at the top + recent journal entries below.
// Server component — receives shaped data props from the page.

type Assignment = {
  id: string
  title: string
  type: string
  dueDate: Date | null
  doctorName: string
}

type Entry = {
  id: string
  title: string | null
  body: string
  mood: number | null
  entryDate: Date
}

type Props = {
  openAssignments: Assignment[]
  completedAssignmentsCount: number
  recentEntries: Entry[]
  totalEntries: number
  privateEntriesCount: number
}

const TYPE_CHIP: Record<string, 'journal' | 'breath' | 'workshop' | 'neutral'> = {
  JOURNAL_PROMPT: 'journal',
  READING: 'neutral',
  WORKSHEET: 'workshop',
  BREATHING: 'breath',
  CUSTOM: 'neutral',
}

export default function BPractice({
  openAssignments,
  completedAssignmentsCount,
  recentEntries,
  totalEntries,
  privateEntriesCount,
}: Props) {
  return (
    <>
      <BPageHeader
        title="Practice"
        sub="Assignments from your therapist · your own journal · between-session work"
        ctas={['search', 'write']}
      />

      {/* Assignments lane */}
      <div>
        <div className="flex items-baseline justify-between mb-3">
          <div
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 17,
              fontWeight: 500,
              color: 'var(--text)',
            }}
          >
            From your therapist
          </div>
          <div className="flex gap-1.5">
            <span
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 11,
                padding: '5px 10px',
                borderRadius: 999,
                background: 'var(--ink)',
                color: '#fff',
              }}
            >
              Open · {openAssignments.length}
            </span>
            <Link
              href="/user/practice/assignments?tab=completed"
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 11,
                padding: '5px 10px',
                borderRadius: 999,
                background: 'transparent',
                color: 'var(--text-muted)',
                border: '1px solid var(--border)',
              }}
            >
              Done · {completedAssignmentsCount}
            </Link>
          </div>
        </div>

        {openAssignments.length === 0 ? (
          <BCard style={{ textAlign: 'center', padding: '40px 24px' }}>
            <p
              style={{
                fontFamily: 'var(--font-serif)',
                fontStyle: 'italic',
                fontSize: 13.5,
                color: 'var(--text-muted)',
              }}
            >
              No open assignments — well-paced.
            </p>
          </BCard>
        ) : (
          <div className="grid grid-cols-3 gap-3">
            {openAssignments.slice(0, 3).map((a, i) => (
              <AssignmentTile key={a.id} a={a} accent={i === 0} />
            ))}
          </div>
        )}
      </div>

      {/* Journal lane */}
      <div>
        <div className="flex items-baseline justify-between mb-3">
          <div
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 17,
              fontWeight: 500,
              color: 'var(--text)',
            }}
          >
            Your journal
          </div>
          <div className="flex gap-3 items-center">
            <span
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10.5,
                color: 'var(--text-faint)',
              }}
            >
              {totalEntries} ENTRIES · {privateEntriesCount} PRIVATE
            </span>
            <Link
              href="/user/practice/journal/new"
              style={{
                fontFamily: 'var(--font-heading)',
                fontSize: 12,
                padding: '7px 12px',
                borderRadius: 999,
                background: 'var(--primary)',
                color: '#fff',
                fontWeight: 500,
              }}
            >
              New entry +
            </Link>
          </div>
        </div>

        {recentEntries.length === 0 ? (
          <BCard style={{ textAlign: 'center', padding: '40px 24px' }}>
            <p
              style={{
                fontFamily: 'var(--font-serif)',
                fontStyle: 'italic',
                fontSize: 13.5,
                color: 'var(--text-muted)',
              }}
            >
              Nothing written yet. Start when you&rsquo;re ready.
            </p>
          </BCard>
        ) : (
          <BCard padding={0} style={{ overflow: 'hidden' }}>
            {recentEntries.slice(0, 4).map((e, i) => (
              <JournalRow key={e.id} entry={e} first={i === 0} />
            ))}
          </BCard>
        )}

        {totalEntries > recentEntries.length && (
          <Link
            href="/user/practice/journal"
            style={{
              display: 'inline-block',
              marginTop: 10,
              fontFamily: 'var(--font-heading)',
              fontSize: 12.5,
              color: 'var(--primary)',
            }}
          >
            View all {totalEntries} entries ›
          </Link>
        )}
      </div>
    </>
  )
}

function AssignmentTile({ a, accent }: { a: Assignment; accent: boolean }) {
  const chipKind = TYPE_CHIP[a.type] ?? 'neutral'
  const dueLabel = a.dueDate
    ? `DUE ${a.dueDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase()}`
    : 'NO DUE DATE'

  return (
    <BCard accent={accent ? 'var(--accent)' : undefined}>
      <div className="flex items-baseline justify-between">
        <BChip kind={chipKind}>{a.type.replace('_', ' ')}</BChip>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10,
            color: accent ? 'var(--accent)' : 'var(--text-muted)',
          }}
        >
          {dueLabel}
        </span>
      </div>
      <p
        style={{
          fontFamily: 'var(--font-serif)',
          fontSize: 16,
          color: 'var(--text)',
          marginTop: 10,
          lineHeight: 1.4,
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
        }}
      >
        {a.title}
      </p>
      <p style={{ fontSize: 11.5, color: 'var(--text-muted)', marginTop: 8 }}>
        From {a.doctorName}
      </p>
      <Link
        href={`/user/practice/assignments/${a.id}`}
        style={{
          fontFamily: 'var(--font-heading)',
          fontSize: 12.5,
          marginTop: 12,
          padding: '8px 14px',
          borderRadius: 999,
          background: 'var(--primary)',
          color: '#fff',
          display: 'inline-block',
          fontWeight: 500,
        }}
      >
        Begin ›
      </Link>
    </BCard>
  )
}

function JournalRow({ entry, first }: { entry: Entry; first: boolean }) {
  const dateLabel = `${entry.entryDate.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }).toUpperCase()}`
  const timeLabel = entry.entryDate.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  })
  const moodLabel = entry.mood ? `${entry.mood}/5` : null

  return (
    <Link
      href={`/user/practice/journal/${entry.id}`}
      style={{
        display: 'grid',
        gridTemplateColumns: '170px 1fr 24px',
        gap: 18,
        padding: '14px 18px',
        alignItems: 'flex-start',
        borderTop: first ? 'none' : '1px solid var(--border)',
      }}
    >
      <div>
        <div
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 10.5,
            color: 'var(--text-faint)',
            letterSpacing: '0.06em',
          }}
        >
          {dateLabel} · {timeLabel}
        </div>
        {moodLabel && (
          <div
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 11,
              color: 'var(--text-muted)',
              marginTop: 4,
            }}
          >
            MOOD {moodLabel}
          </div>
        )}
      </div>
      <div>
        {entry.title && (
          <div
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 14,
              fontWeight: 500,
              color: 'var(--text)',
              marginBottom: 4,
            }}
          >
            {entry.title}
          </div>
        )}
        <div
          style={{
            fontFamily: 'var(--font-serif)',
            fontSize: 14,
            lineHeight: 1.55,
            color: 'var(--text)',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          &ldquo;{entry.body}&rdquo;
        </div>
      </div>
      <span style={{ color: 'var(--text-muted)' }}>›</span>
    </Link>
  )
}
