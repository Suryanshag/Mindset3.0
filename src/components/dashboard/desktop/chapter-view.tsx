import Link from 'next/link'
import { BookOpen, ClipboardList, Ticket } from 'lucide-react'
import type { ChapterData, TimelineItem } from '@/lib/queries/reflection'

function daysLater(sessionDate: Date, eventDate: Date): string {
  const diff = Math.round(
    (eventDate.getTime() - sessionDate.getTime()) / (1000 * 60 * 60 * 24)
  )
  if (diff <= 0) return 'That same day'
  if (diff === 1) return 'The next day'
  return `${diff} days later`
}

function verbForType(item: TimelineItem): string {
  switch (item.type) {
    case 'journal':
      return 'you wrote:'
    case 'assignment':
      return 'you completed:'
    case 'workshop':
      return 'you attended:'
    default:
      return ''
  }
}

export default function ChapterView({ chapter }: { chapter: ChapterData }) {
  const { session, timeline } = chapter

  const dateStr = session.date.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })

  const timeStr = session.date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })

  return (
    <div className="py-4">
      {/* Session header */}
      <div className="mb-8">
        <h1 className="text-[22px] font-medium text-text">
          Session with {session.doctorName}
        </h1>
        <p className="text-[14px] text-text-faint mt-1">
          {dateStr} &middot; {timeStr}
        </p>
      </div>

      {/* Session notes if any */}
      {session.notes && (
        <div className="mb-8">
          <div className="h-px mb-6" style={{ backgroundColor: 'var(--color-border)' }} />
          <p className="text-[15px] font-serif italic text-text-muted leading-[1.7]">
            &ldquo;{session.notes}&rdquo;
          </p>
        </div>
      )}

      {/* Timeline */}
      {timeline.length > 0 ? (
        <div>
          <div className="h-px mb-6" style={{ backgroundColor: 'var(--color-border)' }} />
          <p className="text-[11px] font-medium text-text-faint uppercase tracking-[0.6px] mb-6">
            After this session
          </p>

          <div className="space-y-8">
            {timeline.map((item, i) => {
              const dayLabel = daysLater(session.date, item.date)
              const verb = verbForType(item)

              return (
                <div key={`${item.type}-${i}`}>
                  {/* Prose intro */}
                  <p className="text-[15px] font-serif italic text-text-muted mb-3">
                    {dayLabel}, {verb}
                  </p>

                  {/* Card */}
                  {item.type === 'journal' && (
                    <JournalCard entry={item.data} />
                  )}
                  {item.type === 'assignment' && (
                    <AssignmentCard assignment={item.data} />
                  )}
                  {item.type === 'workshop' && (
                    <WorkshopCard workshop={item.data} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      ) : (
        <div>
          <div className="h-px mb-6" style={{ backgroundColor: 'var(--color-border)' }} />
          <p className="text-[14px] text-text-faint">
            Nothing else recorded from this period.
          </p>
        </div>
      )}
    </div>
  )
}

function JournalCard({
  entry,
}: {
  entry: { id: string; title: string | null; body: string; mood: number | null; entryDate: Date }
}) {
  const dateLabel = entry.entryDate.toLocaleDateString('en-US', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  })

  // Truncate body to ~150 chars
  const preview =
    entry.body.length > 150
      ? entry.body.slice(0, 150).trimEnd() + '...'
      : entry.body

  return (
    <Link
      href={`/user/practice/journal/${entry.id}`}
      className="block rounded-xl p-4 bg-bg-card transition-colors duration-150 hover:bg-white/80"
      style={{ border: '0.5px solid var(--color-border)' }}
    >
      <p className="text-[12px] text-text-faint mb-2">{dateLabel}</p>
      {entry.title && (
        <p className="text-[14px] font-medium text-text mb-1">{entry.title}</p>
      )}
      <p className="text-[15px] font-serif text-text-muted leading-[1.6] line-clamp-3">
        &ldquo;{preview}&rdquo;
      </p>
      <p className="text-[13px] text-primary font-medium mt-3 hover:underline">
        Read entry &rarr;
      </p>
    </Link>
  )
}

function AssignmentCard({
  assignment,
}: {
  assignment: { id: string; title: string; type: string; status: string; updatedAt: Date }
}) {
  const completedDate = assignment.updatedAt.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })

  const typeColor: Record<string, { bg: string; icon: string }> = {
    JOURNAL_PROMPT: { bg: 'bg-primary-tint', icon: 'text-primary' },
    READING: { bg: 'bg-[#E6F1FB]', icon: 'text-[#3B82F6]' },
    WORKSHEET: { bg: 'bg-accent-tint', icon: 'text-accent' },
    BREATHING: { bg: 'bg-purple-tint', icon: 'text-[#7C3AED]' },
    CUSTOM: { bg: 'bg-bg-app', icon: 'text-text-muted' },
  }
  const cfg = typeColor[assignment.type] ?? typeColor.CUSTOM

  return (
    <Link
      href={`/user/practice/assignments/${assignment.id}`}
      className="flex items-start gap-3 rounded-xl p-4 bg-bg-card transition-colors duration-150 hover:bg-white/80"
      style={{ border: '0.5px solid var(--color-border)' }}
    >
      <div className={`w-9 h-9 rounded-lg ${cfg.bg} flex items-center justify-center shrink-0`}>
        <ClipboardList size={16} className={cfg.icon} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-medium text-text">{assignment.title}</p>
        <p className="text-[12px] text-text-faint mt-0.5">
          Completed {completedDate}
        </p>
      </div>
      <span className="text-[13px] text-primary font-medium shrink-0 mt-0.5">
        View &rarr;
      </span>
    </Link>
  )
}

function WorkshopCard({
  workshop,
}: {
  workshop: { id: string; title: string; startsAt: Date }
}) {
  const dateLabel = workshop.startsAt.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
  })

  return (
    <Link
      href={`/user/discover/workshops/${workshop.id}`}
      className="flex items-start gap-3 rounded-xl p-4 bg-bg-card transition-colors duration-150 hover:bg-white/80"
      style={{ border: '0.5px solid var(--color-border)' }}
    >
      <div className="w-9 h-9 rounded-lg bg-accent-tint flex items-center justify-center shrink-0">
        <Ticket size={16} className="text-accent" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-medium text-text">{workshop.title}</p>
        <p className="text-[12px] text-text-faint mt-0.5">
          Attended {dateLabel}
        </p>
      </div>
      <span className="text-[13px] text-primary font-medium shrink-0 mt-0.5">
        View &rarr;
      </span>
    </Link>
  )
}
