interface Props {
  value: number | string
  label: string
  accent: string
}

export default function StatTile({ value, label, accent }: Props) {
  return (
    <div
      className="rounded-[14px] px-3.5 py-3"
      style={{
        background: 'var(--bg-card)',
        boxShadow: 'var(--shadow-card)',
        borderTop: `3px solid ${accent}`,
      }}
    >
      <div className="ms-display text-[24px] leading-none" style={{ color: accent }}>
        {value}
      </div>
      <div
        className="text-[10px] font-extrabold uppercase mt-1"
        style={{ color: 'var(--text-muted)', letterSpacing: '0.10em' }}
      >
        {label}
      </div>
    </div>
  )
}
