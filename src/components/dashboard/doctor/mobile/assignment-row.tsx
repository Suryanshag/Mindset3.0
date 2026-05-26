'use client'

import { format } from 'date-fns'

interface Assignment {
  id: string
  title: string
  status: 'PENDING' | 'SUBMITTED' | 'REVIEWED' | string
  type?: 'CUSTOM' | 'JOURNAL_PROMPT' | 'READING' | 'WORKSHEET' | 'BREATHING' | string | null
  dueDate: string | null
  user?: { name: string } | null
  /** Override for the secondary line, e.g. on the patient-detail view
   *  where the patient's name is redundant. */
  secondaryLine?: string
}

const TYPE_CFG: Record<string, { label: string; bg: string; fg: string }> = {
  CUSTOM:         { label: 'Custom',    bg: 'var(--primary-tint)',           fg: 'var(--primary)' },
  JOURNAL_PROMPT: { label: 'Journal',   bg: 'var(--accent-tint)',            fg: 'var(--accent-deep)' },
  READING:        { label: 'Reading',   bg: 'var(--soft-blue)',              fg: 'var(--navy)' },
  WORKSHEET:      { label: 'Worksheet', bg: 'rgba(255,170,17,0.15)',         fg: '#8A5A1F' },
  BREATHING:      { label: 'Breathing', bg: 'rgba(86,154,150,0.18)',         fg: 'var(--deep-teal, #569A96)' },
}

const STATUS_CFG: Record<string, { label: string; bg: string; fg: string }> = {
  PENDING:   { label: 'Pending',   bg: 'rgba(255,170,17,0.15)', fg: '#8A5A1F' },
  SUBMITTED: { label: 'To review', bg: 'var(--accent-tint)',     fg: 'var(--accent-deep)' },
  REVIEWED:  { label: 'Reviewed',  bg: 'var(--primary-tint)',    fg: 'var(--primary)' },
}

interface Props {
  assignment: Assignment
  onClick: () => void
}

export default function AssignmentRow({ assignment, onClick }: Props) {
  const typeKey = assignment.type ?? 'CUSTOM'
  const tcfg = TYPE_CFG[typeKey] ?? { label: typeKey, bg: 'var(--primary-tint)', fg: 'var(--primary)' }
  const scfg = STATUS_CFG[assignment.status] ?? { label: assignment.status, bg: 'var(--bg-app)', fg: 'var(--text-muted)' }
  const due = assignment.dueDate ? format(new Date(assignment.dueDate), 'd MMM') : 'no due'
  const secondary = assignment.secondaryLine
    ?? `${assignment.user?.name ?? 'Patient'} · due ${due}`

  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-2xl p-3.5"
      style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}
    >
      <div className="flex items-center gap-2">
        <span
          className="inline-flex items-center gap-1.5 rounded-full font-extrabold uppercase"
          style={{
            background: tcfg.bg,
            color: tcfg.fg,
            padding: '3px 8px',
            fontSize: 10,
            letterSpacing: '0.08em',
          }}
        >
          <span className="w-[5px] h-[5px] rounded-full" style={{ background: tcfg.fg }} />
          {tcfg.label}
        </span>
        <span
          className="ml-auto rounded-full font-extrabold uppercase"
          style={{
            background: scfg.bg,
            color: scfg.fg,
            padding: '3px 8px',
            fontSize: 10,
            letterSpacing: '0.08em',
          }}
        >
          {scfg.label}
        </span>
      </div>
      <div className="text-[14px] font-extrabold mt-2 leading-[1.25]" style={{ color: 'var(--text)' }}>
        {assignment.title}
      </div>
      <div className="text-[11.5px] mt-1" style={{ color: 'var(--text-muted)' }}>
        {secondary}
      </div>
    </button>
  )
}

export { TYPE_CFG as ASSIGNMENT_TYPE_CFG, STATUS_CFG as ASSIGNMENT_STATUS_CFG }
