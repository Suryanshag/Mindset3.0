import Link from 'next/link'
import { BCap, BCard, BChip } from './b-atoms'
import BPageHeader from './b-page-header'
import JournalDeleteButton from '@/components/dashboard/journal/journal-delete-button'

// Phase 3d — Single journal entry read view (Direction B port).
// Left column = the prose body in serif. Right column = meta + edit/
// delete affordances. Doctor-response card from the design is omitted
// because the JournalEntry model doesn't carry doctor replies yet.

type Props = {
  entry: {
    id: string
    title: string | null
    body: string
    mood: 1 | 2 | 3 | 4 | 5 | null
    entryDate: Date
    createdAt: Date
  }
  prevEntryId: string | null
  nextEntryId: string | null
}

export default function BJournalRead({ entry, prevEntryId, nextEntryId }: Props) {
  const dateLabel = entry.entryDate.toLocaleDateString('en-IN', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
  const timeLabel = entry.entryDate.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  })
  const wordCount = entry.body.trim().split(/\s+/).filter(Boolean).length
  const moodBit = entry.mood ? ` · mood ${entry.mood}/5` : ''

  return (
    <>
      <BPageHeader
        title={entry.title || 'Untitled entry'}
        breadcrumb={[
          { label: 'PRACTICE', href: '/user/practice' },
          { label: 'JOURNAL', href: '/user/practice/journal' },
          { label: (entry.title || 'UNTITLED').toUpperCase() },
        ]}
        back="/user/practice/journal"
        sub={`${dateLabel} · ${timeLabel} IST${moodBit} · ${wordCount} ${wordCount === 1 ? 'word' : 'words'} · private`}
        ctas={['search']}
      />

      {/* Status row */}
      <div className="flex items-center gap-2">
        <BChip kind="neutral">PRIVATE</BChip>
        <span
          style={{
            fontFamily: 'var(--font-mono)',
            fontSize: 11,
            color: 'var(--text-faint)',
          }}
        >
          AUTOSAVED · YOUR EYES ONLY
        </span>
        <div style={{ flex: 1 }} />
        {prevEntryId ? (
          <Link
            href={`/user/practice/journal/${prevEntryId}`}
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 12,
              padding: '7px 12px',
              borderRadius: 999,
              background: 'transparent',
              color: 'var(--text-muted)',
              border: '1px solid var(--border)',
            }}
          >
            ‹ previous
          </Link>
        ) : (
          <span
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 12,
              padding: '7px 12px',
              color: 'var(--text-faint)',
            }}
          >
            ‹ previous
          </span>
        )}
        {nextEntryId ? (
          <Link
            href={`/user/practice/journal/${nextEntryId}`}
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 12,
              padding: '7px 12px',
              borderRadius: 999,
              background: 'transparent',
              color: 'var(--text-muted)',
              border: '1px solid var(--border)',
            }}
          >
            next ›
          </Link>
        ) : (
          <span
            style={{
              fontFamily: 'var(--font-heading)',
              fontSize: 12,
              padding: '7px 12px',
              color: 'var(--text-faint)',
            }}
          >
            next ›
          </span>
        )}
      </div>

      {/* 2-col grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 24 }}>
        {/* LEFT — body */}
        <BCard padding={36}>
          <div
            style={{
              fontFamily: 'var(--font-serif)',
              fontSize: 17,
              lineHeight: 1.75,
              color: 'var(--text)',
              whiteSpace: 'pre-wrap',
            }}
          >
            {entry.body}
          </div>
          <div
            style={{
              borderTop: '1px solid var(--border)',
              marginTop: 28,
              paddingTop: 14,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <div
              style={{
                fontFamily: 'var(--font-mono)',
                fontSize: 10.5,
                color: 'var(--text-faint)',
              }}
            >
              {wordCount} {wordCount === 1 ? 'WORD' : 'WORDS'} · {timeLabel} IST
            </div>
            <div className="flex gap-2 items-center">
              <Link
                href={`/user/practice/journal/${entry.id}/edit`}
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: 12,
                  padding: '7px 12px',
                  borderRadius: 999,
                  background: 'transparent',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                }}
              >
                Edit
              </Link>
              <JournalDeleteButton entryId={entry.id} />
            </div>
          </div>
        </BCard>

        {/* RIGHT — meta */}
        <div className="flex flex-col gap-3.5">
          <BCard>
            <BCap>About this entry</BCap>
            <dl
              style={{
                marginTop: 12,
                display: 'grid',
                gridTemplateColumns: 'auto 1fr',
                gap: '8px 14px',
                fontSize: 13,
              }}
            >
              <dt style={{ color: 'var(--text-muted)' }}>Written</dt>
              <dd style={{ color: 'var(--text)' }}>
                {entry.createdAt.toLocaleDateString('en-IN', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </dd>
              <dt style={{ color: 'var(--text-muted)' }}>Mood</dt>
              <dd style={{ color: 'var(--text)' }}>
                {entry.mood ? `${entry.mood} / 5` : '—'}
              </dd>
              <dt style={{ color: 'var(--text-muted)' }}>Words</dt>
              <dd style={{ color: 'var(--text)' }}>{wordCount}</dd>
            </dl>
          </BCard>

          <BCard>
            <BCap>Privacy</BCap>
            <p
              style={{
                fontFamily: 'var(--font-serif)',
                fontStyle: 'italic',
                fontSize: 13.5,
                color: 'var(--text-muted)',
                marginTop: 10,
                lineHeight: 1.6,
              }}
            >
              Journal entries are private to you. Nothing is shared with anyone
              unless you choose. Editing or deleting only affects your own copy.
            </p>
          </BCard>
        </div>
      </div>
    </>
  )
}
