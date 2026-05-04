import Link from 'next/link'
import { ClipboardList, Ticket, PenLine } from 'lucide-react'
import type { ChapterData, TimelineItem, PreSessionAssignment } from '@/lib/queries/reflection'

const NUMBER_WORDS = ['zero', 'one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten']

function truncateAtWord(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text
  const truncated = text.slice(0, maxLength)
  const lastSpace = truncated.lastIndexOf(' ')
  return (lastSpace > maxLength * 0.7
    ? truncated.slice(0, lastSpace)
    : truncated) + '\u2026'
}

function capitalize(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function numberToWord(n: number): string {
  return NUMBER_WORDS[n] ?? String(n)
}

type Verb = 'wrote' | 'completed' | 'attended'

function verbForType(item: TimelineItem): Verb {
  switch (item.type) {
    case 'journal': return 'wrote'
    case 'assignment': return 'completed'
    case 'workshop': return 'attended'
    default: return 'completed'
  }
}

function relativeIntro(daysAfter: number, kind: Verb): string {
  if (daysAfter <= 0) return `That same day, you ${kind}:`
  if (daysAfter === 1) return `The next day, you ${kind}:`
  if (daysAfter <= 3) return `${capitalize(numberToWord(daysAfter))} days later, you ${kind}:`
  if (daysAfter <= 7) return `Later that week, you ${kind}:`
  if (daysAfter <= 14) return `The following week, you ${kind}:`
  return `${daysAfter} days later, you ${kind}:`
}

export default function ChapterView({ chapter }: { chapter: ChapterData }) {
  const { session, timeline, preSessionAssignments } = chapter

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
          {dateStr} · {timeStr}
        </p>
      </div>

      {/* Session notes if any */}
      {session.notes && (
        <div className="mb-8">
          <div className="h-px mb-6" style={{ backgroundColor: 'var(--color-border)' }} />
          <p className="text-[15px] font-serif italic text-text-muted leading-[1.7]">
            {'\u201C'}{session.notes}{'\u201D'}
          </p>
        </div>
      )}

      {/* Pre-session work — upcoming sessions with pending assignments */}
      {preSessionAssignments.length > 0 && (
        <div className="mb-8">
          <div className="h-px mb-6" style={{ backgroundColor: 'var(--color-border)' }} />
          <p className="text-[11px] font-medium text-text-faint uppercase tracking-[0.6px] mb-3">
            Before this session
          </p>
          <p className="text-[16px] font-serif italic text-text-muted mb-4">
            Your therapist asked you to:
          </p>
          <div className="space-y-3">
            {(preSessionAssignments.length > 3
              ? preSessionAssignments.slice(0, 2)
              : preSessionAssignments
            ).map((a) => (
              <PreSessionCard key={a.id} assignment={a} />
            ))}
          </div>
          {preSessionAssignments.length > 3 && (
            <Link
              href="/user/practice"
              className="text-[13px] text-primary font-medium mt-3 inline-block hover:underline"
            >
              View all assignments \u2192
            </Link>
          )}
        </div>
      )}

      {/* Timeline — only rendered when there IS content */}
      {timeline.length > 0 && (
        <div>
          <div className="h-px mb-6" style={{ backgroundColor: 'var(--color-border)' }} />
          <p className="text-[11px] font-medium text-text-faint uppercase tracking-[0.6px] mb-6">
            After this session
          </p>

          <div className="space-y-8">
            {timeline.map((item, i) => {
              const daysAfter = Math.round(
                (item.date.getTime() - session.date.getTime()) / (1000 * 60 * 60 * 24)
              )
              const verb = verbForType(item)
              const intro = relativeIntro(daysAfter, verb)

              return (
                <div key={`${item.type}-${i}`}>
                  <p className="text-[16px] font-serif italic text-text-muted mb-2 mt-6 first:mt-0">
                    {intro}
                  </p>

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

  const preview = truncateAtWord(entry.body, 150)

  return (
    <Link
      href={`/user/practice/journal/${entry.id}`}
      className="block rounded-xl p-4 bg-bg-card transition-all duration-150 lg:hover:shadow-sm lg:hover:-translate-y-0.5"
      style={{ border: '0.5px solid var(--color-border)' }}
    >
      <p className="text-[12px] text-text-faint mb-2">{dateLabel}</p>
      {entry.title && (
        <p className="text-[14px] font-medium text-text mb-1">{entry.title}</p>
      )}
      <p className="text-[15px] font-serif text-text-muted leading-[1.6] line-clamp-3">
        {'\u201C'}{preview}{'\u201D'}
      </p>
      <p className="text-[13px] text-primary font-medium mt-3">
        Read entry {'\u2192'}
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
      className="flex items-start gap-3 rounded-xl p-4 bg-bg-card transition-all duration-150 lg:hover:shadow-sm lg:hover:-translate-y-0.5"
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
        View {'\u2192'}
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
      className="flex items-start gap-3 rounded-xl p-4 bg-bg-card transition-all duration-150 lg:hover:shadow-sm lg:hover:-translate-y-0.5"
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
        View {'\u2192'}
      </span>
    </Link>
  )
}

function PreSessionCard({
  assignment,
}: {
  assignment: PreSessionAssignment
}) {
  const now = new Date()
  const isOverdue = assignment.dueDate && assignment.dueDate < now
  const dateLabel = assignment.dueDate
    ? assignment.dueDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
    : null

  const typeIcon: Record<string, { bg: string; icon: string }> = {
    JOURNAL_PROMPT: { bg: 'bg-primary-tint', icon: 'text-primary' },
    READING: { bg: 'bg-[#E6F1FB]', icon: 'text-[#3B82F6]' },
    WORKSHEET: { bg: 'bg-accent-tint', icon: 'text-accent' },
    BREATHING: { bg: 'bg-purple-tint', icon: 'text-[#7C3AED]' },
    CUSTOM: { bg: 'bg-bg-app', icon: 'text-text-muted' },
  }
  const cfg = typeIcon[assignment.type] ?? typeIcon.CUSTOM

  return (
    <Link
      href={`/user/practice/assignments/${assignment.id}`}
      className="flex items-start gap-3 rounded-xl p-4 bg-bg-card transition-all duration-150 lg:hover:shadow-sm lg:hover:-translate-y-0.5"
      style={{ border: '0.5px solid var(--color-border)' }}
    >
      <div className={`w-9 h-9 rounded-lg ${cfg.bg} flex items-center justify-center shrink-0`}>
        <PenLine size={16} className={cfg.icon} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-[14px] font-medium text-text">{assignment.title}</p>
        {dateLabel && (
          <p className={`text-[12px] mt-0.5 ${isOverdue ? 'text-text-muted' : 'text-text-faint'}`}>
            {isOverdue ? `Was due ${dateLabel}` : `Due ${dateLabel}`}
          </p>
        )}
      </div>
      <span className="text-[13px] text-primary font-medium shrink-0 mt-0.5">
        Begin {'\u2192'}
      </span>
    </Link>
  )
}
