type Props = {
  stats: {
    sessionsCompleted: number
    mindfulHours: number
    streak: number
  }
}

export default function StatsRow({ stats }: Props) {
  const items = [
    {
      label: 'Streak',
      value: `${stats.streak}d`,
      show: stats.streak > 0,
    },
    {
      label: 'Sessions',
      value: String(stats.sessionsCompleted),
      show: stats.sessionsCompleted > 0,
    },
    {
      label: 'Mindful hrs',
      value: String(stats.mindfulHours),
      show: stats.mindfulHours > 0,
    },
  ]

  const visible = items.filter((i) => i.show)

  if (visible.length === 0) return null

  return (
    <div
      className={`grid gap-2 ${
        visible.length === 1
          ? 'grid-cols-1 max-w-[140px] mx-auto'
          : visible.length === 2
            ? 'grid-cols-2'
            : 'grid-cols-3'
      }`}
    >
      {visible.map((item) => (
        <div
          key={item.label}
          className="bg-bg-card rounded-2xl px-3 py-3 flex flex-col items-center justify-center"
          style={{ border: '0.5px solid var(--color-border)', height: '64px' }}
        >
          <p className="text-[20px] font-medium text-text leading-tight">
            {item.value}
          </p>
          <p className="text-[10px] text-text-faint mt-0.5">{item.label}</p>
        </div>
      ))}
    </div>
  )
}
