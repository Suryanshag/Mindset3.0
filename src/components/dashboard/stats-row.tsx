import { Flame, CheckCircle, Clock } from 'lucide-react'

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
      Icon: Flame,
      color: 'text-accent',
      bg: 'bg-accent-tint',
      show: stats.streak > 0,
    },
    {
      label: 'Sessions',
      value: String(stats.sessionsCompleted),
      Icon: CheckCircle,
      color: 'text-primary',
      bg: 'bg-primary-tint',
      show: stats.sessionsCompleted > 0,
    },
    {
      label: 'Mindful hrs',
      value: String(stats.mindfulHours),
      Icon: Clock,
      color: 'text-primary-soft',
      bg: 'bg-primary-tint',
      show: stats.mindfulHours > 0,
    },
  ]

  const visible = items.filter((i) => i.show)

  if (visible.length === 0) return null

  return (
    <div
      className={`grid gap-2.5 ${
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
          className="bg-bg-card rounded-2xl p-3 flex flex-col items-center gap-1.5"
          style={{ border: '0.5px solid var(--color-border)' }}
        >
          <div
            className={`w-8 h-8 rounded-full ${item.bg} flex items-center justify-center`}
          >
            <item.Icon size={16} className={item.color} />
          </div>
          <p className="text-[16px] font-medium text-text">{item.value}</p>
          <p className="text-[11px] text-text-faint">{item.label}</p>
        </div>
      ))}
    </div>
  )
}
