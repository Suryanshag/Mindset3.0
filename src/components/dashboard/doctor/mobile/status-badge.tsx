type Status = 'PENDING' | 'CONFIRMED' | 'COMPLETED' | 'CANCELLED' | 'NO_SHOW'
type Size = 'sm' | 'lg'

const CFG: Record<Status, { label: string; bg: string; fg: string; dot: string }> = {
  PENDING:   { label: 'Pending',   bg: 'rgba(255,170,17,0.15)', fg: '#8A5A1F',            dot: '#FFAA11' },
  CONFIRMED: { label: 'Confirmed', bg: 'rgba(74,184,116,0.14)', fg: '#2A7A4A',            dot: '#3A9C5C' },
  COMPLETED: { label: 'Completed', bg: 'var(--soft-blue)',      fg: 'var(--navy)',        dot: 'var(--navy)' },
  CANCELLED: { label: 'Cancelled', bg: 'rgba(170,40,20,0.10)',  fg: '#A53A1F',            dot: '#A53A1F' },
  // NO_SHOW MUST stay neutral gray — not red. Patient missing a session
  // isn't an error state, it's a fact.
  NO_SHOW:   { label: 'No-show',   bg: 'rgba(0,0,0,0.06)',      fg: 'var(--text-muted)',  dot: 'var(--text-muted)' },
}

export { CFG as STATUS_CFG }

interface Props {
  status: Status | string
  size?: Size
}

export default function StatusBadge({ status, size = 'sm' }: Props) {
  const cfg = CFG[status as Status] ?? CFG.PENDING
  const isLg = size === 'lg'
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full font-extrabold uppercase"
      style={{
        background: cfg.bg,
        color: cfg.fg,
        padding: isLg ? '5px 11px' : '3px 9px',
        fontSize: isLg ? 11.5 : 10.5,
        letterSpacing: '0.08em',
      }}
    >
      <span
        className="w-[5px] h-[5px] rounded-full"
        style={{ background: cfg.dot }}
      />
      {cfg.label}
    </span>
  )
}
